# API Documentation

Complete API reference for the Cinema Booking System. All requests go through the API Gateway at `http://localhost:8000`.

## Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Auth Endpoints](#auth-endpoints)
- [User Endpoints](#user-endpoints)
- [Movie Endpoints](#movie-endpoints)
- [Booking Endpoints](#booking-endpoints)
- [Payment Endpoints](#payment-endpoints)
- [Notification Endpoints](#notification-endpoints)
- [Analytics Endpoints](#analytics-endpoints)
- [Chatbot Endpoints](#chatbot-endpoints)
- [WebSocket API](#websocket-api)

## API Overview

### Base URL

```
Production: https://api.cinema.com
Development: http://localhost:8000
```

### API Version

All endpoints are prefixed with `/api/v1/`

### Request Format

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### Response Format

All responses are in JSON format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Rate Limiting

- **Limit**: 100 requests per second per IP
- **Burst**: 200 requests
- **Headers**:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Authentication

### JWT Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. Register or login to get a JWT token
2. Include the token in all authenticated requests
3. Token expires after 1 hour (configurable)
4. Refresh token by logging in again

### Public vs Protected Routes

**Public Routes** (no authentication required):
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/movies`
- `GET /api/v1/movies/:id`
- `GET /api/v1/showtimes`
- `GET /api/v1/health`

**Protected Routes** (authentication required):
- All booking operations
- Payment processing
- User profile management
- Notifications

**Admin-Only Routes**:
- Movie management (create, update, delete)
- User management
- Analytics reports
- System configuration

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Invalid credentials or token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Auth Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer",
      "created_at": "2025-01-10T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Validation:**
- Email: Valid email format, unique
- Password: Min 8 characters
- Name: Required, max 100 characters

---

### Login

Authenticate user and get JWT token.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  },
  "message": "Login successful"
}
```

---

### Logout

Invalidate current session.

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /api/v1/users/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "customer",
    "profile": {
      "loyalty_points": 150,
      "wallet_address": "0x1234..."
    },
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": "2025-01-10T10:00:00Z"
  }
}
```

---

### Update User Profile

Update authenticated user's information.

**Endpoint:** `PUT /api/v1/users/me`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+9876543210"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Updated",
    "phone": "+9876543210"
  },
  "message": "Profile updated successfully"
}
```

---

### Get User by ID (Admin)

Get any user's profile (admin only).

**Endpoint:** `GET /api/v1/users/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`

---

## Movie Endpoints

### List Movies

Get all movies with pagination and filtering.

**Endpoint:** `GET /api/v1/movies`

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `per_page` (integer, default: 20, max: 100): Items per page
- `genre` (string): Filter by genre name
- `search` (string): Search in title and description
- `sort_by` (string): Sort field (`title`, `release_date`, `rating`)
- `order` (string): Sort order (`asc`, `desc`)

**Example:** `GET /api/v1/movies?page=1&per_page=10&genre=Action&sort_by=rating&order=desc`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "The Great Adventure",
      "description": "An epic journey...",
      "duration": 120,
      "release_date": "2025-01-15",
      "rating": "PG-13",
      "poster_url": "https://example.com/poster.jpg",
      "trailer_url": "https://youtube.com/watch?v=...",
      "genres": ["Action", "Adventure"],
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

---

### Get Movie Details

Get detailed information about a specific movie.

**Endpoint:** `GET /api/v1/movies/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "The Great Adventure",
    "description": "An epic journey through uncharted territories...",
    "duration": 120,
    "release_date": "2025-01-15",
    "rating": "PG-13",
    "poster_url": "https://example.com/poster.jpg",
    "trailer_url": "https://youtube.com/watch?v=...",
    "genres": [
      { "id": 1, "name": "Action" },
      { "id": 2, "name": "Adventure" }
    ],
    "showtimes": [
      {
        "id": 1,
        "start_time": "2025-01-15T18:00:00Z",
        "end_time": "2025-01-15T20:00:00Z",
        "room": {
          "id": 1,
          "name": "Hall 1",
          "capacity": 100
        },
        "base_price": 15.00,
        "available_seats": 85
      }
    ]
  }
}
```

---

### Create Movie (Admin)

Create a new movie.

**Endpoint:** `POST /api/v1/admin/movies`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "title": "New Movie",
  "description": "Movie description",
  "duration": 120,
  "release_date": "2025-02-01",
  "rating": "PG-13",
  "poster_url": "https://example.com/poster.jpg",
  "trailer_url": "https://youtube.com/watch?v=...",
  "genre_ids": [1, 2]
}
```

**Response:** `201 Created`

---

### Update Movie (Admin)

Update existing movie.

**Endpoint:** `PUT /api/v1/admin/movies/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:** (partial update supported)
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response:** `200 OK`

---

### Delete Movie (Admin)

Delete a movie.

**Endpoint:** `DELETE /api/v1/admin/movies/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Movie deleted successfully"
}
```

---

## Booking Endpoints

### Get Available Seats

Get available seats for a showtime.

**Endpoint:** `GET /api/v1/showtimes/:showtime_id/seats`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "showtime": {
      "id": 1,
      "movie": "The Great Adventure",
      "start_time": "2025-01-15T18:00:00Z",
      "room": "Hall 1"
    },
    "seats": [
      {
        "id": 1,
        "seat_number": "A1",
        "row": "A",
        "type": "REGULAR",
        "status": "AVAILABLE",
        "price": 15.00
      },
      {
        "id": 2,
        "seat_number": "A2",
        "row": "A",
        "type": "PREMIUM",
        "status": "RESERVED",
        "price": 20.00
      }
    ],
    "summary": {
      "total_seats": 100,
      "available_seats": 85,
      "reserved_seats": 10,
      "occupied_seats": 5
    }
  }
}
```

---

### Create Booking

Create a new booking (reserve seats).

**Endpoint:** `POST /api/v1/bookings`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "showtime_id": 1,
  "seat_ids": [1, 2, 3]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "booking_id": 123,
    "showtime_id": 1,
    "movie": "The Great Adventure",
    "start_time": "2025-01-15T18:00:00Z",
    "room": "Hall 1",
    "seats": [
      { "seat_number": "A1", "type": "REGULAR", "price": 15.00 },
      { "seat_number": "A2", "type": "REGULAR", "price": 15.00 },
      { "seat_number": "A3", "type": "PREMIUM", "price": 20.00 }
    ],
    "total_price": 50.00,
    "status": "PENDING",
    "created_at": "2025-01-10T12:00:00Z",
    "expires_at": "2025-01-10T12:15:00Z"
  },
  "message": "Booking created. Please complete payment within 15 minutes."
}
```

**Business Rules:**
- Seats must be available
- Maximum 10 seats per booking
- Booking expires after 15 minutes if not paid
- Duplicate seat selection returns error

---

### Get Booking Details

Get booking information.

**Endpoint:** `GET /api/v1/bookings/:booking_id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "booking_id": 123,
    "user_id": 1,
    "showtime": {
      "id": 1,
      "movie": "The Great Adventure",
      "start_time": "2025-01-15T18:00:00Z",
      "room": "Hall 1"
    },
    "tickets": [
      {
        "id": 1,
        "seat": "A1",
        "price": 15.00,
        "ticket_code": "TKT-ABC123",
        "qr_code": "data:image/png;base64,...",
        "status": "UNUSED"
      }
    ],
    "total_price": 50.00,
    "status": "CONFIRMED",
    "payment_status": "PAID",
    "created_at": "2025-01-10T12:00:00Z"
  }
}
```

---

### List User Bookings

Get all bookings for authenticated user.

**Endpoint:** `GET /api/v1/bookings`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (integer): Page number
- `per_page` (integer): Items per page
- `status` (string): Filter by status (`PENDING`, `CONFIRMED`, `CANCELLED`)

**Response:** `200 OK`

---

### Cancel Booking

Cancel an existing booking.

**Endpoint:** `DELETE /api/v1/bookings/:booking_id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "booking_id": 123,
    "status": "CANCELLED",
    "refund_amount": 50.00,
    "refund_status": "PROCESSING"
  },
  "message": "Booking cancelled successfully"
}
```

**Business Rules:**
- Can only cancel bookings at least 2 hours before showtime
- Confirmed bookings trigger refund process
- Pending bookings are cancelled immediately

---

## Payment Endpoints

### Create Payment

Process payment for a booking.

**Endpoint:** `POST /api/v1/payments`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "booking_id": 123,
  "payment_method": "CARD",
  "card_details": {
    "card_number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "2025",
    "cvv": "123"
  }
}
```

**Or for blockchain payment:**
```json
{
  "booking_id": 123,
  "payment_method": "ETHEREUM",
  "transaction_hash": "0xabc123..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "payment_id": 456,
    "booking_id": 123,
    "amount": 50.00,
    "payment_method": "CARD",
    "status": "SUCCESS",
    "transaction_id": "TXN-XYZ789",
    "created_at": "2025-01-10T12:05:00Z"
  },
  "message": "Payment successful"
}
```

**Status Values:**
- `PENDING`: Payment initiated
- `SUCCESS`: Payment completed
- `FAILED`: Payment failed
- `REFUNDED`: Payment refunded

---

### Get Payment Details

Get payment information.

**Endpoint:** `GET /api/v1/payments/:payment_id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Notification Endpoints

### List Notifications

Get user's notifications.

**Endpoint:** `GET /api/v1/notifications`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (integer): Page number
- `per_page` (integer): Items per page
- `read` (boolean): Filter by read status

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "BOOKING_CONFIRMED",
      "title": "Booking Confirmed",
      "message": "Your booking for 'The Great Adventure' is confirmed",
      "read": false,
      "created_at": "2025-01-10T12:05:00Z",
      "data": {
        "booking_id": 123
      }
    }
  ],
  "meta": {
    "unread_count": 5
  }
}
```

---

### Mark Notification as Read

Mark notification as read.

**Endpoint:** `PUT /api/v1/notifications/:id/read`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

### Mark All as Read

Mark all notifications as read.

**Endpoint:** `PUT /api/v1/notifications/read-all`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Analytics Endpoints

All analytics endpoints require admin authentication.

### Revenue Report

Get revenue analytics.

**Endpoint:** `GET /api/v1/analytics/revenue`

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `start_date` (string, ISO 8601): Start date
- `end_date` (string, ISO 8601): End date
- `group_by` (string): Grouping (`day`, `week`, `month`, `movie`, `room`)

**Example:** `GET /api/v1/analytics/revenue?start_date=2025-01-01&end_date=2025-01-31&group_by=day`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_revenue": 15000.00,
    "total_bookings": 300,
    "average_ticket_price": 50.00,
    "breakdown": [
      {
        "date": "2025-01-10",
        "revenue": 500.00,
        "bookings": 10
      }
    ]
  }
}
```

