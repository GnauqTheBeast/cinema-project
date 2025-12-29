# Cinema System Benchmark Guide

Hướng dẫn benchmark và load testing cho hệ thống rạp chiếu phim.

## Prerequisites

### 1. Cài đặt Tools

```bash
# macOS
brew install apache-bench k6

# Linux
sudo apt-get install apache2-utils
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 2. Start Services

```bash
# Start all services
docker compose up -d

# Verify services are running
docker compose ps
curl http://localhost:8000/health
```

## Quick Start

### 1. Quick Benchmark (1-2 phút)

```bash
chmod +x scripts/benchmark.sh
./scripts/benchmark.sh quick
```

### 2. Full Benchmark (10-15 phút)

```bash
./scripts/benchmark.sh full
```

### 3. Stress Test (15-30 phút)

```bash
./scripts/benchmark.sh stress
```

## Các Script Available

### 1. `benchmark.sh` - Tổng hợp benchmark

**Modes:**
- `quick`: Test nhanh các endpoint chính
- `full`: Test đầy đủ tất cả endpoints + k6 load test
- `stress`: Stress test với high load

**Usage:**
```bash
# Quick test
./scripts/benchmark.sh quick

# Full test
BASE_URL=http://localhost:8000 ./scripts/benchmark.sh full

# Stress test
./scripts/benchmark.sh stress
```

**Output:**
- Kết quả lưu trong `benchmark-results/`
- Metrics: Requests/sec, Response time, Transfer rate
- Database và Redis statistics

### 2. `load-test.js` - k6 Load Test

Test đầy đủ user journeys:
- Browse movies (70% users)
- Search and view details (20% users)
- Book tickets (10% users)

**Usage:**
```bash
# Run with default config
k6 run scripts/load-test.js

# Custom VUs and duration
k6 run --vus 100 --duration 5m scripts/load-test.js

# With custom base URL
BASE_URL=http://production-url.com k6 run scripts/load-test.js

# Save results to JSON
k6 run --out json=results.json scripts/load-test.js
```

**Scenarios:**
- Ramp up: 20 → 50 → 100 users
- Duration: ~13 minutes total
- Thresholds: p95 < 500ms, p99 < 1s, error rate < 1%

### 3. `stress-test-concurrent-bookings.js` - Race Condition Test

Test đặc biệt để phát hiện race conditions trong booking system.

**Usage:**
```bash
# Basic test
k6 run scripts/stress-test-concurrent-bookings.js

# With custom showtime
TARGET_SHOWTIME_ID=abc123 k6 run scripts/stress-test-concurrent-bookings.js

