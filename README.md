# Cinema Project - Microservice Architecture

A comprehensive cinema management system built with microservice architecture using Node.js and React.js.

## 🏗️ Architecture

- **Backend**: Node.js with Express.js
- **Frontend**: React.js with Tailwind CSS
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
cinema-project/
├── auth-service/     # Node.js Authentication Service
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Authentication & validation middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── database/       # Migration & seeding scripts
│   ├── Dockerfile
│   └── package.json
├── FE/                     # React.js Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Multi-service orchestration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### 1. Clone and Setup

```bash
git clone <repository-url>
cd cinema-project
```

### 2. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Initialize Database

```bash
# Run database migrations and seed data
docker-compose exec auth-service npm run db:setup
```

### 4. Access Applications

- **Frontend**: http://localhost:3002
- **Auth API**: http://localhost:3001/api/auth
- **API Health**: http://localhost:3001/api/auth/health

## 🔐 Authentication System

### Features

- User registration with role-based access (Customer/Staff)
- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting for security
- Input validation with Joi
- CORS protection

### Database Schema

- **tblUser**: Core user information with discriminator pattern
- **tblAddress**: User address information
- **tblFullName**: User full name details
- **tblCustomer**: Customer-specific data (reward points, ranking)
- **tblStaff**: Staff-specific data (salary, position, manager)

### API Endpoints

```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile (protected)
POST /api/auth/logout      # User logout (protected)
POST /api/auth/refresh     # Refresh access token
GET  /api/auth/health      # Health check
```

## 🧪 Testing

### Test Accounts

After running `npm run db:setup`, you can use these test accounts:

```
Customer Account:
- Username: customer1
- Password: password123

Staff Account:
- Username: staff1
- Password: password123

Admin Account:
- Username: admin
- Password: admin123
```

### Manual Testing

```bash
# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "confirmPassword": "password123",
    "userType": "Customer",
    "firstName": "Test",
    "lastName": "User",
    "city": "Ho Chi Minh City",
    "street": "123 Test Street"
  }'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## 🛠️ Development

### Local Development Setup

```bash
# Backend
cd auth-service
npm install
npm run dev

# Frontend
cd FE
npm install
npm start
```

### Environment Variables

#### Auth Service (.env)
```
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cinema_app
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:3002
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001/api
```

## 📦 Docker Services

- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)
- **auth-service**: Node.js authentication API (port 3001)
- **frontend**: React.js application (port 3000)

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3002, 3001, 5432, 6379 are available
2. **Database connection**: Wait for PostgreSQL to fully start before running migrations
3. **CORS errors**: Check CORS_ORIGIN environment variable matches frontend URL

### Useful Commands

```bash
# View service logs
docker-compose logs auth-service
docker-compose logs frontend

# Restart specific service
docker-compose restart auth-service

# Access database
docker-compose exec postgres psql -U postgres -d cinema_app

# Access Redis
docker-compose exec redis redis-cli

# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 🚧 Next Steps

This authentication service provides the foundation for the cinema management system. Future modules to be added:

- Movie management service
- Booking service
- Theater management service
- Payment service
- Notification service
- Reporting service

## 📄 License

This project is licensed under the MIT License.