---

### Booking Statistics

Get booking analytics.

**Endpoint:** `GET /api/v1/analytics/bookings`

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `start_date` (string): Start date
- `end_date` (string): End date

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_bookings": 300,
    "confirmed_bookings": 280,
    "cancelled_bookings": 20,
    "conversion_rate": 93.33,
    "popular_movies": [
      {
        "movie_id": 1,
        "title": "The Great Adventure",
        "booking_count": 50,
        "revenue": 2500.00
      }
    ],
    "popular_showtimes": [
      {
        "hour": 18,
        "booking_count": 80
      }
    ]
  }
}
```

---

## Chatbot Endpoints

### Ask Question

Send a question to the AI chatbot.

**Endpoint:** `POST /api/v1/chatbot/ask`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "message": "What movies are playing this weekend?",
  "conversation_id": "optional-conversation-id"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv-123",
    "message": "What movies are playing this weekend?",
    "response": "This weekend we have several great movies playing including 'The Great Adventure', 'Comedy Night', and 'Space Odyssey'. Would you like to know the showtimes?",
    "timestamp": "2025-01-10T12:00:00Z"
  }
}
```

---

### Upload Knowledge Document

Upload a PDF document to the chatbot knowledge base (admin only).

**Endpoint:** `POST /api/v1/chatbot/documents`

