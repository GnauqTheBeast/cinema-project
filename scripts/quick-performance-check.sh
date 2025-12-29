#!/bin/bash

# Quick Performance Check - Fast system health and performance check
# Usage: ./scripts/quick-performance-check.sh

BASE_URL=${BASE_URL:-http://localhost:80}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Quick Performance Check             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 1. Health Check
echo -e "${YELLOW}1. Checking service health...${NC}"
if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ API Gateway is UP${NC}"
else
    echo -e "${RED}   ✗ API Gateway is DOWN${NC}"
    exit 1
fi
echo ""

# 2. Quick response time test
echo -e "${YELLOW}2. Testing response times...${NC}"

test_endpoint() {
    local endpoint=$1
    local name=$2

    local start=$(date +%s%N)
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 ))

    if [ "$response" -eq 200 ]; then
        if [ "$duration" -lt 200 ]; then
            echo -e "   ${GREEN}✓ $name: ${duration}ms (Excellent)${NC}"
        elif [ "$duration" -lt 500 ]; then
            echo -e "   ${GREEN}✓ $name: ${duration}ms (Good)${NC}"
        elif [ "$duration" -lt 1000 ]; then
            echo -e "   ${YELLOW}⚠ $name: ${duration}ms (Slow)${NC}"
        else
            echo -e "   ${RED}✗ $name: ${duration}ms (Very Slow)${NC}"
        fi
    else
        echo -e "   ${RED}✗ $name: HTTP $response${NC}"
    fi
}

test_endpoint "/api/v1/movies" "Movies API"
test_endpoint "/api/v1/showtimes" "Showtimes API"
test_endpoint "/api/v1/news" "News API"
echo ""

# 3. Quick load test (10 concurrent requests)
echo -e "${YELLOW}3. Quick load test (10 concurrent requests)...${NC}"
if command -v ab &> /dev/null; then
    result=$(ab -n 10 -c 10 -q "$BASE_URL/api/v1/movies" 2>&1)

    rps=$(echo "$result" | grep "Requests per second" | awk '{print $4}')
    avg=$(echo "$result" | grep "Time per request" | head -1 | awk '{print $4}')

    if [ ! -z "$rps" ]; then
        echo -e "   Throughput: ${GREEN}${rps} req/s${NC}"
        echo -e "   Avg Response: ${GREEN}${avg}ms${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠ Apache Bench not installed. Skipping.${NC}"
fi
echo ""

# 4. Database check
echo -e "${YELLOW}4. Checking database...${NC}"
if docker exec postgres psql -U postgres -d cinema_app -c "SELECT 1" > /dev/null 2>&1; then
    connections=$(docker exec postgres psql -U postgres -d cinema_app -t -c \
        "SELECT count(*) FROM pg_stat_activity WHERE datname = 'cinema_app';" 2>/dev/null | tr -d ' ')

    if [ ! -z "$connections" ]; then
        echo -e "   ${GREEN}✓ Database is UP (${connections} connections)${NC}"
    else
        echo -e "   ${GREEN}✓ Database is UP${NC}"
    fi
else
    echo -e "   ${RED}✗ Database is DOWN or not accessible${NC}"
fi
echo ""

# 5. Redis check
echo -e "${YELLOW}5. Checking Redis...${NC}"
if docker exec redis redis-cli PING > /dev/null 2>&1; then
    clients=$(docker exec redis redis-cli INFO clients 2>/dev/null | grep "connected_clients" | cut -d: -f2 | tr -d '\r')
    memory=$(docker exec redis redis-cli INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')

    if [ ! -z "$clients" ]; then
        echo -e "   ${GREEN}✓ Redis is UP (${clients} clients, ${memory} memory)${NC}"
    else
        echo -e "   ${GREEN}✓ Redis is UP${NC}"
    fi
else
    echo -e "   ${RED}✗ Redis is DOWN or not accessible${NC}"
fi
echo ""

# 6. Container resource usage
echo -e "${YELLOW}6. Container resources (snapshot):${NC}"
if command -v docker &> /dev/null; then
    echo ""
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -8
    echo ""
else
    echo -e "   ${YELLOW}⚠ Docker not available${NC}"
fi

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Quick performance check complete!${NC}"
echo ""
echo -e "${YELLOW}For detailed benchmark, run:${NC}"
echo "   ./scripts/benchmark.sh quick"
echo ""
