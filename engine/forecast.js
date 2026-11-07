// Aurora preview: an animated forecast chart drawn from synthetic, seeded data.
// Safety stock and reorder point are computed from that data with the formulas shown.
import { env, $, $$ } from "./core.js";

const NS = "http://www.w3.org/2000/svg";
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = (r) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

export function initForecast() {
  const box = $("[data-forecast]");
  if (!box) return;
  const cfg = JSON.parse($("script[data-forecast-data]", box).textContent);
  const { history: H, horizon: F, leadTimeDays: L, serviceZ: Z } = cfg.auroraParams;
  const chart = $("[data-chart]", box);
  const W = 640, Ht = 300, P = { l: 36, r: 10, t: 14, b: 26 };

  function series(s) {
    const r = rng(s.seed);
    const truth = (d) => s.base + s.trend * d + s.season * Math.sin((2 * Math.PI * d) / 7);
    const hist = Array.from({ length: H }, (_, d) => Math.max(0, truth(d) + gauss(r) * s.noise));
    const resid = hist.map((v, d) => v - truth(d));
    const sigma = Math.sqrt(resid.reduce((a, b) => a + b * b, 0) / resid.length);
    const fc = Array.from({ length: F }, (_, h) => truth(H + h));
    const band = fc.map((_, h) => Z * sigma * Math.sqrt(1 + h / F));
    const mean = fc.reduce((a, b) => a + b, 0) / F;
    const ss = Z * sigma * Math.sqrt(L);
    return { hist, fc, band, sum: fc.reduce((a, b) => a + b, 0), ss, rop: mean * L + ss, mean };
  }

  function render(id) {
    const s = cfg.auroraSkus.find((x) => x.id === id);
    const d = series(s);
    const all = [...d.hist, ...d.fc.map((v, i) => v + d.band[i])];
    const lo = Math.min(...d.hist, ...d.fc.map((v, i) => v - d.band[i])) * 0.9, hi = Math.max(...all) * 1.05;
    const X = (i) => P.l + (i / (H + F - 1)) * (W - P.l - P.r);
    const Y = (v) => P.t + (1 - (v - lo) / (hi - lo)) * (Ht - P.t - P.b);
    const path = (arr, off) => arr.map((v, i) => `${i ? "L" : "M"}${X(i + off).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const fcLine = [d.hist[H - 1], ...d.fc];
    const up = d.fc.map((v, i) => `${i ? "L" : "M"}${X(H + i).toFixed(1)} ${Y(v + d.band[i]).toFixed(1)}`).join(" ");
    const dn = d.fc.map((v, i) => [X(H + i), Y(v - d.band[i])]).reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const ticks = [lo, (lo + hi) / 2, hi].map((v) => `<line class="ax" x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axl" x="0" y="${Y(v) + 3}">${Math.round(v)}</text>`).join("");
    chart.innerHTML = `<svg viewBox="0 0 ${W} ${Ht}" aria-hidden="true">${ticks}
      <path class="band" d="${up} ${dn} Z"/>
      <line class="rop" x1="${P.l}" x2="${W - P.r}" y1="${Y(d.rop / L)}" y2="${Y(d.rop / L)}"/>
      <line class="now" x1="${X(H - 1)}" x2="${X(H - 1)}" y1="${P.t}" y2="${Ht - P.b}"/>
      <path class="hist draw" d="${path(d.hist, 0)}"/>
      <path class="fc" d="${path(fcLine, H - 1)}"/>
      <text class="axl" x="${P.l}" y="${Ht - 6}">Day −30</text><text class="axl" x="${X(H - 1) - 14}" y="${Ht - 6}">Today</text><text class="axl" x="${W - P.r - 18}" y="${Ht - 6}">+7</text>
      <text class="axl" x="${W - P.r - 130}" y="${Y(d.rop / L) - 6}">Reorder point / day</text></svg>`;
    $$(".draw", chart).forEach((p) => p.style.setProperty("--len", p.getTotalLength().toFixed(0)));
    $('[data-k="sum"]', box).textContent = Math.round(d.sum).toLocaleString("en-IN");
    $('[data-k="ss"]', box).textContent = Math.round(d.ss).toLocaleString("en-IN");
    $('[data-k="rop"]', box).textContent = Math.round(d.rop).toLocaleString("en-IN");
    chart.classList.remove("is-drawn");
    if (env.reduce) { chart.classList.add("is-drawn"); return; }
    void chart.offsetWidth;
    if (seen) chart.classList.add("is-drawn");
  }

  let seen = false;
  new IntersectionObserver(([en], o) => { if (en.isIntersecting) { seen = true; chart.classList.add("is-drawn"); o.disconnect(); } }, { threshold: 0.3 }).observe(chart);
  $$("[data-sku]", box).forEach((b) => b.addEventListener("click", () => {
    $$("[data-sku]", box).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    render(b.dataset.sku);
  }));
  render(cfg.auroraSkus[0].id);
}