**Headers:**
- `Authorization: Bearer <admin-token>`
- `Content-Type: multipart/form-data`

**Request Body:**
- `file` (file): PDF document

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "document_id": 1,
    "filename": "cinema-policies.pdf",
    "chunks_created": 25,
    "uploaded_at": "2025-01-10T12:00:00Z"
  },
  "message": "Document uploaded and processed successfully"
}
```

---

## WebSocket API

### Connect to Notifications

Establish WebSocket connection for real-time notifications.

**URL:** `ws://localhost:8080/ws?token=<jwt-token>`

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8080/ws?token=' + userToken);

ws.onopen = () => {
  console.log('Connected to notifications');
};

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('Received notification:', notification);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from notifications');
};
```

**Message Format:**
```json
{
  "type": "BOOKING_CONFIRMED",
  "title": "Booking Confirmed",
  "message": "Your booking is confirmed",
  "data": {
    "booking_id": 123
  },
  "timestamp": "2025-01-10T12:05:00Z"
}
```

**Notification Types:**
- `BOOKING_CREATED`: New booking created
- `BOOKING_CONFIRMED`: Payment successful
- `BOOKING_CANCELLED`: Booking cancelled
- `PAYMENT_SUCCESS`: Payment processed
- `PAYMENT_FAILED`: Payment failed
- `SHOWTIME_REMINDER`: Reminder before showtime

---

## Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get Movies (with token):**
```bash
TOKEN="your-jwt-token"

curl http://localhost:8000/api/v1/movies \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Import the API collection (if available)
2. Set environment variables:
   - `base_url`: `http://localhost:8000`
   - `token`: `<jwt-token>`
3. Use `{{base_url}}` and `{{token}}` in requests

### Using JavaScript/Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.data.token);
  return response.data;
};

// Get movies
const getMovies = async () => {
  const response = await api.get('/movies');
  return response.data.data;
};

// Create booking
const createBooking = async (showtimeId, seatIds) => {
  const response = await api.post('/bookings', {
    showtime_id: showtimeId,
    seat_ids: seatIds
  });
  return response.data.data;
};
```

## API Versioning

The API uses URL-based versioning (`/api/v1/`). When breaking changes are introduced, a new version will be created (`/api/v2/`).

### Deprecation Policy

- Old versions supported for 6 months after new version release
- Deprecation warnings in response headers
- Migration guides provided

## Support

For API issues or questions:
- Check the [Development Guide](DEVELOPMENT.md)
- Review [Architecture Documentation](ARCHITECTURE.md)
- Open an issue on GitHub
