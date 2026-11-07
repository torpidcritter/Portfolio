// Sparse dust drifting through the hero light. Desktop only; paused off-screen.
import { env } from "./core.js";

export function initParticles(canvas) {
  if (!canvas || env.reduce || env.small()) return;
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1, visible = true, raf = 0, mx = 0, my = 0;
  const N = 70;
  const ps = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8, s: 0.4 + Math.random() * 1.2, a: 0.1 + Math.random() * 0.45, v: 0.00004 + Math.random() * 0.00012 }));
  const resize = () => { const r = canvas.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); w = r.width; h = r.height; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(64, now - last); last = now;
    ctx.clearRect(0, 0, w, h);
    for (const p of ps) {
      p.y -= p.v * dt * p.z; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      const x = (p.x + mx * 0.02 * p.z) * w, y = (p.y + my * 0.02 * p.z) * h;
      ctx.globalAlpha = p.a * p.z; ctx.fillStyle = "#e9ebee";
      ctx.beginPath(); ctx.arc(x, y, p.s * p.z, 0, Math.PI * 2); ctx.fill();
    }
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  };
  const resume = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; resume(); }).observe(canvas);
  document.addEventListener("visibilitychange", resume);
  resume();
}
