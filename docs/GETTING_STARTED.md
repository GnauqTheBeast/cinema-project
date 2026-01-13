# Getting Started

This guide will help you get the Cinema Booking System up and running on your local machine.

## Prerequisites

Ensure you have the following installed on your system:

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Docker** | 20.10+ | Container runtime |
| **Docker Compose** | 2.0+ | Multi-container orchestration |
| **Node.js** | 18+ | Frontend development |
| **npm** or **yarn** | Latest | Package management |
| **Go** | 1.21+ | Backend services (optional for local dev) |
| **PostgreSQL** | 15+ | Database (optional, included in Docker) |
| **Redis** | 7+ | Caching (optional, included in Docker) |

> **Note**: Docker and Docker Compose are sufficient for running the entire system. Other tools are only needed for local development outside containers.

---

## Quick Start (Docker)

Get the system running in under 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/cinema-project.git
cd cinema-project

# 2. Start all services with Docker Compose
docker compose up -d --build

# 3. Wait for services to be healthy (30-60 seconds)
docker compose ps

# 4. Run database migrations
cd migrate
go run main.go reset

# 5. Access the application
# Frontend: http://localhost
# API Gateway: http://localhost:8000
# Notification WebSocket: ws://localhost:8080/ws
```

---

## Development Setup (Local)

For active development on individual services:

### Frontend Setup

```bash
cd FE

# Install dependencies
npm install
# or
yarn install

# Start development server
npm start
# or
yarn start

# Frontend will be available at http://localhost:3000
```

### Backend Service Setup (Example: Movie Service)

```bash
cd movie-service

# Install Go dependencies
go mod download

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the service
go run main.go

# Service will be available at http://localhost:8083
```

---

## Running the Project

### Using Docker Compose (Recommended)

```bash
# Start all services in detached mode
docker compose up -d

# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f movie-service

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Rebuild and restart a specific service
docker compose up -d --build booking-service
```

### Running Individual Services

#### Frontend

```bash
cd FE
npm start
# Access at http://localhost:3000
```

#### Backend Services

Each service can be run independently:

```bash
# Example: Movie Service
cd movie-service
go run main.go

# Example: Auth Service
cd auth-service
npm run dev
```

---

## Database Management

```bash
# Run migrations (from migrate directory)
cd migrate
go run main.go reset    # Reset and migrate
go run main.go up       # Run pending migrations
go run main.go down     # Rollback last migration

# Access PostgreSQL directly
docker exec -it postgres psql -U postgres -d cinema_app

# Backup database
docker exec postgres pg_dump -U postgres cinema_app > backup.sql

# Restore database
docker exec -i postgres psql -U postgres cinema_app < backup.sql
```

---

## Accessing Services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost | React web application |
| **API Gateway** | http://localhost:8000 | Main API endpoint |
| **Auth Service** | http://localhost:3001 | Authentication endpoints |
| **Movie Service** | http://localhost:8083 | Movie catalog API |
| **Booking Service** | http://localhost:8082 | Booking management API |
| **Payment Service** | http://localhost:8086 | Payment processing API |
| **Notification Service** | ws://localhost:8080/ws | WebSocket notifications |
| **Analytics Service** | http://localhost:8087 | Analytics API |
| **Chatbot Service** | http://localhost:8089 | AI chatbot API |
| **PostgreSQL** | localhost:5432 | Database (user: postgres, db: cinema_app) |
| **Redis** | localhost:6379 | Cache and session store |

---

## Verification

After installation, verify the system is running:

```bash
# Check all containers are running
docker compose ps

# Test API Gateway health
curl http://localhost:8000/health

# Test individual service (example: Movie Service)
curl http://localhost:8083/health

# View logs for a specific service
docker compose logs -f api-gateway
```

---

## Troubleshooting

### Services won't start

```bash
# Check Docker is running
docker --version
docker compose --version

# Check for port conflicts
lsof -i :8000  # Check if port 8000 is in use
lsof -i :5432  # Check if PostgreSQL port is in use

# Clean up and restart
docker compose down -v
docker compose up -d --build
```

### Database connection errors

```bash
# Ensure PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Verify database exists
docker exec -it postgres psql -U postgres -l
```

### Migration errors

```bash
# Reset database and re-run migrations
cd migrate
go run main.go reset
```

---

## Next Steps

- Read the [Architecture Guide](ARCHITECTURE.md) to understand the system design
- Check [API Documentation](API.md) for endpoint details
- Review [Environment Configuration](ENVIRONMENT.md) for customization
- See [Contributing Guidelines](CONTRIBUTING.md) to start contributing
