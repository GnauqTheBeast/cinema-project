#!/bin/bash

# Cinema System Benchmark Script
# Usage: ./scripts/benchmark.sh [quick|full|stress]

set -e

MODE=${1:-quick}
BASE_URL=${BASE_URL:-http://localhost:8000}
RESULTS_DIR="./benchmark-results"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Cinema System Benchmark Suite      ║${NC}"
echo -e "${BLUE}║   Mode: ${YELLOW}${MODE}${BLUE}                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if required tools are installed
check_tools() {
    echo -e "${YELLOW}Checking required tools...${NC}"

    if ! command -v ab &> /dev/null; then
        echo -e "${RED}✗ Apache Bench (ab) not found. Install: brew install apache-bench${NC}"
        exit 1
    fi

    if ! command -v k6 &> /dev/null; then
        echo -e "${YELLOW}⚠ k6 not found. Install: brew install k6${NC}"
        echo -e "${YELLOW}  Skipping k6 tests...${NC}"
        HAS_K6=false
    else
        HAS_K6=true
    fi

    echo -e "${GREEN}✓ Tools check passed${NC}"
    echo ""
}

# Check if services are running
check_services() {
    echo -e "${YELLOW}Checking if services are running...${NC}"

    if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}✗ API Gateway is not responding at $BASE_URL${NC}"
        echo -e "${YELLOW}  Make sure services are running: docker compose up -d${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ API Gateway is running${NC}"
    echo ""
}

# Warmup
warmup() {
    echo -e "${YELLOW}⏱  Warming up services...${NC}"
    ab -n 100 -c 10 "$BASE_URL/api/v1/movies" > /dev/null 2>&1
    echo -e "${GREEN}✓ Warmup complete${NC}"
    echo ""
}

# Test Movies API
test_movies_api() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Testing Movies API${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local requests=1000
    local concurrency=50

    if [ "$MODE" == "stress" ]; then
        requests=10000
        concurrency=200
    fi

    ab -n $requests -c $concurrency \
       -g "$RESULTS_DIR/movies_${TIMESTAMP}.tsv" \
       "$BASE_URL/api/v1/movies" \
       | tee "$RESULTS_DIR/movies_${TIMESTAMP}.txt"

    echo ""
}

# Test Showtimes API
test_showtimes_api() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Testing Showtimes API${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local requests=1000
    local concurrency=50

    if [ "$MODE" == "stress" ]; then
        requests=10000
        concurrency=200
    fi

    ab -n $requests -c $concurrency \
       "$BASE_URL/api/v1/showtimes?page=1&size=20" \
       | tee "$RESULTS_DIR/showtimes_${TIMESTAMP}.txt"

    echo ""
}

# Test News API
test_news_api() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Testing News API${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local requests=500
    local concurrency=25

    if [ "$MODE" == "stress" ]; then
        requests=5000
        concurrency=100
    fi

    ab -n $requests -c $concurrency \
       "$BASE_URL/api/v1/news?page=1&size=10" \
       | tee "$RESULTS_DIR/news_${TIMESTAMP}.txt"

    echo ""
}

