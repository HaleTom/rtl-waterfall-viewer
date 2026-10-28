// File-picker front end for vendored d3-waterfall (waterfall.js).
// Reads a local rtl_power CSV with FileReader, parses it with the
// library's own parseCSVData(), and renders via initDisplay().
// Works from file:// too (signal annotations are best-effort: they need http).
var w = null;
var MAX_SWEEPS = 2000; // stride-sample beyond this so big captures stay interactive

function setStatus(msg) {
    document.getElementById('status').textContent = msg;
}

var lastName = null, lastLines = null;

// Pure stride picker (unit-tested in node with a document stub).
// raw null/'' means "no user override" -> automatic stride.
// Returns {stride} or {error}.
function pickStride(lineCount, raw) {
    if (raw === null || raw === undefined || raw === '') return { stride: Math.ceil(lineCount / MAX_SWEEPS) };
    var v = Number(raw);
    if (!Number.isInteger(v) || v < 1) return { error: 'Stride must be a whole number, 1 or more.' };
    return { stride: v };
}

function openText(name, text) {
    lastName = name;
    lastLines = text.split(/\r?\n/).filter(function (l) { return l.trim().length > 0; });
    var row = document.getElementById('stride-row');
    var box = document.getElementById('stride');
    document.getElementById('stride-warn').textContent = '';
    if (lastLines.length === 0) {
        row.style.display = 'none';
        setStatus(name + ': no data rows found.');
        return;
    }
    var auto = Math.ceil(lastLines.length / MAX_SWEEPS);
    if (auto > 1) {
        box.value = auto;
        row.style.display = '';
    } else {
        row.style.display = 'none';
    }
    drawLines(auto);
}

function drawLines(stride) {
    var kept = (stride > 1)
        ? lastLines.filter(function (_, i) { return i % stride === 0; })
        : lastLines;

    if (w && w.animation && window.cancelAnimationFrame) window.cancelAnimationFrame(w.animation);
    document.getElementById('waterfall').innerHTML = '';
    w = new Waterfall('#waterfall', '', null, true, true, true);
    parseCSVData(kept.join('\n'));
    if (w.data.values.length < 2) {
        setStatus(lastName + ': only one sweep — a waterfall needs at least two timestamps.');
        return;
    }

    var note = lastName + ': ' + lastLines.length + ' sweeps' +
        (stride > 1 ? ', showing every ' + stride + 'th (' + kept.length + ' drawn)' : ' drawn');
    d3.json('frequencies.json', function (err, json) {
        w.annotations = err ? null : json;
        initDisplay(w);
        document.getElementById('download').style.display = '';
        setStatus(note + (err ? ' — no signal tooltips (serve over http for those).'
                              : ' — hover a highlighted signal for its tooltip.'));
    });
}

document.getElementById('file').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    setStatus('Reading ' + file.name + ' (' + file.size + ' bytes)…');
    document.getElementById('download').style.display = 'none';
    var reader = new FileReader();
    reader.onload = function () { openText(file.name, reader.result); };
    reader.onerror = function () { setStatus('Could not read ' + file.name); };
    reader.readAsText(file);
});

document.getElementById('download').addEventListener('click', function () {
    if (w) this.href = w.canvas.node().toDataURL('image/png');
});

document.getElementById('stride').addEventListener('change', function () {
    if (!lastLines) return;
    var picked = pickStride(lastLines.length, this.value);
    if (picked.error) {
        document.getElementById('stride-warn').textContent = picked.error;
        return;
    }
    document.getElementById('stride-warn').textContent = '';
    drawLines(picked.stride);
});
