// Entry point. Order: smooth scroll → choreography → chrome → pointer → intro → lazy 3D.
import { env, $ } from "./core.js";
import { initSmooth } from "./smooth.js";
import { initScroll } from "./scroll.js";
import { initNav } from "./nav.js";
import { initCursor } from "./cursor.js";
import { initSkills } from "./skills.js";
import { initGraph } from "./graph.js";
import { initForecast } from "./forecast.js";

const root = document.documentElement;
const smooth = initSmooth();
initScroll();
initNav(smooth);
initCursor();
initSkills();
initGraph();
initForecast();

// Intro: loader (first visit only) → name → headline → portrait → orb → panels → nav.
function ready() {
  if (root.classList.contains("is-ready")) return;
  root.classList.add("is-ready");
  root.classList.remove("is-arriving");
  const orbHost = $("[data-orb]");
  if (orbHost) {
    // Lazy-load the 3D layer after the intro so it never delays first paint.
    const go = () => import("./orb.js").then((m) => m.initOrb(orbHost)).catch(() => {});
    "requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 600 }) : setTimeout(go, 200);
    import("./particles.js").then((m) => m.initParticles($("[data-particles]"))).catch(() => {});
  }
}
const loader = $(".loader");
const showLoader = loader && !root.classList.contains("no-loader") && !env.reduce;
if (showLoader) {
  try { sessionStorage.setItem("la-intro", "1"); } catch {}
  setTimeout(() => loader.classList.add("is-done"), 1250);
  setTimeout(ready, 1450);
  setTimeout(() => loader.remove(), 2300);
} else {
  requestAnimationFrame(() => requestAnimationFrame(ready));
}
setTimeout(ready, 3000); // safety net: content never stays hidden
