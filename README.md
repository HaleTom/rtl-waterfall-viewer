# rtl-waterfall-viewer

A tiny local web page that renders an `rtl_power` CSV capture as a zoomable
viridis waterfall. Pick a file, get a waterfall — no backend, no build step.

## Run it

```bash
git clone https://github.com/HaleTom/rtl-waterfall-viewer
cd rtl-waterfall-viewer
python3 -m http.server 8000
# open http://localhost:8000, pick an rtl_power CSV
```

Double-clicking `index.html` also works, except the signal-name tooltips
(`d3.json('frequencies.json')` needs http; the page says so when it falls back).

Capture example (colon-free filename — some Linux openers choke on `:`):

```bash
rtl_power -f 920M:925M:5k -g 30 -i 1 -e 20s -c '20%' -w blackman-harris \
  "spectrum-$(date -Is | tr ':' '-').csv"
```

## Features

- File picker — no hardcoded `data.csv`, your capture never leaves the browser.
- Auto stride-sampling past 2000 sweeps (with an override box), so
  hundred-megabyte captures stay interactive; the status line says exactly
  what was drawn.
- Click-drag zoom, interpolator dropdown, PNG download link.
- Hover tooltips for known signals (`frequencies.json`, SigID wiki format).
- Empty-file and single-sweep inputs get a plain message, not a blank page.

## Tests

```bash
cd tests && ./run.sh
```

Node unit tests (CSV parse, tick formatting, stride picker) plus headless
Chromium DOM probes (dropdown hit-test, download visibility, redraw,
stride box). Needs `node` and `chromium` on PATH.

## Provenance

`waterfall.js` and `d3.v4.min.js` are vendored from
[ddcc/d3-waterfall](https://github.com/ddcc/d3-waterfall) (MIT, © Dominic Chen
2016 — see `LICENSE-ddcc`), including four fixes that are also proposed
upstream as PRs #1–#4 (all-negative-dB color range, non-animated render,
dropdown z-index, range-built SI axis labels). `app.js`, `index.html` and
`tests/` are new here (same MIT terms).
