// Scroll choreography: reveals, split text, counters, parallax, timeline progress,
// hero exit, pinned showcase and the horizontal gallery.
import { onFrame, clamp, easeOutExpo, env, $, $$ } from "./core.js";

export function initScroll() {
  const root = document.documentElement;

  // Reveals ---------------------------------------------------------------
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
      $$("[data-count]", en.target).forEach(countUp);
      if (en.target.matches("[data-count]")) countUp(en.target);
    }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  $$(".reveal, [data-split], [data-tl-item], .metric").forEach((el) => io.observe(el));

  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    const m = /^(\d+)(.*)$/.exec(el.dataset.count || "");
    if (!m || env.reduce) return;
    const end = +m[1], suffix = m[2], t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const p = clamp((t - t0) / dur);
      el.textContent = Math.round(end * easeOutExpo(p)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if (env.reduce) { $$(".reveal, [data-split], [data-tl-item]").forEach((el) => el.classList.add("is-in")); }

  // Per-frame effects ----------------------------------------------------------
  const parallax = $$("[data-speed]");
  const timelines = $$("[data-timeline]");
  const hero = $("[data-hero]");
  const heroName = hero && $(".hero-name", hero);
  const heroCopy = hero && $(".hero-copy", hero);
  const gallery = $("[data-gallery]");
  const track = gallery && $("[data-gallery-track]", gallery);
  let galleryDist = 0;

  function measureGallery() {
    if (!gallery || !track) return;
    if (env.small() || env.reduce) { gallery.style.height = ""; galleryDist = 0; return; }
    galleryDist = Math.max(0, track.scrollWidth - innerWidth);
    gallery.style.height = galleryDist > 0 ? `${innerHeight + galleryDist}px` : "";
    track.style.setProperty("--dist", `${galleryDist}px`);
  }
  measureGallery();
  addEventListener("resize", measureGallery);
  addEventListener("load", measureGallery);

  let lastY = -1, lastH = 0;
  onFrame(() => {
    const y = scrollY, vh = innerHeight;
    if (y === lastY && vh === lastH) return;
    lastY = y; lastH = vh;
    const max = root.scrollHeight - vh;
    root.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : "0");

    if (env.reduce) return;
    for (const el of parallax) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed);
      el.style.translate = `0 ${off.toFixed(1)}px`;
    }
    for (const t of timelines) {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--p", clamp((vh * 0.62 - r.top) / r.height).toFixed(4));
    }
    if (hero && y < vh * 1.2) {
      const p = clamp(y / vh);
      if (heroName) heroName.style.translate = `0 ${(p * -60).toFixed(1)}px`;
      if (heroCopy) { heroCopy.style.opacity = (1 - p * 1.1).toFixed(3); heroCopy.style.translate = `0 ${(p * -30).toFixed(1)}px`; }
    }
    if (gallery && galleryDist > 0) {
      const r = gallery.getBoundingClientRect();
      track.style.setProperty("--p", clamp(-r.top / (r.height - vh)).toFixed(4));
    }
  });

  // Pinned showcase: the sticky stage shows the cover for the step in view.
  const show = $("[data-showcase]");
  if (show) {
    const covers = $$("[data-cover]", show);
    const steps = $$("[data-step]", show);
    let active = 0;
    const so = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        active = +en.target.dataset.step;
        covers.forEach((c, i) => c.classList.toggle("is-active", i === active));
      }
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => so.observe(s));
    // The stage is decorative for assistive tech; for pointer users it opens the active case study.
    $(".stage-inner", show)?.addEventListener("click", () => {
      const link = $(".btn", steps[active]);
      if (link) link.click();
    });
  }
}
