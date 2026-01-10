# Installation Guide

This guide will walk you through the complete installation process for the Cinema Booking System. Make sure you have completed all [Prerequisites](PREREQUISITES.md) before proceeding.

## Table of Contents

- [Quick Installation (Docker)](#quick-installation-docker)
- [Manual Installation](#manual-installation)
- [Database Setup](#database-setup)
- [Service Configuration](#service-configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Quick Installation (Docker)

The fastest way to get the entire system running is using Docker Compose.

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd cinema-project

# Checkout the develop branch
git checkout develop
```

### Step 2: Configure Environment Variables

Each service requires environment configuration. You can use the provided templates:

```bash
# Create environment files for each service
# API Gateway
cat > api-gateway/.env << EOF
SERVER_PORT=8000
JWT_SECRET=your_secure_jwt_secret_key_change_this
REDIS_URL=redis://redis:6379
EOF

# Auth Service
cat > auth-service/.env << EOF
PORT=3001
DB_DSN=postgresql://postgres:postgres@postgres:5432/cinema_db?sslmode=disable
JWT_SECRET=your_secure_jwt_secret_key_change_this
REDIS_URL=redis://redis:6379
EOF

# User Service
cat > user-service/.env << EOF
PORT=8005
DB_DSN=postgresql://postgres:postgres@postgres:5432/cinema_db?sslmode=disable
REDIS_URL=redis://redis:6379
EOF

# Movie Service
cat > movie-service/.env << EOF
SERVER_PORT=8083
DB_DSN=postgres://postgres:postgres@postgres:5432/cinema_db?sslmode=disable
REDIS_URL=redis://redis:6379
EOF

# Booking Service
cat > booking-service/.env << EOF
SERVER_PORT=8082
DB_DSN=postgres://postgres:postgres@postgres:5432/cinema_db?sslmode=disable
REDIS_URL=redis://redis:6379
EOF

# Payment Service
cat > payment-service/.env << EOF
SERVER_PORT=8086
DB_DSN=postgres://postgres:postgres@postgres:5432/cinema_db?sslmode=disable
REDIS_URL=redis://redis:6379
ETHEREUM_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_ethereum_private_key
EOF

# Notification Service
cat > notification-service/.env << EOF
SERVER_PORT=8080
DB_DSN=postgres://postgres:postgres@postgres:5432/cinema_db?sslmode=disable
REDIS_URL=redis://redis:6379
EOF

# Analytics Service
cat > analytics-service/.env << EOF
PORT=8087
DB_DSN=postgresql://postgres:postgres@postgres:5432/cinema_db?sslmode=disable
EOF

# Chatbot Service
cat > chatbot/.env << EOF
PORT=8089
DB_DSN=postgresql://postgres:postgres@postgres:5432/cinema_db?sslmode=disable
GOOGLE_API_KEY=your_google_gemini_api_key
EOF

# Worker Service
cat > worker-service/.env << EOF
SERVER_PORT=8088
DB_DSN=postgres://postgres:postgres@postgres:5432/cinema_db?sslmode=disable
REDIS_URL=redis://redis:6379
EOF

# Frontend
cat > FE/.env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8080
EOF
```

**Important:** Replace the placeholder values with your actual credentials:
- `your_secure_jwt_secret_key_change_this` - Use a strong, random secret
- `YOUR_INFURA_KEY` - Your Infura project key (if using Ethereum)
- `your_google_gemini_api_key` - Your Google Gemini API key

### Step 3: Build and Start Services

```bash
# Build all services
docker compose build

# Start all services in detached mode
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f
```

### Step 4: Run Database Migrations

```bash
# Navigate to the migration directory
cd migrate

# Install dependencies
npm install

# Run migrations
npm run migrate:up

# Seed the database with initial data
npm run seed

# Return to project root
cd ..
```

### Step 5: Verify Installation

```bash
# Check all services are running
docker compose ps

# Test API Gateway health
curl http://localhost:8000/api/v1/health

# Test individual services
curl http://localhost:8083/api/v1/movies
curl http://localhost:8000/api/v1/auth/health
```

### Step 6: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost
- **API Gateway**: http://localhost:8000

The system is now ready to use!

## Manual Installation

For development or customization, you can install services individually.

### 1. Database Setup

#### Install and Configure PostgreSQL

```bash
# Start PostgreSQL (if not using Docker)
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Create database
psql postgres -c "CREATE DATABASE cinema_db;"
psql postgres -c "CREATE USER cinema_user WITH PASSWORD 'your_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE cinema_db TO cinema_user;"

# Enable pgvector extension
psql cinema_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### Install and Configure Redis

```bash
# Start Redis
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping  # Should return PONG
```

### 2. Install Go Services

Each Go service follows a similar installation pattern:

```bash
# Example: Movie Service
cd movie-service

# Install dependencies
go mod download
go mod tidy

# Build the service
go build -o bin/movie-service .

# Run the service
./bin/movie-service

# Return to project root
cd ..
```

Repeat for all Go services:
- api-gateway
- movie-service
- booking-service
- payment-service
- notification-service
- worker-service

### 3. Install Node.js Services

Each Node.js service follows a similar installation pattern:

```bash
# Example: Auth Service
cd auth-service

# Install dependencies
npm install

# Build TypeScript (if applicable)
npm run build

# Run the service
npm start

# For development with hot reload
npm run dev

# Return to project root
cd ..
```

Repeat for all Node.js services:
- auth-service
- user-service
- analytics-service
- chatbot

### 4. Install Frontend

```bash
cd FE

# Install dependencies
npm install

# Build for production
npm run build

# Or run development server
npm start

# Return to project root
cd ..
```

### 5. Run Database Migrations

```bash
cd migrate

# Install dependencies
npm install

# Run migrations
npm run migrate:up

# Seed initial data
npm run seed

cd ..
```

## Database Setup

### Migration Commands

The migrate service provides several commands:

```bash
cd migrate

# Apply all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Rollback all migrations
npm run migrate:reset

# Seed database with initial data
npm run seed

# Custom migration commands
npm run migrate:up -- --step 1    # Apply one migration
npm run migrate:down -- --step 1  # Rollback one migration
```

### Seed Data

The seed command will populate the database with:
- Sample movies (10+ movies with details)
- Genres (Action, Comedy, Drama, Horror, etc.)
- Room configurations (3-5 cinema rooms with different capacities)
- Seats (automatically generated based on room capacity)
- Sample showtimes
- Admin user (email: admin@cinema.com, password: admin123)
- Sample customer accounts

### Database Schema

The database includes the following main tables:

**User Management:**
- users, roles, permissions, role_permissions
- customer_profile, staff_profile

**Movie Catalog:**
- movies, genres, movie_genres

**Booking System:**
- rooms, seats, showtimes
- bookings, tickets

**Payment & Analytics:**
- payments, outbox_events

**AI Chatbot:**
- documents, document_chunks, chats

## Service Configuration

### API Gateway Configuration

Edit `api-gateway/config.yaml`:

```yaml
server:
  port: 8000
  mode: "debug"  # or "release" for production

jwt:
  secret: "your_jwt_secret"
  expiry: 3600

redis:
  url: "redis://localhost:6379"

rateLimit:
  requestsPerSecond: 100
  burst: 200

services:
  auth:
    url: "http://localhost:3001"
    healthPath: "/health"

  movie:
    url: "http://localhost:8083"
    healthPath: "/api/v1/health"

  booking:
    url: "http://localhost:8082"
    healthPath: "/api/v1/health"

  # ... other services
```

### Nginx Configuration (Optional)

If running without Docker, configure Nginx:

```nginx
# /etc/nginx/sites-available/cinema

upstream api_gateway {
    server localhost:8000;
}

upstream notification_ws {
    server localhost:8080;
}

server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;  # React dev server
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Gateway
    location /api/ {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket for notifications
    location /ws {
        proxy_pass http://notification_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/cinema /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Verification

### Health Checks

Verify all services are running:

```bash
# API Gateway
curl http://localhost:8000/api/v1/health

# Auth Service
curl http://localhost:3001/health

# Movie Service
curl http://localhost:8083/api/v1/health

# Booking Service
curl http://localhost:8082/api/v1/health

# Payment Service
curl http://localhost:8086/api/v1/health

# Notification Service
curl http://localhost:8080/api/v1/health

# User Service
curl http://localhost:8005/health

# Analytics Service
curl http://localhost:8087/health

# Chatbot Service
curl http://localhost:8089/health
```

### Test Database Connection

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d cinema_db

# Run a test query
SELECT COUNT(*) FROM movies;
SELECT COUNT(*) FROM users;

# Exit
\q
```

### Test Redis Connection

```bash
# Connect to Redis
redis-cli

# Test commands
PING
SET test "Hello Cinema"
GET test

# Exit
exit
```

### Test API Endpoints

```bash
# Get all movies
curl http://localhost:8000/api/v1/movies

# Register a new user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### Common Issues

#### Issue 1: Port Already in Use

**Error:** `bind: address already in use`

**Solution:**
```bash
# Find process using the port
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or change the port in service configuration
```

#### Issue 2: Database Connection Failed

**Error:** `connection refused` or `authentication failed`

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Verify credentials in .env files
cat auth-service/.env | grep DB_DSN

# Test connection manually
psql -h localhost -U postgres -d cinema_db
```

#### Issue 3: Redis Connection Failed

**Error:** `redis: connection refused`

**Solution:**
```bash
# Check Redis is running
redis-cli ping

# Start Redis if not running
brew services start redis  # macOS
sudo systemctl start redis-server  # Linux

# Verify Redis URL in .env files
```

#### Issue 4: Migration Fails

**Error:** Migration errors or missing tables

**Solution:**
```bash
cd migrate

# Reset database (WARNING: This will delete all data)
npm run migrate:reset

# Re-run migrations
npm run migrate:up

# Re-seed data
npm run seed
```

#### Issue 5: Docker Build Fails

**Error:** Build failures during `docker compose build`

**Solution:**
```bash
# Clean Docker cache
docker compose down
docker system prune -a

# Rebuild with no cache
docker compose build --no-cache

# Check Docker disk space
docker system df
```

#### Issue 6: Frontend Can't Connect to Backend

**Error:** Network errors in browser console

**Solution:**
```bash
# Check API Gateway is running
curl http://localhost:8000/api/v1/health

# Verify REACT_APP_API_URL in FE/.env
cat FE/.env

# Check CORS configuration in API Gateway
# Ensure frontend origin is allowed
```

### Service-Specific Debugging

#### Enable Debug Logging

**Go services:**
```bash
# Set environment variable
export GIN_MODE=debug  # or ECHO_DEBUG=true
```

**Node services:**
```bash
# Set environment variable
export NODE_ENV=development
export DEBUG=*
```

#### View Service Logs

**Docker:**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f auth-service
docker compose logs -f movie-service
```

**Manual installation:**
```bash
# Each service logs to stdout
# Redirect to file for debugging
npm start > service.log 2>&1
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Development Guide](DEVELOPMENT.md) for debugging tips
2. Review service-specific README files (if available)
3. Check Docker logs for detailed error messages
4. Open an issue on the project repository

## Next Steps

After successful installation:

1. Read [Running the Project](RUNNING.md) to learn how to use the system
2. Review [Architecture](ARCHITECTURE.md) to understand the system design
3. Check [API Documentation](API.md) for endpoint details
4. See [Development Guide](DEVELOPMENT.md) if you want to contribute

## Post-Installation

### Create Admin Account

If seed data wasn't loaded, create an admin account manually:

```bash
# Use the registration API
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cinema.com",
    "password": "your_secure_password",
    "name": "Admin User",
    "role": "admin"
  }'
```

### Configure API Keys

For full functionality, configure:

**Google Gemini API (Chatbot):**
1. Visit https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to `chatbot/.env`: `GOOGLE_API_KEY=your_key`

**Ethereum/Infura (Payment Service):**
1. Visit https://infura.io/
2. Create a project
3. Add to `payment-service/.env`: `ETHEREUM_RPC_URL=your_rpc_url`

### Optional Monitoring

Install monitoring tools:

```bash
# Redis monitoring
docker compose exec redis redis-cli monitor

# PostgreSQL monitoring
docker compose exec postgres pg_stat_activity
```

Installation complete! Proceed to [Running the Project](RUNNING.md).
