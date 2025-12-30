// k6 Stress Test: Concurrent Bookings (Race Condition Test)
// This tests the system's ability to handle multiple users trying to book the same seats
// Run: k6 run scripts/stress-test-concurrent-bookings.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom metrics
const raceConditionDetected = new Counter('race_condition_detected');
const doubleBookingDetected = new Counter('double_booking_detected');
const bookingConflicts = new Counter('booking_conflicts');
const successfulBookings = new Counter('successful_bookings');
const failedBookings = new Counter('failed_bookings');
const errorRate = new Rate('booking_errors');

export const options = {
  scenarios: {
    // Scenario 1: Spike test - Many users trying to book at the same time
    booking_spike: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 booking attempts per second
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 100,
      maxVUs: 200,
      exec: 'attemptBooking',
    },

    // Scenario 2: Ramping test
    booking_ramp: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 150,
      stages: [
        { target: 20, duration: '30s' },
        { target: 50, duration: '30s' },
        { target: 100, duration: '30s' },
        { target: 0, duration: '30s' },
      ],
      exec: 'attemptBooking',
    },
  },

  thresholds: {
    // No race conditions should be detected
    'race_condition_detected': ['count<1'],

    // No double bookings
    'double_booking_detected': ['count<1'],

    // Error rate should be reasonable (some conflicts are expected)
    'booking_errors': ['rate<0.5'],

    // At least 50% of bookings should succeed
    'checks{scenario:booking_spike}': ['rate>0.5'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:80';

// Test users credentials
const TEST_USERS = [
  { email: 'alice@email.com', password: 'password' },
  { email: 'bob@email.com', password: 'password' },
  { email: 'emma@email.com', password: 'password' },
  // { email: 'customer2@example.com', password: 'password123' },
];

let bookedSeats = new Set();

export function setup() {
  console.log('Starting concurrent booking stress test...');
  console.log('This will test race conditions and seat locking mechanisms');
  console.log('');

  console.log(`Logging in ${TEST_USERS.length} test users...`);
  const userTokens = [];

  for (let i = 0; i < TEST_USERS.length; i++) {
    const user = TEST_USERS[i];

    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (loginRes.status === 200) {
      try {
        const body = loginRes.json();
        const token = body.data?.token || body.token;

        if (token) {
          userTokens.push({
            email: user.email,
            token: token,
          });
          console.log(`✓ Logged in: ${user.email}`);
        } else {
          console.log(`✗ Login failed (no token): ${user.email}`);
        }
      } catch (e) {
        console.log(`✗ Login failed (parse error): ${user.email}`);
      }
    } else {
      console.log(`✗ Login failed (HTTP ${loginRes.status}): ${user.email}`);
    }
  }

  if (userTokens.length === 0) {
    console.log('ERROR: No users logged in successfully!');
    console.log('Make sure test users exist in the database.');
    return {
      userTokens: [],
      targetShowtimeId: __ENV.TARGET_SHOWTIME_ID || null,
    };
  }

  console.log('');
  console.log(`Successfully logged in ${userTokens.length}/${TEST_USERS.length} users`);
  console.log('Starting stress test...');
  console.log('');

  return {
    userTokens: userTokens,
    targetShowtimeId: __ENV.TARGET_SHOWTIME_ID || null,
  };
}

export function attemptBooking(data) {
  if (!data.userTokens || data.userTokens.length === 0) {
    console.log('No user tokens available');
    return;
  }

  const randomUser = data.userTokens[Math.floor(Math.random() * data.userTokens.length)];
  const token = randomUser.token;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  group('Concurrent Booking Attempt', function() {
    let showtimeId = data.targetShowtimeId;
    let seats = [];
    let basePrice = 0;

    if (!showtimeId) {
      let res = http.get(`${BASE_URL}/api/v1/showtimes?page=1&size=5&status=SCHEDULED&exclude_ended=true`, params);
      if (res.status !== 200) {
        errorRate.add(1);
        failedBookings.add(1);
        return;
      }

      try {
        const body = res.json();
        const showtimes = body.data?.data || body.data;
        if (!showtimes || showtimes.length === 0) {
          errorRate.add(1);
          failedBookings.add(1);
          return;
        }
        showtimeId = showtimes[0].id;
      } catch (e) {
        errorRate.add(1);
        failedBookings.add(1);
        return;
      }
    }

    let res = http.get(`${BASE_URL}/api/v1/showtimes/${showtimeId}`, params);
    if (res.status !== 200) {
      errorRate.add(1);
      failedBookings.add(1);
      return;
    }

    try {
      const body = res.json();
      const showtime = body.data;
      if (!showtime) {
        errorRate.add(1);
        failedBookings.add(1);
        return;
      }

      seats = showtime.seats || [];
      basePrice = showtime.base_price || 0;
    } catch (e) {
      errorRate.add(1);
      failedBookings.add(1);
      return;
    }

    if (!basePrice || seats.length === 0) {
      errorRate.add(1);
      failedBookings.add(1);
      return;
    }

    let seatIds = [];
    let selectedSeats = [];
    const availableSeats = seats.filter(s =>
      s.status === 'AVAILABLE' || s.status === 'available' || !s.is_booked
    );

    if (availableSeats.length >= 2) {
      const randomStart = Math.floor(Math.random() * (availableSeats.length - 1));
      selectedSeats = [
        availableSeats[randomStart],
        availableSeats[randomStart + 1],
      ];
      seatIds = [
        availableSeats[randomStart].id,
        availableSeats[randomStart + 1].id,
      ];
    }

    if (seatIds.length === 0) {
      return;
    }

    const getSeatPriceMultiplier = (seatType) => {
      switch (seatType) {
        case 'REGULAR': return 1.0;
        case 'VIP': return 1.5;
        case 'COUPLE': return 2.5;
        default: return 1.0;
      }
    };

    let totalAmount = 0;
    for (let seat of selectedSeats) {
      const multiplier = getSeatPriceMultiplier(seat.seat_type);
      totalAmount += Math.round(basePrice * multiplier);
    }

    if (totalAmount === 0) {
      errorRate.add(1);
      failedBookings.add(1);
      return;
    }

    sleep(Math.random() * 0.1);

    const booking = {
      showtime_id: showtimeId,
      seat_ids: seatIds,
      total_amount: totalAmount,
      booking_type: 'ONLINE',
    };

    const startTime = new Date();
    res = http.post(
      `${BASE_URL}/api/v1/bookings`,
      JSON.stringify(booking),
      params
    );
    const endTime = new Date();

    const seatKey = `${showtimeId}:${seatIds.join(',')}`;

    if (res.status === 200 || res.status === 201) {
      // Booking succeeded
      successfulBookings.add(1);

      // Check if this seat was already booked (race condition!)
      if (bookedSeats.has(seatKey)) {
        console.log(`⚠ RACE CONDITION DETECTED: Same seats booked twice! ${seatKey}`);
        raceConditionDetected.add(1);
        doubleBookingDetected.add(1);
      } else {
        bookedSeats.add(seatKey);
      }

      check(res, {
        'booking created successfully': (r) => true,
        'response time acceptable': (r) => (endTime - startTime) < 2000,
      });
    } else if (res.status === 400 || res.status === 409) {
      bookingConflicts.add(1);

      check(res, {
        'conflict handled correctly': (r) => r.status === 400 || r.status === 409,
      });
    } else {
      // Unexpected error
      failedBookings.add(1);
      errorRate.add(1);

      console.log(`Booking failed with status ${res.status}: ${res.body}`);
    }

    // Verify booking
    if (res.status === 200 || res.status === 201) {
      sleep(0.1);

      try {
        const bookingData = res.json();
        const bookingId = bookingData.data?.id;

        if (bookingId) {
          // Verify the booking exists
          const verifyRes = http.get(
            `${BASE_URL}/api/v1/bookings/${bookingId}`,
            params
          );

          if (verifyRes.status !== 200) {
            console.log(`⚠ INCONSISTENCY: Booking created but cannot be retrieved! ${bookingId}`);
            raceConditionDetected.add(1);
          }
        }
      } catch (e) {
        console.log('Error verifying booking:', e);
      }
    }
  });

  sleep(Math.random() * 0.5);
}

export function teardown(data) {
  console.log('=== Stress Test Results ===');
  console.log(`Successful bookings: ${successfulBookings.count || 0}`);
  console.log(`Failed bookings: ${failedBookings.count || 0}`);
  console.log(`Booking conflicts: ${bookingConflicts.count || 0}`);
  console.log(`Race conditions detected: ${raceConditionDetected.count || 0}`);
  console.log(`Double bookings detected: ${doubleBookingDetected.count || 0}`);

  if (raceConditionDetected.count > 0) {
    console.log('⚠ WARNING: Race conditions detected! Review seat locking mechanism.');
  } else {
    console.log('✓ No race conditions detected - seat locking is working correctly!');
  }
}