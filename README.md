# Cinema Project - Microservice Architecture

A comprehensive cinema management system built with microservice architecture using Node.js and React.js.

## 🏗️ Architecture

- **Backend**: Node.js with Express.js
- **Frontend**: React.js with Tailwind CSS
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens
- **Containerization**: Docker & Docker Compose


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


## 🧪 Testing

### Test Accounts
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


