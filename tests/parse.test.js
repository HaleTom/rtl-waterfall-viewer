// Parse test: the vendored library must group rtl_power's chunk-rows into sweeps
// and compute correct ranges. Run: node tests/parse.test.js
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

global.d3 = require(path.join(root, 'd3.v4.min.js'));
global.w = {};
vm.runInThisContext(fs.readFileSync(path.join(root, 'waterfall.js'), 'utf8'), { filename: 'waterfall.js' });

function assert(cond, msg) {
    if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
    else console.log('ok: ' + msg);
}

parseCSVData(fs.readFileSync(path.join(__dirname, 'fixture.csv'), 'utf8'));
const d = global.w.data;

assert(d.values.length === 2, '2 sweeps grouped from 4 chunk-rows, got ' + d.values.length);
// NB: 3, not 4: the grouping opens a new sweep on the reference freq WITHOUT pushing
// that cell, so each sweep drops its first bin (upstream quirk, left as-is).
assert(d.values[0].values.length === 3, '3 bins per sweep (first bin dropped by grouping)');
assert(d.freqRange[0] === 920000000 && d.freqRange[1] === 922000000, 'freqRange 920M-922M');
assert(d.freqStep === 1000000, 'freqStep 1MHz');
assert(d.dbRange[0] === -52 && d.dbRange[1] === -45, 'dbRange [-52,-45], got [' + d.dbRange + ']');
const t0 = new Date(d.values[0].dateTime), t1 = new Date(d.values[1].dateTime);
assert(t0.getHours() === 0 && t0.getMinutes() === 0 && t0.getSeconds() === 0, 'first sweep at 00:00:00 local');
assert(t1.getSeconds() === 1, 'second sweep 1s later');
if (process.exitCode) console.error('PARSE TESTS FAILED'); else console.log('PARSE TESTS PASSED');
