#!/bin/bash
# Test runner for the d3-waterfall file-picker page. Run from anywhere:
#   bash d3-waterfall/tests/run.sh   (or ./run.sh from the tests dir)
# Exits non-zero on the first failure.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8819
CHROM="chromium --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=1280,900"

echo "== node: parse =="
node "$DIR/tests/parse.test.js"
echo "== node: format =="
node "$DIR/tests/format.test.js"
echo "== node: stride =="
node "$DIR/tests/stride.test.js"

echo "== dom: open path (dropdown hit-test, download link, status) =="
python3 -m http.server "$PORT" --directory "$DIR" >/dev/null 2>&1 & SRV=$!
trap 'kill $SRV' EXIT
sleep 1
DOM=$($CHROM --dump-dom --virtual-time-budget=15000 "http://localhost:$PORT/tests/probe-open.html")
echo "$DOM" | grep -q '<title>HIT:SELECT</title>' || { echo "FAIL: dropdown not clickable: $(echo "$DOM" | grep -o '<title>[^<]*</title>')"; exit 1; }
echo "ok: interpolator dropdown receives clicks"
echo "$DOM" | grep -q '40 sweeps drawn' || { echo 'FAIL: status line missing'; exit 1; }
echo "ok: status reports 40 sweeps drawn"
echo "$DOM" | grep -o 'id="stride-row"[^>]*>' | grep -q 'display:none' || { echo 'FAIL: stride box shown for 40-line file (no skips)'; exit 1; }
echo "ok: stride box hidden when nothing is skipped"
echo "$DOM" | grep -o 'id="download"[^>]*>' | grep -q 'style=""' || { echo 'FAIL: download link not revealed'; exit 1; }
echo "ok: download link hidden until render, shown after"

echo "== dom: interpolator redraw changes pixels =="
$CHROM --screenshot=/tmp/t-vir.png --virtual-time-budget=8000 "http://localhost:$PORT/tests/probe-redraw.html" >/dev/null 2>&1
$CHROM --screenshot=/tmp/t-inf.png --virtual-time-budget=8000 "http://localhost:$PORT/tests/probe-redraw.html?redraw=1" >/dev/null 2>&1
python3 - <<'EOF'
from PIL import Image, ImageChops
a = Image.open('/tmp/t-vir.png').convert('RGB')
b = Image.open('/tmp/t-inf.png').convert('RGB')
assert a.size == b.size, 'screenshot sizes differ'
h = ImageChops.difference(a, b).convert('L').histogram()
diff = sum(h[1:]) / (a.size[0] * a.size[1])
print('pixels changed by interpolator switch: %.1f%%' % (100 * diff))
assert diff > 0.05, 'redraw produced no visible change'
EOF
echo "ok: switching interpolator redraws the waterfall"

echo "== dom: stride box (shown only when skipping, invalid warns, valid re-renders) =="
DOM2=$($CHROM --dump-dom --virtual-time-budget=30000 "http://localhost:$PORT/tests/probe-stride.html")
T2=$(echo "$DOM2" | grep -o '<title>[^<]*</title>')
echo "$T2" | grep -q '"boxShown":true' || { echo "FAIL: stride box not shown for 2100-line file: $T2"; exit 1; }
echo "ok: stride box shown when skips would occur"
echo "$T2" | grep -q '"boxDefault":"2"' || { echo "FAIL: default stride not 2: $T2"; exit 1; }
echo "ok: stride box defaults to auto stride (2)"
echo "$T2" | grep -q '"warnSet":true' || { echo "FAIL: no warning on stride 0: $T2"; exit 1; }
echo "ok: invalid stride warns"
echo "$T2" | grep -q '"validNote":true' || { echo "FAIL: no re-render on stride 5: $T2"; exit 1; }
echo "$T2" | grep -q '"warnCleared":true' || { echo "FAIL: warning not cleared: $T2"; exit 1; }
echo "ok: valid stride re-renders and clears the warning"
echo "ALL TESTS PASSED"
