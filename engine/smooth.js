// Inertial smooth scrolling (Lenis-style) for mouse wheels on desktop.
// Off for touch, trackpad pinch, reduced motion, and inside [data-lenis-prevent].
// Keyboard, scrollbar and find-in-page keep native behaviour and are re-synced.
import { onFrame, clamp, env } from "./core.js";

export function initSmooth() {
  const root = document.documentElement;
  const max = () => root.scrollHeight - innerHeight;
  let target = scrollY, current = scrollY, active = false;
  const enabled = !env.reduce && env.fine;

  if (enabled) {
    root.classList.add("lenis-on");
    addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.defaultPrevented || e.target.closest?.("[data-lenis-prevent]") || document.documentElement.classList.contains("menu-open")) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? innerHeight : 1;
      if (!active) current = scrollY;
      target = clamp(target + e.deltaY * unit, 0, max());
      active = true;
    }, { passive: false });
    addEventListener("scroll", () => { if (!active) target = current = scrollY; }, { passive: true });
    onFrame(() => {
      if (!active) return;
      current += (target - current) * 0.095;
      if (Math.abs(target - current) < 0.5) { current = target; active = false; }
      scrollTo(0, current);
    });
  }

  function go(y) {
    y = clamp(y, 0, max());
    if (!enabled) { scrollTo({ top: y, behavior: env.reduce ? "auto" : "smooth" }); return; }
    current = scrollY; target = y; active = true;
  }

  // In-page anchors: smooth, update the URL, move focus for keyboard and screen-reader users.
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a[href*='#']");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    go(el.id === "home" ? 0 : el.getBoundingClientRect().top + scrollY);
    history.pushState(null, "", url.hash);
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  });

  return { go };
}