# High load test
k6 run --vus 500 scripts/stress-test-concurrent-bookings.js
```

**Test này kiểm tra:**
- ✓ Seat locking mechanism
- ✓ Race conditions
- ✓ Double booking prevention
- ✓ Database transaction handling

### 4. `booking-benchmark.sh` - Booking Specific Test

Test riêng cho booking flow (nếu có).

## Understanding Results

### Apache Bench Output

```
Requests per second:    234.56 [#/sec]     ← Throughput
Time per request:       4.264 [ms]         ← Latency (mean)
Transfer rate:          89.12 [Kbytes/sec] ← Bandwidth

Percentage of requests served within a certain time (ms)
  50%      3              ← Median
  95%      8              ← p95 (Important!)
  99%     15              ← p99
 100%     45              ← Max
```

**Good Targets:**
- Requests/sec: > 100 req/s
- p95: < 500ms
- p99: < 1000ms
- Error rate: < 1%

### k6 Output

```
http_req_duration..............: avg=245ms min=12ms med=198ms max=2.5s p(95)=450ms p(99)=890ms
http_req_failed................: 0.23%      ← Error rate
http_reqs......................: 45678      ← Total requests
vus............................: 50         ← Current VUs
```

**Metrics quan trọng:**
- `http_req_duration`: Response time
- `http_req_failed`: Error rate
- `http_reqs`: Throughput
- Custom metrics: `booking_success`, `race_condition_detected`

## Monitoring During Test

### 1. Real-time Docker Stats

```bash
# Terminal 1: Run benchmark
./scripts/benchmark.sh full

# Terminal 2: Monitor containers
watch -n 1 'docker stats --no-stream'
```

### 2. Database Monitoring

```bash
# Active connections
docker exec postgres psql -U postgres -d cinema_app -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname = 'cinema_app';"

# Slow queries
docker exec postgres psql -U postgres -d cinema_app -c \
  "SELECT query, calls, mean_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC LIMIT 10;"
```

### 3. Redis Monitoring

```bash
# Monitor commands in real-time
docker exec redis redis-cli MONITOR

# Get stats
docker exec redis redis-cli INFO stats
```

### 4. API Gateway Logs

```bash
docker logs -f api-gateway
```

## Performance Tuning Tips

### Nếu p95 > 500ms:

1. **Check Database:**
   - Add indexes
   - Optimize queries
   - Increase connection pool

2. **Check Redis:**
   - Add caching
   - Increase memory
   - Use connection pooling

3. **Check Application:**
   - Profile slow endpoints
   - Optimize business logic
   - Add pagination

### Nếu Error Rate > 1%:

1. **Check Logs:**
   ```bash
   docker compose logs | grep ERROR
   ```

2. **Check Database Connections:**
   - Might be hitting max connections
   - Increase pool size

3. **Check Memory:**
   - OOM kills?
   - Increase container memory

### Nếu có Race Conditions:

1. **Review Locking:**
   - Redis locks timeout?
   - Database transactions?

2. **Check Concurrent Access:**
   - Seat availability check
   - Booking creation atomicity

## Advanced Testing

### 1. Soak Test (Stability)

Test dài hạn để phát hiện memory leaks:

```bash
k6 run --vus 50 --duration 2h scripts/load-test.js
```

Monitor memory usage:
```bash
watch -n 60 'docker stats --no-stream | grep -E "booking|payment|movie"'
```

### 2. Spike Test

Test khả năng chịu đột biến:

```bash
k6 run --stage 0s:0,10s:1000,1m:1000,10s:0 scripts/load-test.js
```

### 3. Breakpoint Test

Tìm giới hạn hệ thống:

```bash
k6 run \
  --stage 1m:100,1m:200,1m:300,1m:400,1m:500 \
  scripts/load-test.js
```

Quan sát khi nào bắt đầu có errors.

## Continuous Benchmarking

### Setup CI/CD Benchmark

```yaml
# .github/workflows/benchmark.yml
name: Performance Benchmark

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  workflow_dispatch:

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start services
        run: docker compose up -d
      - name: Run benchmark
        run: ./scripts/benchmark.sh quick
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: benchmark-results
          path: benchmark-results/
```

## Troubleshooting

### "Connection refused"

```bash
# Check if services are running
docker compose ps

# Restart services
docker compose restart
```

### "Too many open files"

```bash
# macOS
sudo launchctl limit maxfiles 65536 200000

# Linux
ulimit -n 65536
```

### "k6: command not found"

```bash
brew install k6  # macOS
# or follow installation guide above
```

## Results Interpretation

### Good System Performance:
- ✅ p95 < 500ms
- ✅ p99 < 1s
- ✅ Error rate < 1%
- ✅ Throughput > 100 req/s
- ✅ No race conditions
- ✅ CPU < 70%
- ✅ Memory stable

### Needs Optimization:
- ⚠ p95 > 1s
- ⚠ Error rate > 5%
- ⚠ Race conditions detected
- ⚠ Memory increasing
- ⚠ Database slow queries

### Critical Issues:
- 🚨 Error rate > 10%
- 🚨 Timeouts
- 🚨 Services crashing
- 🚨 Double bookings
- 🚨 Data corruption

## Next Steps

1. **Baseline:** Run `benchmark.sh quick` để có baseline metrics
2. **Regular Testing:** Run weekly benchmarks
3. **Before Deploy:** Always run full benchmark
4. **Monitor Production:** Set up Prometheus + Grafana
5. **Alert on Degradation:** Alert if metrics degrade > 20%

## Support

Nếu có vấn đề với benchmark scripts:
1. Check logs: `docker compose logs`
2. Verify services: `docker compose ps`
3. Check resources: `docker stats`