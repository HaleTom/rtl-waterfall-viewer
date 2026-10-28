// Format test: axis ticks must never collapse to duplicates (e.g. every tick of a
// 1 MHz capture rendering as "919MHz"). Run: node tests/format.test.js
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

global.d3 = require(path.join(root, 'd3.v4.min.js'));
global.w = {};
vm.runInThisContext(fs.readFileSync(path.join(root, 'waterfall.js'), 'utf8'), { filename: 'waterfall.js' });

let failed = false;
function assert(cond, msg) {
    if (!cond) { failed = true; console.error('FAIL: ' + msg); }
    else console.log('ok: ' + msg);
}

// unit selection by magnitude
assert(unitFor(2.4e9).u === 'GHz', '2.4e9 -> GHz');
assert(unitFor(919e6).u === 'MHz', '919e6 -> MHz');
assert(unitFor(150e3).u === 'kHz', '150e3 -> kHz');
assert(unitFor(440).u === 'Hz', '440 -> Hz');

// end-to-end: real d3 ticks through a range-built formatter must be unique
for (const [lo, hi, want] of [
    [918001319, 926998681, 'MHz'],   // the reported narrow capture
    [920001221, 924998777, 'MHz'],
    [2400000000, 2483500000, 'GHz'], // 2.4 GHz WiFi capture
    [100000, 200000, 'kHz'],         // 100-200 kHz capture
    [24000000, 1700000000, 'GHz'],   // wide survey crosses into GHz
]) {
    const fmt = frequencyFormat([lo, hi]);
    const labels = global.d3.scaleLinear().domain([lo, hi]).ticks(16).map(fmt);
    const uniq = new Set(labels).size;
    assert(uniq === labels.length, `${labels.length} ticks all unique for ${lo}-${hi} (got ${uniq})`);
    assert(labels[0].endsWith(' ' + want), `unit is ${want}, got "${labels[0]}"`);
}
// spot checks
let f = frequencyFormat([919e6, 920e6]);
assert(f(919e6) === '919.00 MHz', '919M formats as "919.00 MHz", got "' + f(919e6) + '"');
f = frequencyFormat([2.4e9, 2.5e9]);
assert(f(2.45e9) === '2.450 GHz', '2.45G formats as "2.450 GHz", got "' + f(2.45e9) + '"');

if (failed) { console.error('FORMAT TESTS FAILED'); process.exitCode = 1; }
else console.log('FORMAT TESTS PASSED');