# Run k6 load test
run_k6_test() {
    if [ "$HAS_K6" = false ]; then
        return
    fi

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running k6 Load Test${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local script="scripts/load-test.js"

    if [ "$MODE" == "quick" ]; then
        # Quick test: 1 minute, max 20 users
        k6 run --vus 20 --duration 1m \
           --out json="$RESULTS_DIR/k6_quick_${TIMESTAMP}.json" \
           "$script"
    elif [ "$MODE" == "stress" ]; then
        # Stress test: Use script's configured stages
        k6 run --out json="$RESULTS_DIR/k6_stress_${TIMESTAMP}.json" \
           "$script"
    else
        # Full test: 5 minutes
        k6 run --vus 50 --duration 5m \
           --out json="$RESULTS_DIR/k6_full_${TIMESTAMP}.json" \
           "$script"
    fi

    echo ""
}

# Check database performance
check_database() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Checking Database Performance${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    echo -e "${YELLOW}Database Statistics:${NC}"

    # Check total bookings
    echo -e "${GREEN}Total Bookings:${NC}"
    docker exec postgres psql -U postgres -d cinema_app -t -c \
        "SELECT count(*) FROM bookings;" 2>/dev/null || echo "N/A"

    # Check total tickets
    echo -e "${GREEN}Total Tickets:${NC}"
    docker exec postgres psql -U postgres -d cinema_app -t -c \
        "SELECT count(*) FROM tickets;" 2>/dev/null || echo "N/A"

    # Check active connections
    echo -e "${GREEN}Active Database Connections:${NC}"
    docker exec postgres psql -U postgres -d cinema_app -t -c \
        "SELECT count(*) FROM pg_stat_activity WHERE datname = 'cinema_app';" 2>/dev/null || echo "N/A"

    # Table sizes
    echo -e "${GREEN}Table Sizes:${NC}"
    docker exec postgres psql -U postgres -d cinema_app -c \
        "SELECT
            schemaname || '.' || tablename AS table,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
         FROM pg_tables
         WHERE schemaname = 'public'
         ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
         LIMIT 10;" 2>/dev/null || echo "N/A"

    echo ""
}

# Check Redis performance
check_redis() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Checking Redis Performance${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    echo -e "${YELLOW}Redis Statistics:${NC}"

    # Get stats
    docker exec redis redis-cli INFO stats 2>/dev/null | grep -E "total_commands_processed|keyspace_hits|keyspace_misses" || echo "N/A"

    # Memory usage
    echo -e "${GREEN}Memory Usage:${NC}"
    docker exec redis redis-cli INFO memory 2>/dev/null | grep "used_memory_human" || echo "N/A"

    # Connected clients
    echo -e "${GREEN}Connected Clients:${NC}"
    docker exec redis redis-cli INFO clients 2>/dev/null | grep "connected_clients" || echo "N/A"

    echo ""
}

# Check Docker stats
check_docker_stats() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Docker Container Stats (5s sample)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "N/A"

    echo ""
}

# Generate summary report
generate_report() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Benchmark Summary${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    echo -e "${GREEN}Results saved to:${NC} $RESULTS_DIR"
    echo -e "${GREEN}Timestamp:${NC} $TIMESTAMP"
    echo ""

    # Extract key metrics from movies test
    if [ -f "$RESULTS_DIR/movies_${TIMESTAMP}.txt" ]; then
        echo -e "${YELLOW}Movies API Performance:${NC}"
        grep "Requests per second" "$RESULTS_DIR/movies_${TIMESTAMP}.txt" | head -1
        grep "Time per request" "$RESULTS_DIR/movies_${TIMESTAMP}.txt" | head -1
        grep "Transfer rate" "$RESULTS_DIR/movies_${TIMESTAMP}.txt" | head -1
        echo ""
    fi

    echo -e "${GREEN}✓ Benchmark complete!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Review results in: $RESULTS_DIR"
    echo "  2. Check for errors or slow responses"
    echo "  3. Monitor system resources"
    echo "  4. Optimize bottlenecks if needed"
    echo ""
}

# Main execution
main() {
    check_tools
    check_services
    warmup

    case $MODE in
        quick)
            test_movies_api
            check_database
            check_redis
            ;;
        full)
            test_movies_api
            test_showtimes_api
            test_news_api
            run_k6_test
            check_database
            check_redis
            check_docker_stats
            ;;
        stress)
            echo -e "${RED}⚠ Running STRESS TEST - This will put heavy load on the system${NC}"
            sleep 2
            test_movies_api
            test_showtimes_api
            run_k6_test
            check_database
            check_redis
            check_docker_stats
            ;;
        *)
            echo -e "${RED}Invalid mode: $MODE${NC}"
            echo "Usage: $0 [quick|full|stress]"
            exit 1
            ;;
    esac

    generate_report
}

# Run
main