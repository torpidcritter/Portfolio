# Lavish Avinash — cinematic portfolio

Dark, monochrome, glass-and-chrome portfolio built with Next.js and a small hand-written motion engine.

```
content/profile.json     ← every fact on the site (and the resume) lives here
content/demos.json       ← illustrative data for the AMU graph and Aurora dashboard
styles/tokens.css        ← design system: colour, glass, metal, type, space, radius, motion, layers
styles/site.css          ← components and sections, built only from tokens
components/              ← React components (framework-neutral, server-rendered)
public/engine/           ← motion + interaction engine (plain ES modules, no dependencies)
app/                     ← Next.js routes: /, /projects/[slug]/, 404, sitemap, robots
scripts/prerender.tsx    ← renders the same components to static HTML for preview and QA
resume/                  ← resume generator (PDF + DOCX) and ATS checker
```

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export → out/
npm run preview      # same pages without Next.js → preview/  (serve with: npx serve preview)
```

## Deploy

Vercel: import the repo; framework Next.js; build `npm run build`; output `out`.
Any static host: upload `out/`. Set `person.siteUrl` in `content/profile.json` once you have a domain.

## Add your photograph

1. Put the image in `public/images/`, e.g. `public/images/lavish.jpg`. A portrait-oriented photo
   (4:5, at least 1000 × 1250 px) works best; JPG or WebP under ~250 KB.
2. In `content/profile.json` set
   `"portrait": { "src": "/images/lavish.jpg", "alt": "Portrait of Lavish Avinash", "focus": "50% 30%" }`.
   `focus` moves the crop (x% y%).
3. The site applies the monochrome treatment, arch mask, rim light and parallax itself. The frame
   has a fixed aspect ratio, so swapping the photo never shifts the layout.
4. Re-take `public/og.png` (the social preview) so it shows the photo.

## Motion engine (public/engine)

| Module | What it does |
|---|---|
| `main.js` | Boot order; intro sequence (loader → name → headline → portrait → orb → panels → nav); lazy-loads 3D |
| `smooth.js` | Inertial wheel scrolling (Lenis-style), smooth anchors with focus management |
| `scroll.js` | Reveals, split-text, count-ups, parallax, timeline progress, hero exit, pinned showcase, horizontal gallery |
| `cursor.js` | Custom cursor with context labels, magnetic buttons, glass highlights, card tilt (desktop only) |
| `nav.js` | Active-section indicator, mobile menu, keyboard shortcuts, page transitions, copy email, lightbox |
| `orb.js` | Liquid-metal orb: one raymarched WebGL shader, pointer-reactive, paused off-screen |
| `particles.js` | Sparse dust in the hero light (desktop only) |
| `graph.js` | AMU impact graph: reverse-dependency walk, paths, tests, docs, coverage, confidence |
| `forecast.js` | Aurora dashboard: seeded synthetic series, forecast band, safety stock and reorder point |

Why no GSAP, Three.js, Lenis or Framer Motion: the effects needed here are small enough to write
directly (the whole engine is about 700 lines), which keeps the bundle tiny and removes four
dependencies. If you later want GSAP or React Three Fiber for something larger, each module above is
self-contained and can be swapped on its own.

Performance and accessibility:

- 3D loads after the intro and pauses when off-screen or the tab is hidden. Pixel ratio is capped.
- Phones and `prefers-reduced-motion` get one rendered still frame of the orb, no particles, no
  custom cursor, no smooth-scroll hijack, no pinning.
- Under reduced motion all content is visible immediately and the loader is skipped.
- Everything animates with `transform`/`opacity`/`translate`; one shared frame loop.
- Content works without JavaScript; the engine only enhances it.
- Skip link, focus styles, keyboard-operable graph and filters, `aria-live` reports, alt text.
- Muted text is #8A8D93 rather than #73767D so small labels pass 4.5:1 contrast on #08090B.

Keyboard: `1`–`6` jump to sections, `P` projects, `C` contact, `?` shortcut list, `Esc` closes.

## Content rules

- Text in `[[double brackets]]` is a placeholder and never renders.
- `verify` notes mark claims not yet confirmed (see `MISSING_INFO.md`).
- The AMU graph and Aurora dashboard are labelled on the page as illustrations with example data.
- Screenshots: add `{ "src": "/images/...", "alt": "..." }` to a project's `screenshots` array and a
  gallery with a lightbox appears on its case study.

## Contact form

There's an email button, a Copy button and profile links, but no form, so nothing pretends to send mail.
To add one, use a form service (Formspree, Resend), keep its key in an env variable, and render the form
only when that variable is set.
