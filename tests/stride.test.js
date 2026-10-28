// Stride-picker test: pickStride() unit checks. app.js is a browser file, so load
// it with a minimal document stub. Run: node tests/stride.test.js
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

global.window = {};
global.document = { getElementById: () => ({ addEventListener() {}, style: {}, textContent: '' }) };
vm.runInThisContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), { filename: 'app.js' });

let failed = false;
function assert(cond, msg) {
    if (!cond) { failed = true; console.error('FAIL: ' + msg); }
    else console.log('ok: ' + msg);
}

assert(pickStride(111805, null).stride === 56, 'auto stride for 111805 lines is 56');
assert(pickStride(111805, '').stride === 56, 'empty box falls back to auto');
assert(pickStride(40, null).stride === 1, 'no skips for 40 lines');
assert(pickStride(111805, '5').stride === 5, 'user stride 5 accepted');
assert(pickStride(111805, '1').stride === 1, 'user stride 1 (draw all) accepted');
assert(pickStride(111805, '0').error !== undefined, 'stride 0 rejected');
assert(pickStride(111805, '-3').error !== undefined, 'negative stride rejected');
assert(pickStride(111805, '2.5').error !== undefined, 'fractional stride rejected');
assert(pickStride(111805, 'abc').error !== undefined, 'non-numeric stride rejected');
assert(pickStride(111805, '9007199254740993').stride === 9007199254740992, 'huge integers pass through (no upper cap)');

if (failed) { console.error('STRIDE TESTS FAILED'); process.exitCode = 1; }
else console.log('STRIDE TESTS PASSED');
