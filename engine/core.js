// Shared frame loop and helpers. One requestAnimationFrame drives every scroll/pointer effect.
const subs = new Set();
let running = false;
function tick(t) { for (const f of subs) f(t); requestAnimationFrame(tick); }
export function onFrame(fn) {
  subs.add(fn);
  if (!running) { running = true; requestAnimationFrame(tick); }
  return () => subs.delete(fn);
}
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const root = document.documentElement;
export const env = {
  reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
  fine: matchMedia("(hover: hover) and (pointer: fine)").matches,
  small: () => innerWidth <= 900,
  preview: root.hasAttribute("data-preview"),
};
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
export const isTyping = (e) => { const t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); };
