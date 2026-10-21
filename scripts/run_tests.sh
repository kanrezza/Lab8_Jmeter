#!/usr/bin/env bash
# Chạy các kịch bản JMeter ở chế độ dòng lệnh (non-GUI) và sinh HTML Dashboard.
# Dùng: ./scripts/run_tests.sh [load|stress|spike|breakpoint|all]   (mặc định: all)
set -euo pipefail
cd "$(dirname "$0")/.."

PLAN=test-plan/DemoShop_LoadTest.jmx
export HEAP="${HEAP:--Xms1g -Xmx4g}"   # tăng bộ nhớ cho JMeter khi chạy nhiều thread

run() {  # run <tên> <threads> <rampup> <loops> [think_ms] [think_range_ms]
  local name=$1 out=results/$1
  rm -rf "$out" && mkdir -p "$out"
  echo "=== Kịch bản: $name | threads=$2 rampup=$3s loops=$4 think=${5:-200}+${6:-300}ms ==="
  jmeter -n -t "$PLAN" \
    -Jthreads="$2" -Jrampup="$3" -Jloops="$4" -Jthink="${5:-200}" -JthinkRange="${6:-300}" \
    -l "$out/results.jtl" -j "$out/jmeter.log" \
    -Jjmeter.reportgenerator.overall_granularity=1000 \
    -e -o "$out/report" | tee "$out/console.txt"
}

# Khởi động server nếu chưa chạy
if ! curl -s localhost:8080/api/health >/dev/null; then
  python3 server/app.py 8080 & SERVER_PID=$!
  trap 'kill $SERVER_PID' EXIT
  # Chờ server sẵn sàng (tránh lỗi Connection refused ở đầu test)
  for _ in $(seq 1 20); do curl -s localhost:8080/api/health >/dev/null && break; sleep 0.5; done
fi

case "${1:-all}" in
  load)   run load 100 20 20 ;;
  stress) run stress 500 30 10 ;;
  spike)  run spike 1000 2 3 ;;
  breakpoint) run breakpoint 4000 10 3 0 0 ;;
  all)    run load 100 20 20; run stress 500 30 10; run spike 1000 2 3; run breakpoint 4000 10 3 0 0 ;;
esac
