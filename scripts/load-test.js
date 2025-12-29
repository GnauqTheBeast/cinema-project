// k6 Load Test Script for Cinema Booking System
// Run: k6 run scripts/load-test.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const bookingDuration = new Trend('booking_duration');
const searchDuration = new Trend('search_duration');
const bookingSuccess = new Counter('booking_success');
const bookingFailure = new Counter('booking_failure');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 50 },   // Spike to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Spike to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],

  thresholds: {
    // 95% of requests should be below 500ms
    'http_req_duration': ['p(95)<500'],

    // 99% of requests should be below 1s
    'http_req_duration{name:GetMovies}': ['p(99)<1000'],

    // Error rate should be below 1%
    'errors': ['rate<0.01'],

    // 95% of checks should pass
    'checks': ['rate>0.95'],

    // Minimum throughput
    'http_reqs': ['rate>50'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:80';

// Test data
const testUsers = [
  { email: 'alice@email.com', password: 'password' },
  { email: 'bob@email.com', password: 'password' },
];

let authToken = null;

export function setup() {
  // Login to get token
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: testUsers[0].email,
    password: testUsers[0].password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const body = loginRes.json();
    return { token: body.data?.token || body.token };
  }

  console.log('Setup failed: Unable to login');
  return { token: null };
}

export default function(data) {
  const token = data.token;

  // Scenario 1: Browse movies (70% of users)
  if (Math.random() < 0.7) {
    browseMovies();
  }

  // Scenario 2: Search and view details (20% of users)
  else if (Math.random() < 0.9) {
    searchAndViewDetails();
  }

  // Scenario 3: Book tickets (10% of users)
  else if (token) {
    bookTickets(token);
  }

  sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
}

function browseMovies() {
  group('Browse Movies', function() {
    const start = new Date();

    // Get movies list
    let res = http.get(`${BASE_URL}/api/v1/movies?page=1&size=12`, {
      tags: { name: 'GetMovies' },
    });

    const success = check(res, {
      'movies status is 200': (r) => r.status === 200,
      'movies response has data': (r) => {
        try {
          const body = r.json();
          return body.data !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    searchDuration.add(new Date() - start);
    errorRate.add(!success);

    if (res.status === 200) {
      sleep(0.5);

      // Get showtimes
      res = http.get(`${BASE_URL}/api/v1/showtimes?page=1&size=20`, {
        tags: { name: 'GetShowtimes' },
      });

      check(res, {
        'showtimes status is 200': (r) => r.status === 200,
      });
    }
  });
}

function searchAndViewDetails() {
  group('Search and View Details', function() {
    // Search movies
    let res = http.get(`${BASE_URL}/api/v1/movies?page=1&size=10`, {
      tags: { name: 'SearchMovies' },
    });

    if (res.status === 200) {
      try {
        const body = res.json();
        const movies = body.data?.data || body.data;

        if (movies && movies.length > 0) {
          // Pick random movie
          const movie = movies[Math.floor(Math.random() * movies.length)];

          sleep(0.5);

          // Get movie details
          res = http.get(`${BASE_URL}/api/v1/movies/${movie.id}`, {
            tags: { name: 'GetMovieDetails' },
          });

          check(res, {
            'movie details loaded': (r) => r.status === 200,
          });

          sleep(1);

          // Get showtimes for movie
          res = http.get(`${BASE_URL}/api/v1/showtimes?movie_id=${movie.id}`, {
            tags: { name: 'GetMovieShowtimes' },
          });

          check(res, {
            'movie showtimes loaded': (r) => r.status === 200,
          });
        }
      } catch (e) {
        console.log('Error parsing response:', e);
      }
    }
  });
}

function bookTickets(token) {
  group('Book Tickets Flow', function() {
    const start = new Date();
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      tags: { name: 'BookingFlow' },
    };

    // 1. Get showtimes
    let res = http.get(`${BASE_URL}/api/v1/showtimes?page=1&size=10`, params);

    if (res.status !== 200) {
      errorRate.add(1);
      bookingFailure.add(1);
      return;
    }

    let showtimeId = null;
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

    if (!showtimeId) {
      errorRate.add(1);
      return;
    }

    sleep(0.5);

    // 2. Get available seats
    res = http.get(`${BASE_URL}/api/v1/seats/showtime/${showtimeId}`, params);

    if (res.status !== 200) {
      errorRate.add(1);
      bookingFailure.add(1);
      return;
    }

    let seatIds = [];
    try {
      const body = res.json();
      const seats = body.data?.seats || body.data;

      if (seats && seats.length > 0) {
        // Pick 2 random available seats
        const availableSeats = seats.filter(s => s.status === 'AVAILABLE' || !s.is_booked);
        if (availableSeats.length >= 2) {
          seatIds = [
            availableSeats[0].id,
            availableSeats[1].id,
          ];
        }
      }
    } catch (e) {
      console.log('Error parsing seats:', e);
    }

    if (seatIds.length === 0) {
      // No available seats
      errorRate.add(0);
      return;
    }

    sleep(1);

    // 3. Create booking
    const booking = {
      showtime_id: showtimeId,
      seat_ids: seatIds,
      booking_type: 'ONLINE',
    };

    res = http.post(
      `${BASE_URL}/api/v1/bookings`,
      JSON.stringify(booking),
      params
    );

    const bookingCreated = check(res, {
      'booking created': (r) => r.status === 200 || r.status === 201,
      'booking has id': (r) => {
        try {
          const body = r.json();
          return body.data?.id !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (bookingCreated) {
      bookingSuccess.add(1);

      try {
        const bookingData = res.json();
        const bookingId = bookingData.data?.id;

        if (bookingId) {
          sleep(0.5);

          // 4. Create payment
          const payment = {
            booking_id: bookingId,
            amount: bookingData.data?.total_amount || 50000,
          };

          res = http.post(
            `${BASE_URL}/api/v1/payments`,
            JSON.stringify(payment),
            params
          );

          check(res, {
            'payment created': (r) => r.status === 200 || r.status === 201,
          });
        }
      } catch (e) {
        console.log('Error processing booking:', e);
      }

      bookingDuration.add(new Date() - start);
    } else {
      bookingFailure.add(1);
      errorRate.add(1);
    }
  });
}

export function teardown(data) {
  console.log('Load test completed');
}