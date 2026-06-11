// ── Squarified treemap layout + Finviz-style color scale ─────────

export function squarify(data, x, y, w, h) {
  const items = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total || w <= 0 || h <= 0) return [];
  const scaled = items.map((i) => ({ ...i, area: (i.value / total) * w * h }));

  const rects = [];
  let rx = x, ry = y, rw = w, rh = h;
  let row = [], rowArea = 0;

  const worst = (r, len) => {
    const s = r.reduce((a, it) => a + it.area, 0);
    const max = Math.max(...r.map((it) => it.area));
    const min = Math.min(...r.map((it) => it.area));
    return Math.max((len * len * max) / (s * s), (s * s) / (len * len * min));
  };

  const placeRow = () => {
    const len = Math.min(rw, rh);
    if (len <= 0 || !rowArea) { row = []; rowArea = 0; return; }
    const thickness = rowArea / len;
    let off = 0;
    for (const r of row) {
      const extent = r.area / thickness;
      if (rw >= rh) rects.push({ ...r, x: rx, y: ry + off, w: thickness, h: extent });
      else rects.push({ ...r, x: rx + off, y: ry, w: extent, h: thickness });
      off += extent;
    }
    if (rw >= rh) { rx += thickness; rw -= thickness; }
    else { ry += thickness; rh -= thickness; }
    row = []; rowArea = 0;
  };

  let i = 0;
  while (i < scaled.length) {
    const len = Math.min(rw, rh);
    const item = scaled[i];
    if (row.length === 0 || worst([...row, item], len) <= worst(row, len)) {
      row.push(item); rowArea += item.area; i++;
    } else {
      placeRow();
    }
  }
  if (row.length) placeRow();
  return rects;
}

// Finviz palette: -3% deep red → 0% slate → +3% green
const STOPS = [
  [-3, [0xf6, 0x35, 0x38]],
  [-1.5, [0xbf, 0x40, 0x45]],
  [0, [0x41, 0x45, 0x54]],
  [1.5, [0x2f, 0x9e, 0x4f]],
  [3, [0x30, 0xcc, 0x5a]],
];

export function changeColor(pct) {
  const p = Math.max(-3, Math.min(3, pct ?? 0));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a, ca] = STOPS[i];
    const [b, cb] = STOPS[i + 1];
    if (p >= a && p <= b) {
      const t = (p - a) / (b - a);
      const rgb = ca.map((v, k) => Math.round(v + (cb[k] - v) * t));
      return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    }
  }
  return "rgb(65,69,84)";
}
