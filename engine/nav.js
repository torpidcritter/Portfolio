// Navigation, menu, shortcuts, page transitions, copy-to-clipboard, lightbox.
import { env, $, $$, isTyping } from "./core.js";

export function initNav(smooth) {
  const root = document.documentElement;
  const onHome = !!$("[data-hero]");
  const homeHref = $(".nav-mark")?.getAttribute("href")?.split("#")[0] || "/";

  // Active section + sliding indicator --------------------------------------
  const links = $$("[data-nav]");
  const ind = $(".nav-indicator");
  const moveTo = (a) => {
    links.forEach((l) => l.classList.toggle("is-active", l === a));
    if (!ind) return;
    if (!a) { ind.classList.remove("is-on"); return; }
    ind.style.width = `${a.offsetWidth}px`;
    ind.style.transform = `translateX(${a.offsetLeft}px)`;
    ind.classList.add("is-on");
  };
  if (onHome) {
    const so = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        moveTo(links.find((l) => l.dataset.nav === en.target.id) || null);
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["home", ...links.map((l) => l.dataset.nav)].forEach((id) => { const s = document.getElementById(id); if (s) so.observe(s); });
  }

  // Mobile menu ------------------------------------------------------------------
  const btn = $("[data-menu-toggle]"), menu = $("#menu");
  const menuLinks = menu ? $$("a", menu) : [];
  const setMenu = (open) => {
    if (!btn || !menu) return;
    btn.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    root.classList.toggle("menu-open", open);
    menu.toggleAttribute("inert", !open);
    menuLinks.forEach((a) => (a.tabIndex = open ? 0 : -1));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) menuLinks[0]?.focus();
  };
  if (menu) menu.setAttribute("inert", "");
  btn?.addEventListener("click", () => setMenu(btn.getAttribute("aria-expanded") !== "true"));
  menu?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  // Keyboard shortcuts ---------------------------------------------------------------
  const help = $("#shortcuts");
  const ids = ["home", "about", "experience", "projects", "recognition", "contact"];
  const jump = (id) => {
    const el = document.getElementById(id);
    if (el) { smooth.go(id === "home" ? 0 : el.getBoundingClientRect().top + scrollY); history.pushState(null, "", `#${id}`); }
    else location.href = `${homeHref}#${id}`;
  };
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") { setMenu(false); help?.classList.remove("is-open"); closeLightbox(); return; }
    if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-6]$/.test(e.key)) jump(ids[+e.key - 1]);
    else if (e.key === "p" || e.key === "P") jump("projects");
    else if (e.key === "c" || e.key === "C") jump("contact");
    else if (e.key === "?") help?.classList.toggle("is-open");
  });

  // Page transitions: fade a curtain over the page, then navigate. -------------------
  const leave = (url) => {
    if (env.reduce) { location.href = url; return; }
    root.classList.add("is-leaving");
    setTimeout(() => { location.href = url; }, 380);
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === "_blank" || a.hasAttribute("download") || a.protocol === "mailto:") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return; // same page: anchors handled by smooth scroll
    e.preventDefault();
    leave(url.href);
  });
  addEventListener("pageshow", () => root.classList.remove("is-leaving"));

  // Copy email ---------------------------------------------------------------------------
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const status = b.parentElement?.querySelector(".copy-status");
    const say = (t) => { if (status) { status.textContent = t; setTimeout(() => (status.textContent = ""), 2400); } };
    try { await navigator.clipboard.writeText(b.dataset.copy); say("Copied"); }
    catch { say("Select the address to copy"); }
  }));

  // Preview builds cannot serve downloads: say so instead of failing silently.
  if (env.preview) {
    $$("[data-resume-link]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      const pop = document.createElement("div");
      pop.className = "glass"; pop.setAttribute("role", "status");
      Object.assign(pop.style, { position: "fixed", left: "50%", bottom: "24px", transform: "translateX(-50%)", padding: "12px 18px", zIndex: 70, fontSize: "14px" });
      pop.textContent = "Preview only: the resume PDF downloads from the deployed site.";
      document.body.appendChild(pop);
      setTimeout(() => pop.remove(), 3200);
    }));
  }

  // Lightbox -----------------------------------------------------------------------------
  const lb = $("[data-lightbox-view]");
  let lastFocus = null;
  function closeLightbox() { if (lb?.classList.contains("is-open")) { lb.classList.remove("is-open"); lastFocus?.focus(); } }
  if (lb) {
    $$("[data-lightbox]").forEach((b) => b.addEventListener("click", () => {
      lastFocus = b;
      const img = $("img", lb); img.src = b.dataset.lightbox; img.alt = $("img", b)?.alt || "";
      lb.classList.add("is-open"); $("[data-lightbox-close]", lb).focus();
    }));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest("[data-lightbox-close]")) closeLightbox(); });
  }
}
