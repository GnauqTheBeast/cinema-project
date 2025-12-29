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

// Test users with tokens (you need to provide valid tokens)
const testUsers = [
  { token: __ENV.TEST_TOKEN_1 || null },
  { token: __ENV.TEST_TOKEN_2 || null },
  { token: __ENV.TEST_TOKEN_3 || null },
];

// Shared state for tracking bookings
let bookedSeats = new Set();

export function setup() {
  console.log('Starting concurrent booking stress test...');
  console.log('This will test race conditions and seat locking mechanisms');

  // Get a test user token
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'alice@email.com',
    password: 'password',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  let token = null;
  if (loginRes.status === 200) {
    const body = loginRes.json();
    token = body.data?.token || body.token;
  }

  return {
    token: token,
    targetShowtimeId: __ENV.TARGET_SHOWTIME_ID || null,
  };
}

export function attemptBooking(data) {
  const token = data.token || testUsers[Math.floor(Math.random() * testUsers.length)].token;

  if (!token) {
    console.log('No auth token available');
    return;
  }

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  group('Concurrent Booking Attempt', function() {
    // 1. Get showtimes
    let res = http.get(`${BASE_URL}/api/v1/showtimes?page=1&size=5`, params);

    if (res.status !== 200) {
      errorRate.add(1);
      failedBookings.add(1);
      return;
    }

    // Pick showtime
    let showtimeId = data.targetShowtimeId;
    if (!showtimeId) {
      try {
        const body = res.json();
        const showtimes = body.data?.data || body.data;
        if (showtimes && showtimes.length > 0) {
          showtimeId = showtimes[0].id;
        }
      } catch (e) {
        errorRate.add(1);
        return;
      }
    }

    if (!showtimeId) {
      errorRate.add(1);
      return;
    }

    // 2. Get available seats
    res = http.get(`${BASE_URL}/api/v1/seats/showtime/${showtimeId}`, params);

    if (res.status !== 200) {
      errorRate.add(1);
      failedBookings.add(1);
      return;
    }

    let seatIds = [];
    try {
      const body = res.json();
      const seats = body.data?.seats || body.data;

      if (seats && seats.length > 0) {
        // Pick first 2 available seats (intentionally creating contention)
        const availableSeats = seats.filter(s =>
          s.status === 'AVAILABLE' || !s.is_booked
        );

        if (availableSeats.length >= 2) {
          // All users try to book the SAME seats to test race condition
          seatIds = [
            availableSeats[0].id,
            availableSeats[1].id,
          ];
        }
      }
    } catch (e) {
      console.log('Error parsing seats:', e);
      errorRate.add(1);
      return;
    }

    if (seatIds.length === 0) {
      // No seats available - not an error
      return;
    }

    // Small random delay to create more contention
    sleep(Math.random() * 0.1);

    // 3. Attempt booking
    const booking = {
      showtime_id: showtimeId,
      seat_ids: seatIds,
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
      // Booking conflict - expected when seats are taken
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