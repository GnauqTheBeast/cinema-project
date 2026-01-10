# Prerequisites

This document outlines all the system requirements, dependencies, and tools needed to set up and run the Cinema Booking System.

## Table of Contents

- [System Requirements](#system-requirements)
- [Required Software](#required-software)
- [Development Tools](#development-tools)
- [Optional Tools](#optional-tools)
- [Network Requirements](#network-requirements)
- [Hardware Recommendations](#hardware-recommendations)

## System Requirements

### Operating System

The project is compatible with the following operating systems:

- **macOS**: 10.15 (Catalina) or later
- **Linux**: Ubuntu 20.04+, Debian 10+, CentOS 8+, or similar
- **Windows**: Windows 10/11 with WSL2 (Windows Subsystem for Linux)

### Hardware Recommendations

**Minimum Requirements:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 20 GB free space
- Network: Stable internet connection

**Recommended for Development:**
- CPU: 8 cores or more
- RAM: 16 GB or more
- Storage: 50 GB free space (SSD recommended)
- Network: High-speed internet connection

## Required Software

### 1. Docker and Docker Compose

Docker is essential for running all microservices and dependencies.

**Installation:**

**macOS:**
```bash
# Download and install Docker Desktop from:
https://www.docker.com/products/docker-desktop

# Verify installation
docker --version          # Should show Docker version 20.10+
docker-compose --version  # Should show docker-compose version 2.0+
```

**Linux:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

**Windows (WSL2):**
```bash
# Install Docker Desktop for Windows with WSL2 backend
# Download from: https://www.docker.com/products/docker-desktop

# Verify in WSL2 terminal
docker --version
docker-compose --version
```

**Required Version:**
- Docker: 20.10 or higher
- Docker Compose: 2.0 or higher

### 2. Node.js and npm

Required for frontend and several backend services.

**Installation:**

**Using nvm (recommended):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc  # or ~/.zshrc for zsh

# Install Node.js
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

**Alternative (using package manager):**

**macOS:**
```bash
brew install node@18
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Required Version:**
- Node.js: 18.x or higher
- npm: 9.x or higher

### 3. Go (Golang)

Required for building and running Go-based microservices.

**Installation:**

**macOS:**
```bash
brew install go@1.21
```

**Linux:**
```bash
# Download and install
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# Reload shell
source ~/.bashrc

# Verify installation
go version  # Should show go1.21.x
```

**Windows (WSL2):**
```bash
# Same as Linux installation above
```

**Required Version:**
- Go: 1.21 or higher

### 4. PostgreSQL

Database system for persisting application data.

**Option A: Using Docker (Recommended)**
PostgreSQL will be automatically set up when running `docker-compose up`.

**Option B: Local Installation**

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Required Version:**
- PostgreSQL: 15.x or higher
- Required Extension: pgvector (for AI chatbot embeddings)

**Installing pgvector extension:**
```bash
# macOS
brew install pgvector

# Linux
sudo apt install postgresql-15-pgvector

# Or build from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

### 5. Redis

In-memory data store for caching and session management.

**Option A: Using Docker (Recommended)**
Redis will be automatically set up when running `docker-compose up`.

**Option B: Local Installation**

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Required Version:**
- Redis: 7.x or higher

### 6. Git

Version control system.

**Installation:**

**macOS:**
```bash
brew install git
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install git
```

**Verify:**
```bash
git --version  # Should show 2.30+
```

## Development Tools

### 1. Code Editor

**Recommended:**
- Visual Studio Code with extensions:
  - Go extension (golang.go)
  - ESLint
  - Prettier
  - Docker
  - Remote - Containers

**Alternatives:**
- GoLand (JetBrains)
- WebStorm (JetBrains)
- Neovim/Vim with LSP

### 2. API Testing Tools

**Recommended:**
- Postman or Insomnia for API testing
- grpcurl for gRPC testing

**Installation:**
```bash
# grpcurl
brew install grpcurl  # macOS
# or
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest
```

### 3. Database Tools

**Recommended:**
- pgAdmin 4 or DBeaver for PostgreSQL management
- Redis Insight for Redis management

## Optional Tools

### 1. Blockchain Development (for Payment Service)

If working with Ethereum integration:

**Required:**
- MetaMask browser extension
- Access to Ethereum testnet (Goerli, Sepolia) or local node

**Optional:**
- Ganache for local Ethereum development
- Hardhat or Truffle framework

### 2. AI/ML Tools (for Chatbot Service)

**Required:**
- Google Cloud account with Gemini API access
- API key for Google Generative AI

### 3. Monitoring and Debugging

**Optional but recommended:**
- Docker Desktop with Kubernetes enabled
- Lens (Kubernetes IDE)
- Postman/Insomnia collections
- cURL or HTTPie for CLI API testing

### 4. Build Tools

**For Go services:**
```bash
# Install additional Go tools
go install github.com/cosmtrek/air@latest  # Hot reload
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest  # Linter
```

**For Node.js services:**
```bash
# Install globally (optional)
npm install -g typescript
npm install -g ts-node
npm install -g nodemon
```

## Network Requirements

### Ports

Ensure the following ports are available:

**Essential Ports:**
- 80: Nginx (Frontend)
- 5432: PostgreSQL
- 6379: Redis
- 8000: API Gateway

**Service Ports:**
- 3001: Auth Service
- 8005: User Service
- 8080: Notification Service
- 8082: Booking Service
- 8083: Movie Service
- 8086: Payment Service
- 8087: Analytics Service
- 8088: Worker Service
- 8089: Chatbot Service

**Check port availability:**
```bash
# macOS/Linux
lsof -i :80
lsof -i :8000
netstat -an | grep LISTEN

# Stop conflicting services if needed
sudo lsof -ti:80 | xargs kill -9
```

### Firewall Configuration

If using a firewall, allow incoming connections on the ports listed above.

**Linux (UFW):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
```

## Environment Variables

Create a `.env` file with the following variables (examples):

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=cinema_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key_here

# API Keys
GOOGLE_API_KEY=your_google_gemini_api_key

# Ethereum (optional)
ETHEREUM_RPC_URL=https://goerli.infura.io/v3/your_infura_key
PRIVATE_KEY=your_ethereum_private_key
```

## Verification Checklist

Before proceeding with installation, verify all prerequisites:

```bash
# Check Docker
docker --version && docker-compose --version

# Check Node.js and npm
node --version && npm --version

# Check Go
go version

# Check Git
git --version

# Check PostgreSQL (if installed locally)
psql --version

# Check Redis (if installed locally)
redis-server --version

# Check available disk space
df -h

# Check available memory
free -h  # Linux
vm_stat  # macOS
```

All checks should pass before proceeding to [Installation](INSTALLATION.md).

## Troubleshooting

### Docker Issues

**Problem:** Docker daemon not running
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

**Problem:** Permission denied
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Port Conflicts

**Problem:** Port already in use
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Node.js Issues

**Problem:** Node version mismatch
```bash
nvm install 18
nvm use 18
```

## Next Steps

Once all prerequisites are installed and verified:

1. Proceed to [Installation Guide](INSTALLATION.md)
2. Follow [Running the Project](RUNNING.md)
3. Review [Development Guide](DEVELOPMENT.md) for contributing

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Go Documentation](https://go.dev/doc/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
