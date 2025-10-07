#!/bin/bash

# Cinema Project Startup Script
echo "🎬 Starting Cinema Project..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
until docker-compose exec -T postgres pg_isready -U postgres; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

# Check if Redis is ready
echo "🔍 Checking Redis connection..."
until docker-compose exec -T redis redis-cli ping; do
    echo "Waiting for Redis..."
    sleep 2
done

# Wait a bit more for auth service to start
echo "⏳ Waiting for auth service to initialize..."
sleep 5

# Run database migrations and seed data
echo "🗄️ Setting up database..."
docker-compose exec -T auth-service npm run db:setup

# Check service health
echo "🏥 Checking service health..."
sleep 3

# Check auth service health
AUTH_HEALTH=$(curl -s http://localhost:3001/api/auth/health | grep -o '"success":true' || echo "failed")
if [ "$AUTH_HEALTH" = '"success":true' ]; then
    echo "✅ Auth Service is healthy"
else
    echo "❌ Auth Service health check failed"
fi

# Check if frontend is accessible
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 || echo "000")
if [ "$FRONTEND_CHECK" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible yet (this may take a few more minutes)"
fi

echo ""
echo "🎉 Cinema Project is starting up!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend:  http://localhost:3002"
echo "   Auth API:  http://localhost:3001/api/auth"
echo "   Health:    http://localhost:3001/api/auth/health"
echo ""
echo "👤 Account Setup:"
echo "   Create accounts using the registration page at http://localhost:3002/register"
echo "   No test accounts are pre-created for production security"
echo ""
echo "📊 Useful Commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo ""
echo "⏳ Note: Frontend may take 1-2 minutes to fully load on first startup."
