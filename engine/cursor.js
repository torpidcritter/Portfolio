// Desktop pointer layer: custom cursor with context labels, magnetic controls,
// glass edge highlights and subtle card tilt. Never runs on touch or reduced motion.
import { onFrame, lerp, env, $, $$ } from "./core.js";

export function initCursor() {
  if (!env.fine || env.reduce) return;
  const root = document.documentElement;
  const cur = $(".cursor");
  if (!cur) return;
  root.classList.add("has-cursor");
  const ring = $(".cursor-ring", cur), dot = $(".cursor-dot", cur), text = $("span", ring);
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, seen = false;

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mx = e.clientX; my = e.clientY;
    if (!seen) { rx = mx; ry = my; seen = true; cur.classList.remove("is-hidden"); }
  }, { passive: true });
  document.addEventListener("mouseleave", () => cur.classList.add("is-hidden"));
  document.addEventListener("mouseenter", () => cur.classList.remove("is-hidden"));

  onFrame(() => {
    rx = lerp(rx, mx, 0.2); ry = lerp(ry, my, 0.2);
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
  });

  document.addEventListener("pointerover", (e) => {
    const labelEl = e.target.closest?.("[data-cursor]");
    const hoverEl = e.target.closest?.("a, button, [role='button'], [data-cursor-hover], .chip[tabindex]");
    if (labelEl) { text.textContent = labelEl.dataset.cursor; cur.classList.add("is-label"); cur.classList.remove("is-hover"); }
    else { cur.classList.remove("is-label"); cur.classList.toggle("is-hover", !!hoverEl); }
  });

  // Magnetic pull toward the pointer.
  $$("[data-magnetic]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.28, y = (e.clientY - r.top - r.height / 2) * 0.38;
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.translate = "0 0";
    });
  });

  // Glass edge highlight follows the pointer.
  document.addEventListener("pointermove", (e) => {
    const g = e.target.closest?.("[data-glass]");
    if (!g) return;
    const r = g.getBoundingClientRect();
    g.style.setProperty("--mx", `${e.clientX - r.left}px`);
    g.style.setProperty("--my", `${e.clientY - r.top}px`);
    g.classList.add("is-lit");
  }, { passive: true });
  document.addEventListener("pointerout", (e) => {
    const g = e.target.closest?.("[data-glass]");
    if (g && !g.contains(e.relatedTarget)) g.classList.remove("is-lit");
  });

  // Tilt (only once a card has finished revealing, so transforms never fight).
  $$("[data-tilt]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      if (el.classList.contains("reveal") && !el.classList.contains("is-in")) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}
