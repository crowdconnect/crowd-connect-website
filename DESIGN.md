# Crowd.Connect · „Derselbe Abend. Zweimal.“

The live page is the Next.js site in this folder. Markup, styles and media sit in `public/` (`index.html`, `assets/css`, `assets/js`, `assets/img`, `assets/fonts`). `/` rewrites to `/index.html` before the old React homepage. Impressum and Datenschutz stay at `/impressum` and `/datenschutz`. The pilot form posts to `/api/contact`.

A new homepage for crowd-connect.de: a German scroll story for owners of bars, clubs and restaurants.

1. **Silence (hero).** A quiet Friday night in a bar. A clover-shaped lens follows the mouse (and drifts on its own on phones), revealing the same bar full of life.
2. **The receipt.** A thermal printer prints six shift-book moments where the venue loses money every night.
3. **The rewind.** The clock spins back to 19:00, the clover logo draws itself and opens like a portal into the same bar, now alive.
4. **Four venue worlds.** Restaurant 19:30, sports bar 21:48, cocktail bar 22:47 and club 00:30. Each world changes from before to after through a clover-shaped bloom and includes a live demo:
   - service call and multilingual menu
   - halftime quiz with a live leaderboard
   - Drink-to-Table on a bar map
   - music voting
5. **Events and weddings**, then **closing time at 03:00**: the night's 95 orders fall from a floor plan of the tables into the dashboard chart.
6. **Regulars, packages** (interactive, real prices), and **the morning after** in daylight: privacy FAQ and an honest GEMA section.
7. **Pilot finale.** The owner types in their venue name and it lights up in neon above a bar entrance.

A small night ticker (HUD) runs along the bottom: clock, example revenue, active tables and mood.

---

## Folder structure

```
crowd-connect-site/
├─ index.html                  all copy (German, informal du)
├─ assets/css/styles.css       design system and layouts (mobile-first, stage mode from 960×600)
├─ assets/css/fonts.css        self-hosted @font-face rules
├─ assets/fonts/               Inter, JetBrains Mono, Oswald, Tilt Neon (woff2, latin + latin-ext)
├─ assets/js/app.js            scroll engine, HUD, lens, demos (no build step)
├─ assets/js/gsap.min.js       GSAP 3.12.5
├─ assets/js/ScrollTrigger.min.js
└─ assets/img/                 12 scene photos (WebP 1280 + 1920), logo, favicon.svg, og-image.jpg
```

## Run locally

Any static server works, for example:

```bash
cd crowd-connect-site
python3 -m http.server 8080      # then open http://localhost:8080
# or: npx serve .
```

Opening `index.html` directly via file:// mostly works, but some browsers block local fonts that way.

## Deploy

This is plain static hosting (Vercel, Netlify, S3, Nginx, …). Two things to check:
- `og:image` in `index.html` points to `https://crowd-connect.de/assets/img/og-image.jpg`. Adjust it if the asset path differs.
- `canonical` is set to `https://crowd-connect.de`.

## Porting into the existing Next.js site

The page is deliberately framework-free, so it can go live as it is. If you want to move it into the current Next.js app:
1. Copy `assets/img` and `assets/fonts` to `/public`.
2. Import `styles.css` globally, and either import `fonts.css` or load the woff2 files with `next/font/local`.
3. Convert the markup in `<body>` to JSX:
   - `class` → `className`, `for` → `htmlFor`
   - SVG attributes to camelCase (`stroke-width` → `strokeWidth`, `stroke-linecap` → `strokeLinecap`, `text-anchor` → `textAnchor`)
   - `aria-*` and `data-*` attributes stay unchanged
4. For the behaviour, install `npm i gsap`, then wrap the body of `app.js` in `export function initCrowdPage() { … }`. Call it from a client component in `useEffect` after importing and registering `gsap` and `ScrollTrigger`. On unmount, call `ScrollTrigger.getAll().forEach(t => t.kill())`.

## Editing content

- **Copy:** everything is in `index.html`. The facts, modules and prices come from the current crowd-connect.de. Dashboard figures and venue scenarios are labelled as examples (Beispielwerte / Beispielansicht), and the footer notes that scenes and images are illustrative.
- **Images:** AI-generated illustrative photos. You can replace them with real pilot photos at any time:
  - Keep the `*_before` and `*_after` images of a pair in the same framing and camera position, so the clover bloom transforms one scene into the other.
  - Export both 1280 and 1920 px WebP versions under the same file names.
- **Bloom origin:** each world's `.world__media` has `data-origin="x,y"` (0–1, relative to the image). That's where the before/after bloom starts.
- **Sports TV dive:** `data-screen="x,y,w,h"` on the sports world marks the big screen in the photo that the quiz TV flies out of.
- **Night ticker (HUD):** keyframes are in `app.js` under `buildFrames()` (times, example revenue, tables, mood per scene). Interactions add small example amounts, for example +19,80 € for a sent drink.

## Pilot form

By default the form checks the fields, opens a prepared email to hello@crowd-connect.de (subject „Pilotanfrage: <Bar> (<Stadt>)“) and shows a confirmation. To send to your own backend, replace the submit handler in `app.js` (search for `initFinale`) with a `fetch()` POST to your endpoint.

## Privacy (DSGVO)

- No cookies, no tracking, no requests to third parties: fonts and GSAP are self-hosted.
- The current site loads Google Fonts from Google's servers, which LG München I ruled a GDPR violation (20.01.2022, 3 O 17493/20). The new site avoids that.
- Impressum and Datenschutz link to the existing pages. If you add analytics later, add your consent banner as well.

## Accessibility, performance and fallbacks

- All text is real, crawlable HTML with a proper heading structure.
- The demos work with the keyboard; the bar-map tables are focusable and respond to Enter and Space.
- With `prefers-reduced-motion`, scroll scrubbing is switched off and the after states are shown.
- Without JavaScript or GSAP, the page falls back to a readable static long-form page.
- Scroll uses native scrolling with pinned scenes. Anchor links respect the pinned scenes.
- Images are WebP and lazy-loaded; all 12 photos together are about 1 MB at 1920 px. Animation loops (equalizer, ambient traffic, quiz timer) only run while visible.

## Typography note

The old display font **Chathura has no German umlauts** (ä, ö, ü, ß fall back to a serif). That's probably why the current site writes „Wofuer“ or „laeuft“. The new site uses **Oswald** (already a brand font) for headlines, **Inter** for body text, **JetBrains Mono** for data and labels, and **Tilt Neon** only for the neon sign.

## Licenses

- GSAP 3.12.5 and ScrollTrigger: GreenSock Standard License (free, including commercial use).
- Fonts: SIL Open Font License 1.1.
- Images: generated for this project, illustrative.
