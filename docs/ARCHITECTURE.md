# System Architecture

This document provides a comprehensive overview of the Cinema Booking System architecture, including system design, microservices structure, data flow, and technology choices.

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Microservices Architecture](#microservices-architecture)
- [Service Details](#service-details)
- [Data Architecture](#data-architecture)
- [Communication Patterns](#communication-patterns)
- [Security Architecture](#security-architecture)
- [Scalability and Performance](#scalability-and-performance)
- [Technology Stack](#technology-stack)

## Overview

The Cinema Booking System follows a **microservices architecture** pattern, where the application is decomposed into small, independent services that communicate through well-defined APIs. This architecture enables:

- **Scalability**: Individual services can scale independently based on demand
- **Maintainability**: Smaller codebases are easier to understand and modify
- **Technology Diversity**: Each service can use the most appropriate technology stack
- **Fault Isolation**: Failures in one service don't cascade to others
- **Team Autonomy**: Different teams can work on different services independently

### Key Architectural Principles

1. **Service Independence**: Each microservice owns its domain logic and data
2. **API-First Design**: Services communicate through well-defined REST and gRPC APIs
3. **Database Per Service**: Each service has its own database schema (logical separation)
4. **Event-Driven Communication**: Asynchronous communication via events where appropriate
5. **Centralized Gateway**: Single entry point for all client requests
6. **Stateless Services**: Services don't maintain session state (delegated to Redis)
7. **Defense in Depth**: Multiple layers of security (gateway, service-level auth, database)

## Architecture Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│                                                                 │
│                   ┌──────────────────┐                          │
│                   │  Web Browser     │                          │
│                   │  (React SPA)     │                          │
│                   └────────┬─────────┘                          │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx Proxy    │
                    │  (Port 80)      │
                    └────────┬────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      API Gateway Layer                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │           API Gateway (Go/Gin - Port 8000)               │    │
│  │  • Request Routing        • Rate Limiting                │    │
│  │  • Authentication         • Request/Response Logging     │    │
│  │  • Authorization          • Health Checks                │    │
│  │  • CORS Handling          • Request ID Tracking          │    │
│  └────────────────────────┬─────────────────────────────────┘    │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    Business Services Layer                       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   Auth   │  │   User   │  │  Movie   │  │ Booking  │          │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │          │
│  │Node:3001 │  │Node:8005 │  │ Go:8083  │  │ Go:8082  │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │             │                │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐          │
│  │ Payment  │  │ Notify   │  │Analytics │  │ Chatbot  │          │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │          │
│  │ Go:8086  │  │ Go:8080  │  │Node:8087 │  │Node:8089 │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │             │                │
│  ┌────▼─────────────▼─────────────▼─────────────▼─────┐          │
│  │           Worker Service (Go:8088)                  │         │
│  │           Background Job Processing                 │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                  │
└──────────────────────┬───────────────────────┬───────────────────┘
                       │                       │
                       │      ┌────────────────┘
                       │      │
┌──────────────────────▼──────▼────────────────────────────────────┐
│                     Data Layer                                   │
│                                                                  │
│  ┌─────────────────────────────────────┐  ┌─────────────────┐    │
│  │   PostgreSQL Database (Port 5432)   │  │  Redis Cache    │    │
│  │   • User data & authentication      │  │  (Port 6379)    │    │
│  │   • Movie catalog & genres          │  │  • Sessions     │    │
│  │   • Rooms, seats, showtimes         │  │  • Cache        │    │
│  │   • Bookings & tickets              │  │  • Rate limit   │    │
│  │   • Payments & transactions         │  │  • Pub/Sub      │    │
│  │   • Analytics data                  │  └─────────────────┘    │
│  │   • Chat history & embeddings       │                         │
│  └─────────────────────────────────────┘                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     External Services                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Google     │  │   Ethereum   │  │   Payment    │            │
│  │   Gemini AI  │  │   Blockchain │  │   Gateways   │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Service Interaction Flow

```
Client → Nginx → API Gateway → Service → Database
                      ↓
                   Redis Cache
                      ↓
              gRPC Inter-service
                 Communication
```

## Microservices Architecture

### Service Decomposition Strategy

Services are organized by business capability:

1. **User Management Domain**
   - Auth Service: Authentication and authorization
   - User Service: User profile and preferences

2. **Cinema Domain**
   - Movie Service: Movie catalog and showtimes
   - Booking Service: Ticket reservations and seat management

3. **Financial Domain**
   - Payment Service: Payment processing and blockchain integration

4. **Communication Domain**
   - Notification Service: Real-time notifications via WebSocket

5. **Analytics Domain**
   - Analytics Service: Business intelligence and reporting

6. **Support Domain**
   - Chatbot Service: AI-powered customer support
   - Worker Service: Background job processing

7. **Infrastructure Domain**
   - API Gateway: Request routing and cross-cutting concerns

## Service Details

### 1. API Gateway (Go/Gin - Port 8000)

**Responsibilities:**
- Route requests to appropriate microservices
- Authenticate and authorize requests using JWT
- Rate limiting to prevent abuse
- Request/response logging and monitoring
- CORS handling
- Health check aggregation
- Request ID generation for tracing

**Technology:** Go with Gin framework

**Key Features:**
- Redis-backed rate limiting (100 req/sec, 200 burst)
- JWT validation with public/admin route separation
- Service discovery via config file
- Health check polling of downstream services

**Configuration:**
- Config file: `api-gateway/config.yaml`
- Routes mapped to backend services
- Public vs authenticated endpoints
- Admin-only endpoints

### 2. Auth Service (Node.js/TypeScript - Port 3001)

**Responsibilities:**
- User registration and login
- Password hashing (bcrypt)
- JWT token generation and validation
- Session management
- Password reset functionality
- OAuth integration (future)

**Technology:** Node.js with Express and Sequelize ORM

**Database Tables:**
- `users`: User accounts
- `roles`: User roles (admin, staff, customer)
- `permissions`: Fine-grained permissions
- `role_permissions`: Role-permission mapping

**Authentication Flow:**
```
1. Client sends credentials → Auth Service
2. Auth Service validates against database
3. On success, generates JWT token
4. Token includes user_id, role, expiry
5. Client includes token in subsequent requests
6. API Gateway validates token
```

### 3. User Service (Node.js/TypeScript - Port 8005)

**Responsibilities:**
- User profile management (CRUD)
- Customer loyalty points tracking
- Staff profile management
- User preferences and settings
- Blockchain wallet management

**Technology:** Node.js with Express and Sequelize ORM

**Database Tables:**
- `customer_profile`: Customer-specific data (points, wallet)
- `staff_profile`: Staff-specific data

### 4. Movie Service (Go/Echo - Port 8083)

**Responsibilities:**
- Movie catalog management
- Genre management
- Movie search and filtering
- Movie details and metadata
- Image/poster URL management
- Showtime scheduling

**Technology:** Go with Echo framework and Bun ORM

**Database Tables:**
- `movies`: Movie information (title, description, duration, etc.)
- `genres`: Movie genres
- `movie_genres`: Many-to-many relationship
- `showtimes`: Movie screening schedule with pricing

**Key Features:**
- Full-text search on movie titles and descriptions
- Redis caching for popular movies
- Pagination and filtering
- Admin-only create/update/delete operations

### 5. Booking Service (Go/Echo - Port 8082)

**Responsibilities:**
- Ticket booking and reservation
- Seat selection and availability
- Booking status management
- Room and seat management
- Ticket generation and validation

**Technology:** Go with Echo framework and Bun ORM

**Database Tables:**
- `rooms`: Cinema auditoriums
- `seats`: Seat inventory with types (REGULAR, PREMIUM)
- `bookings`: Reservation records
- `tickets`: Individual tickets with QR codes

**Booking Flow:**
```
1. Client requests available seats for showtime
2. Service queries database for AVAILABLE seats
3. Client selects seats and creates booking
4. Service creates booking with PENDING status
5. Seats are marked as RESERVED (temporary hold)
6. Payment service processes payment
7. On success, booking status → CONFIRMED
8. Tickets generated with UNUSED status
9. On failure, seats released back to AVAILABLE
```

**Concurrency Handling:**
- Database transactions for atomic seat reservation
- Row-level locking to prevent double booking
- Timeout mechanism for abandoned reservations

### 6. Payment Service (Go/Gin - Port 8086)

**Responsibilities:**
- Payment processing (traditional + blockchain)
- Transaction recording
- Payment status tracking
- Refund processing
- Ethereum smart contract interaction
- Payment webhook handling

**Technology:** Go with Gin framework and go-ethereum library

**Database Tables:**
- `payments`: Payment transaction records

**Payment Methods:**
1. **Traditional**: Credit card, debit card (future integration)
2. **Blockchain**: Ethereum-based payments

**Ethereum Integration:**
- Smart contract deployment and interaction
- Transaction signing and broadcasting
- Gas estimation
- Transaction receipt verification

### 7. Notification Service (Go - Port 8080)

**Responsibilities:**
- Real-time WebSocket connections
- Push notifications to clients
- Email notifications (future)
- SMS notifications (future)
- Notification history

**Technology:** Go with WebSocket support

**Database Tables:**
- `notifications`: Notification records

**Notification Types:**
- Booking confirmation
- Payment success/failure
- Showtime reminders
- Promotional messages

**WebSocket Protocol:**
```
Client → ws://localhost:8080/ws?token=JWT
Server → Authenticates and maintains connection
Server → Pushes notifications in real-time
Client → Receives and displays notifications
```

### 8. Analytics Service (Node.js/TypeScript - Port 8087)

**Responsibilities:**
- Revenue reporting
- Booking statistics
- Movie performance analytics
- Customer insights
- Business intelligence queries

**Technology:** Node.js with Express and Sequelize ORM

**Analytics Provided:**
- Revenue by time period (daily, weekly, monthly)
- Revenue by movie
- Revenue by showtime
- Booking conversion rates
- Popular movies and genres
- Customer lifetime value

**Optimization:**
- Redis caching for expensive queries
- Database views for common aggregations
- gRPC for efficient data transfer

### 9. Chatbot Service (Node.js/TypeScript - Port 8089)

**Responsibilities:**
- AI-powered customer support
- Natural language understanding
- Context-aware responses
- Document-based knowledge retrieval (RAG)
- Chat history management

**Technology:** Node.js with Google Gemini API

**Database Tables:**
- `documents`: Uploaded knowledge base documents
- `document_chunks`: Text chunks with embeddings (pgvector)
- `chats`: Conversation history

**RAG (Retrieval Augmented Generation) Flow:**
```
1. User asks question
2. Question converted to embedding vector
3. Similar document chunks retrieved from database
4. Context + question sent to Gemini API
5. AI generates contextual response
6. Response returned to user
```

**Features:**
- PDF document upload for knowledge base
- Vector similarity search using pgvector
- Conversation context maintenance
- Multi-turn dialogue support

### 10. Worker Service (Go - Port 8088)

**Responsibilities:**
- Background job processing
- Scheduled tasks (cron jobs)
- Event processing from outbox pattern
- Data cleanup and maintenance
- Report generation

**Technology:** Go

**Job Types:**
- Expired reservation cleanup
- Email sending (queued)
- Report generation
- Database maintenance
- Cache warming

**Event Sourcing:**
- Reads from `outbox_events` table
- Processes events asynchronously
- Updates event status after processing
- Ensures eventual consistency

## Data Architecture

### Database Design

The system uses a **shared database** (PostgreSQL) with **logical schema separation** per service.

#### Schema Overview

**User Management Schema:**
```sql
users (id, email, password_hash, name, role_id, created_at, updated_at)
roles (id, name, description)
permissions (id, name, description)
role_permissions (role_id, permission_id)
customer_profile (user_id, points, onchain_wallet_address)
staff_profile (user_id, employee_id, department)
```

**Movie Catalog Schema:**
```sql
movies (id, title, description, duration, release_date, poster_url, trailer_url, rating, created_at, updated_at)
genres (id, name, description)
movie_genres (movie_id, genre_id)
```

**Cinema Schema:**
```sql
rooms (id, name, capacity, room_type, created_at, updated_at)
seats (id, room_id, seat_number, row_label, seat_type, status, created_at, updated_at)
showtimes (id, movie_id, room_id, start_time, end_time, base_price, created_at, updated_at)
```

**Booking Schema:**
```sql
bookings (id, user_id, showtime_id, total_price, status, booking_date, created_at, updated_at)
tickets (id, booking_id, seat_id, price, ticket_code, status, created_at, updated_at)
```

**Payment Schema:**
```sql
payments (id, booking_id, user_id, amount, payment_method, status, transaction_id, created_at, updated_at)
```

**Analytics Schema:**
```sql
-- Derived from existing tables via views and aggregations
```

**Chatbot Schema:**
```sql
documents (id, filename, content, uploaded_at)
document_chunks (id, document_id, content, embedding vector(1536), created_at)
chats (id, user_id, message, response, created_at)
```

**Event Sourcing Schema:**
```sql
outbox_events (id, event_type, payload, status, created_at, processed_at)
notifications (id, user_id, type, title, message, read, created_at)
```

### Data Relationships

```
users 1───────* bookings
users 1───────* payments
users 1───────1 customer_profile
users 1───────1 staff_profile
users *───────1 roles
roles *───────* permissions

movies *──────* genres (via movie_genres)
movies 1──────* showtimes

rooms 1───────* seats
rooms 1───────* showtimes

showtimes 1───* bookings
showtimes 1───* seats (availability check)

bookings 1────* tickets
bookings 1────1 payments
```

### Database Features

**PostgreSQL Extensions:**
- `pgvector`: Vector similarity search for AI embeddings
- `uuid-ossp`: UUID generation
- `pg_trgm`: Fuzzy text search

**Indexing Strategy:**
- Primary keys: B-tree indexes
- Foreign keys: Indexed for join performance
- Search fields: GIN indexes for full-text search
- Embeddings: IVFFlat index for vector similarity

**Connection Pooling:**
- Go services: Bun ORM connection pooling
- Node services: Sequelize connection pooling
- Max connections per service: 20-50 based on load

## Communication Patterns

### Synchronous Communication

#### REST APIs

**Client ↔ API Gateway ↔ Services**
- Protocol: HTTP/1.1
- Format: JSON
- Authentication: JWT Bearer tokens
- Standard HTTP methods: GET, POST, PUT, DELETE

**Advantages:**
- Simple and well-understood
- Easy to test and debug
- Good for request-response patterns

#### gRPC

**Service ↔ Service**
- Protocol: HTTP/2
- Format: Protocol Buffers
- Used for high-performance inter-service communication

**Example Use Cases:**
- Analytics service querying booking/movie data
- Worker service triggering notifications
- Payment service confirming bookings

**Advantages:**
- High performance (binary protocol)
- Type-safe contracts (.proto files)
- Bi-directional streaming support

### Asynchronous Communication

#### Event-Driven Architecture

**Outbox Pattern:**
```
Service → Database (outbox_events table)
Worker Service → Polls outbox table
Worker Service → Processes event
Worker Service → Marks event as processed
```

**Event Types:**
- `booking.created`
- `payment.completed`
- `booking.cancelled`
- `user.registered`

**Advantages:**
- Guaranteed delivery (at-least-once)
- Decouples services
- Enables eventual consistency

#### WebSocket

**Server → Client (Real-time)**
- Notification service maintains persistent connections
- Server pushes updates to connected clients
- Used for real-time booking updates, notifications

## Security Architecture

### Authentication

**JWT (JSON Web Tokens):**
```
Header.Payload.Signature

Payload:
{
  "user_id": 123,
  "email": "user@example.com",
  "role": "customer",
  "exp": 1234567890
}
```

**Token Flow:**
1. User logs in via Auth Service
2. Service generates JWT signed with secret
3. Client stores token (localStorage/cookie)
4. Client includes token in Authorization header
5. API Gateway validates signature and expiry
6. Gateway extracts user info and forwards to service

### Authorization

**Role-Based Access Control (RBAC):**
- Roles: Admin, Staff, Customer
- Permissions: Fine-grained actions (e.g., `movies.create`, `users.delete`)
- Enforcement: At API Gateway and service level

**Access Levels:**
- **Public**: Movie browsing, registration
- **Authenticated**: Booking, profile management
- **Staff**: Showtime management, customer support
- **Admin**: Full system access

### Data Security

**Encryption:**
- Passwords: bcrypt hashing (10 rounds)
- JWT: HMAC SHA-256 signature
- In-transit: HTTPS/TLS (production)
- At-rest: Database encryption (configurable)

**Security Best Practices:**
- Input validation at service level
- SQL injection prevention (parameterized queries)
- XSS protection (output encoding)
- CORS enforcement
- Rate limiting
- Request timeout limits
- Secrets management (environment variables)

## Scalability and Performance

### Horizontal Scaling

**Stateless Services:**
- All services are stateless
- Session state stored in Redis
- Can run multiple instances behind load balancer

**Scaling Strategy:**
```
Load Balancer → [Service Instance 1]
             → [Service Instance 2]
             → [Service Instance 3]
```

### Caching Strategy

**Redis Cache:**
- Frequently accessed movies
- User sessions
- Rate limit counters
- Temporary seat reservations
- API response caching

**Cache Invalidation:**
- Time-based expiration (TTL)
- Event-based invalidation (on update/delete)
- Cache-aside pattern

### Database Optimization

**Query Optimization:**
- Indexed foreign keys
- Covering indexes for common queries
- Query result pagination
- Materialized views for analytics

**Read Replicas:**
- Master for writes
- Read replicas for analytics queries
- Connection routing in application

### Load Balancing

**Nginx:**
- Round-robin distribution
- Health check-based routing
- WebSocket connection upgrade support

## Technology Stack

### Languages and Frameworks

**Backend:**
- **Go 1.21+**: High-performance services (gateway, movie, booking, payment, notification, worker)
  - Frameworks: Gin, Echo
  - ORM: Bun
- **Node.js 18+**: Business logic services (auth, user, analytics, chatbot)
  - Framework: Express
  - ORM: Sequelize
  - Language: TypeScript

**Frontend:**
- **React 18**: Single-page application
- **React Router v6**: Client-side routing
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **Ethers.js**: Blockchain integration

### Infrastructure

**Databases:**
- PostgreSQL 15 (primary data store)
- Redis 7.4 (caching, sessions)

**Containerization:**
- Docker (container runtime)
- Docker Compose (multi-container orchestration)

**Reverse Proxy:**
- Nginx (load balancing, SSL termination)

### External Services

**AI/ML:**
- Google Gemini API (chatbot)

**Blockchain:**
- Ethereum (payments)
- Infura/Alchemy (RPC provider)

## Design Patterns

### Implemented Patterns

1. **API Gateway Pattern**: Single entry point for clients
2. **Service Registry**: Config-based service discovery
3. **Circuit Breaker**: Graceful degradation on service failure (future)
4. **Retry Pattern**: Automatic retry with exponential backoff
5. **Outbox Pattern**: Reliable event publishing
6. **CQRS (partial)**: Read models in analytics service
7. **Repository Pattern**: Data access abstraction
8. **Dependency Injection**: Service construction in Go
9. **Middleware Pattern**: Cross-cutting concerns (logging, auth)
10. **Saga Pattern**: Distributed transaction management (booking + payment)

## Deployment Architecture

### Docker Compose (Development)

```
Docker Network: cinema-network
  ├── postgres (database)
  ├── redis (cache)
  ├── api-gateway
  ├── auth-service
  ├── user-service
  ├── movie-service
  ├── booking-service
  ├── payment-service
  ├── notification-service
  ├── analytics-service
  ├── chatbot
  ├── worker-service
  ├── FE (frontend)
  └── nginx (reverse proxy)
```

### Production Deployment (Kubernetes - Future)

```
Kubernetes Cluster
  ├── Ingress Controller (Nginx)
  ├── Service Mesh (Istio)
  ├── Deployments (one per service)
  ├── StatefulSets (PostgreSQL, Redis)
  ├── ConfigMaps (service configuration)
  ├── Secrets (credentials)
  └── Persistent Volumes (database storage)
```

## Observability

### Logging

**Structured Logging:**
- JSON format
- Log levels: DEBUG, INFO, WARN, ERROR
- Correlation IDs for request tracing

**Log Aggregation:**
- Centralized logging (ELK stack, future)
- Log retention policies

### Monitoring

**Metrics (Future):**
- Prometheus for metrics collection
- Grafana for visualization
- Key metrics: request rate, error rate, latency, resource usage

### Tracing

**Distributed Tracing (Future):**
- Jaeger or Zipkin
- Request ID propagation across services
- End-to-end request visualization

## Future Enhancements

1. **Service Mesh**: Istio for advanced traffic management
2. **Event Streaming**: Kafka for high-volume event processing
3. **GraphQL Gateway**: Unified data access layer
4. **Mobile App**: React Native or Flutter
5. **Recommendation Engine**: ML-based movie recommendations
6. **Advanced Analytics**: Real-time dashboards
7. **Multi-tenancy**: Support for multiple cinema chains
8. **Internationalization**: Multi-language support
9. **CDN Integration**: Static asset delivery
10. **Auto-scaling**: Kubernetes HPA based on metrics

## References

- [API Documentation](API.md)
- [Development Guide](DEVELOPMENT.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Running the Project](RUNNING.md)
