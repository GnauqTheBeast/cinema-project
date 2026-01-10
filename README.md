# Cinema Booking System

A full-stack microservices-based cinema ticket booking and management system with advanced features including online reservations, payment processing, real-time notifications, AI chatbot support, and blockchain integration.

## Overview

This project is an enterprise-grade cinema management platform that enables customers to browse movies, book tickets, make payments, and receive real-time notifications. Staff and administrators can manage movies, showtimes, rooms, and view analytics reports. The system is built using modern microservices architecture with multiple backend services communicating via gRPC and REST APIs.

## Key Features

- **Movie Catalog Management**: Browse movies, view details, showtimes, and availability
- **Online Ticket Booking**: Real-time seat selection and reservation system
- **Multiple Payment Methods**: Support for traditional and blockchain-based payments (Ethereum)
- **Real-time Notifications**: WebSocket-based notification system for booking updates
- **AI-Powered Chatbot**: Intelligent customer support using Google Gemini AI with RAG (Retrieval Augmented Generation)
- **Customer Loyalty Program**: Points-based reward system
- **Analytics & Reporting**: Revenue reports, booking statistics, and business insights
- **Role-Based Access Control (RBAC)**: Admin, staff, and customer roles with granular permissions
- **Responsive Frontend**: Modern React-based user interface with Tailwind CSS
- **Microservices Architecture**: Scalable, maintainable service-oriented design

## Technology Stack

### Frontend
- React 18.2.0
- React Router v6
- Tailwind CSS
- Axios
- Ethers.js (Blockchain)
- Recharts (Analytics)

### Backend
- **Go**: API Gateway, Movie Service, Booking Service, Payment Service, Notification Service, Worker Service
- **Node.js/TypeScript**: Auth Service, User Service, Analytics Service, Chatbot Service
- **Frameworks**: Gin, Echo (Go), Express (Node.js)

### Database & Caching
- PostgreSQL 15 (with pgvector extension)
- Redis 7.4

### Communication
- gRPC (inter-service communication)
- REST APIs (client communication)
- WebSocket (real-time notifications)

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy)

## Architecture

The system follows a microservices architecture with 10+ specialized services:

```
Frontend (React) → Nginx → API Gateway → Microservices → PostgreSQL/Redis
```

**Services:**
- **API Gateway**: Request routing, authentication, rate limiting
- **Auth Service**: User authentication and authorization
- **User Service**: User profile management
- **Movie Service**: Movie catalog and showtimes
- **Booking Service**: Ticket reservation and booking management
- **Payment Service**: Payment processing (traditional + blockchain)
- **Notification Service**: Real-time notifications via WebSocket
- **Analytics Service**: Business analytics and reporting
- **Chatbot Service**: AI-powered customer support
- **Worker Service**: Background job processing

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Prerequisites](docs/PREREQUISITES.md) - System requirements and dependencies
- [Installation Guide](docs/INSTALLATION.md) - Step-by-step setup instructions
- [Architecture](docs/ARCHITECTURE.md) - Detailed system architecture and design
- [API Documentation](docs/API.md) - API endpoints and usage

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- Go 1.25+
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cinema-project
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start all services using Docker Compose:
```bash
docker compose up -d --build
```

4. Run database migrations:
```bash
cd migrate
go run main.go reset
```

For detailed installation instructions, see [Installation Guide](docs/INSTALLATION.md).
