# CET Trail — Action Plan (Expedia Route 66 transition parity)

Studied from: `Screenshot 2026-11-23 170307.png`, `Screenshot 2026-11-23 170332.png`,
`image.png`, plus the five inline reference frames (hero, postcard, welcome,
mosaic, story trail).

## 🚀 Phase 0 — Immediate Foundations (CORRECTED per explore-agent audit)

**Goal:** Design tokens, fonts, decorative frame, and layering architecture.
No new deps. Build must pass. **Frame is a fixed overlay, NEVER a content wrapper.**

### 0.1 CSS variables (`src/style.css`, top of file)

```css
:root {
  --paper: #F4EFE6;
  --ink: #0B0D12;
  --brown: #5A4F42;
  --blue: #2B5876;
  --olive: #8A7A1E;
  --gold: #C9A227;
  --moon: #C9D6E8;
  --frame: #1E3A2F;   /* dark green; swap to maroon after crest confirmation */
}
```

Also switch `body { background: var(--ink); }` (hero stays dark) and add
`.chapter, .welcome, .story-stage { background: var(--paper); }` so paper
scenes are opaque above the fixed canvas. **Do NOT change body to paper globally.**

### 0.2 Fonts (`index.html <head>`)

**Keep** the existing local `@font-face` for Akira Expanded (style.css:25).
**Replace** the Google Fonts link with (Anton IS on Google Fonts; Akira is NOT):

```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;600;800;900&display=swap" rel="stylesheet">
```

Remove the invalid Poppins `@font-face` (loads a CSS URL as a font — broken).

### 0.3 Decorative viewport frame (fixed overlay, NOT a wrapper)

**`index.html`** — add as a sibling of `<main>`, NOT wrapping it:

```html
<div class="site-frame" aria-hidden="true"></div>
```

**`src/style.css`:**

```css
.site-frame {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;   /* overlay only; children are pseudo-elements */
  border: 8px solid var(--frame);
}
```

No `overflow:hidden`, no wrapper, no duplicate `<main>`. ScrollTrigger pinning
and `position:fixed` canvas remain unaffected.

### 0.4 Layering architecture (prerequisite for Phases 3–7)

Current problem: hero canvas + overlay are `position:fixed` (z 1/2) and the
hero title never fades; `.chapter` sections have no background/z-index.

Fix in Phase 0:
- `.chapter, .welcome, .story-stage { position: relative; z-index: 10; background: var(--paper); }`
- Hero canvas/overlay stay fixed at z 1/2 **only while hero is in view**;
  Phase 3 will fade them out as the postcard transition completes.
- Remove dead `.section` animation code in main.js (no `.section` elements exist).

### 0.5 Bug sweep (do now, cheap)

- Fix mosaic class mismatch: HTML `mosaic-01` → CSS `.mosaic-image-01` (rename CSS or HTML).
- Fix grain data-URI: `view=` → `viewBox=` (style.css ~line 942).
- Delete orphaned `.sound-toggle` / `.utility-strip` CSS **or** wire them in Phase 2.
- Downsize moon texture: 15MB 8k JPEG → 1–2k (~200KB) for inset sphere (Phase 5).
  Keep 8k only if fullscreen 3D pill needs it; lazy-load.

### 0.6 Acceptance

- `npm run build` passes.
- DevTools `:root` shows all 8 vars.
- 8px green frame visible at viewport edges; **all buttons/links still clickable**.
- Chapter sections render opaque paper above the fixed hero canvas.
- Anton loads (check Network tab); Instrument Serif + Inter still load.
- No duplicate IDs; no `overflow:hidden` ancestor of pinned scenes.

---

## 0b. Gap analysis

Current build: dark (#0a0a0f) static sections, plain grid mosaics, hover-only
"parallax", no pinned scenes, no scroll-driven transitions, no header state
change, no trail carousel. Reference is a **scroll-scrubbed cinematic sequence**
on warm paper with a persistent frame. Everything below closes that gap using
the existing stack (Vite + Three.js + GSAP ScrollTrigger + Lenis). No new deps.

## 1. Observed mechanics → CET mapping

| # | Reference mechanic | CET implementation |
|---|---|---|
| M1 | Dark-green viewport frame, cream paper inside | Fixed 8px frame in CET maroon/ink; page bg warm paper `#F4EFE6` |
| M2 | Hero full-bleed → shrinks to tilted bordered postcard on paper (scrub) | Keep Three.js night-sky intro ("THIS IS CET", moon story); pin hero, scrub scale 1→0.86, rotate 0→-2deg, border-radius 0→12px, reveal paper around it |
| M3 | Header brand mode → exploring mode (thumb + name, dot progress, gold CTA) | Two header states toggled by ScrollTrigger; progress = ABOUT / STORIES / JOIN; right block = stamp counter `n/8` |
| M4 | Eyebrow "WELCOME *To* TEXAS": condensed caps + script italic | "WELCOME *To* CET" — Anton caps + Instrument Serif italic (already loaded) |
| M5 | Giant brown condensed headline on topo-textured paper | Anton, `#5A4F42`, tight leading; headline: "FROM KULATHOOR TO THE MOON" (AGENTS.md tagline, safe copy); topo contour SVG texture at ~4% opacity |
| M6 | Blue torn map silhouette rises; headline inverts cream inside shape | Two stacked copies of headline; top copy cream, clipped by rising Kerala-outline SVG `clip-path`/mask, scrubbed 0→100% of scene height |
| M7 | Shape fills viewport → grain blue bg, cream type | Stage B of same pinned timeline: bg steel blue `#2B5876` + noise overlay |
| M8 | Rounded photo cards drift at different speeds, some over type | 6 absolutely-positioned cards, per-card `data-speed`, y-transform scrub; z-index split (2 behind type, 4 in front) |
| M9 | Floating 3D object in front of everything | Reuse existing moon texture (`public/models/Solarsystemscope_texture_8k_moon.jpg`) on a small inset Three.js sphere, or CSS-shaded moon disc; floats with slow rotation + scroll drift |
| M10 | "EXPLORE IN 3D" pill w/ photo thumb, persistent | Fixed bottom-right pill "EXPLORE CAMPUS IN 3D" → toggles existing Three.js scene fullscreen |
| M11 | Keychain counter 1/8 → 8/8 in gold header block | Stamp system: localStorage, toast on chapter completion (markup already exists, wire it) |
| M12 | Story screen: rounded full-bleed hero, STORY nn shield, giant title, READ pill, diamond prev/next | Per-chapter story stage; shield badge = CET crest placeholder; "READ THE STORY" opens story overlay |
| M13 | Wavy yellow trail line + circular photo stops, active enlarged w/ gold ring | SVG wavy path bottom of story stage; circular thumbs positioned along path; click/arrow/swipe changes active stop + crossfades hero |

## 2. Phases (build + verify after each)

### Phase 1 — Design system (tokens, fonts, frame, texture)
- `src/style.css`: CSS vars `--paper:#F4EFE6; --ink:#0B0D12; --brown:#5A4F42; --blue:#2B5876; --olive:#8A7A1E; --gold:#C9A227; --moon:#C9D6E8; --frame:#1E3A2F` (maroon alt pending crest confirmation).
- Add Anton (display) via Google Fonts link; keep Instrument Serif italic for script accents; Inter body; letterspaced caps labels.
- Fixed viewport frame (`.site-frame`, 8px, pointer-events none, z 999).
- Grain overlay (SVG feTurbulence data-URI, opacity .05) + topo contour SVG for paper scenes.
- Accept: build passes; paper scenes render cream w/ frame at 390px and desktop.

### Phase 2 — Header state machine + stamps
- `index.html`: single header, two inner layouts (brand / exploring).
- `src/main.js`: ScrollTrigger at hero end toggles `.is-exploring`; exploring shows current chapter thumb+name, 3-dot progress (ABOUT/STORIES/JOIN), gold CTA; stamp counter reads localStorage `cetStamps`.
- Wire existing `#stamp-toast`: IntersectionObserver on chapter end → unlock stamp, toast 2.5s, counter update.
- Accept: header swaps on scroll; counter persists across reload; toast fires once per chapter.

### Phase 3 — Hero → postcard transition (M2)
- Pin `.hero` for +=120% viewport; scrub timeline: canvas wrapper scale 1→.86, rotate -2deg, radius 12px, olive border fade-in; paper bg revealed behind; "SCROLL TO EXPLORE" cue fades out first 10%.
- Reduced motion: no pin; hero static, postcard state skipped.
- Accept: scrub feels continuous both directions; no layout jump; mobile 390px OK.

### Phase 4 — Welcome headline + Kerala mask reveal (M4–M7)
- New pinned `.welcome` scene, height +=250%.
- Stage A (0–45%): paper + brown headline; Kerala silhouette SVG rises from bottom (y 100%→0).
- Stage B (45–100%): silhouette scales to fill; cream headline copy revealed via `clip-path: url(#keralaClip)` synced to same shape; bg crossfades to blue + grain.
- Kerala outline: draft simplified SVG path now, flag for verified asset swap.
- Accept: text inversion tracks shape edge exactly at all scroll positions; reduced-motion shows final blue state statically.

### Phase 5 — Drifting mosaic + floating moon (M8–M10)
- Inside same pinned scene stage B: 6 photo cards (placeholder frames until real CET photos), per-card speed .6/1/1.4, rotations -3..3deg, shadows; 2 behind headline z, 4 in front.
- Moon: small inset canvas sphere w/ existing texture, slow spin + y-drift; or CSS disc fallback on low-power/reduced-motion.
- "EXPLORE CAMPUS IN 3D" pill fixed bottom-right → fullscreen existing scene.
- Accept: cards drift at visibly different speeds; no horizontal overflow; pill toggles scene and back.

### Phase 6 — Story trail carousel (M12–M13)
- Per chapter: story stage w/ rounded hero frame, shield badge "STORY 0n", Anton title, gold READ pill, diamond prev/next.
- Bottom SVG wavy trail + circular thumbs; active = scale 1.4 + gold ring; keyboard arrows + touch swipe; crossfade hero on change (GSAP .4s).
- READ opens immersive overlay (hero + About paragraph + gallery placeholders), Esc/close returns.
- Accept: arrows/swipe/keys/dots all work; overlay traps focus; reduced motion = instant swap.

### Phase 7 — Roll out template to all 8 chapters
- Convert existing chapter sections to the pinned template w/ per-chapter accent (Origins brown, Academics blue, Festivals gold, Events maroon, Sports green, Alumni moon, Campus Life indigo, Join olive).
- Festivals keeps verified Dhwani dates (Oct 2–4, 2026) + links to dhwanicet.com / drishti.cet.ac.in.
- Prev/next chapter links scroll to adjacent pinned scene (Lenis scrollTo).
- Accept: full scroll journey hero→8 chapters→footer continuous; stamps 8/8 reachable.

### Phase 8 — Polish & launch checks
- Reduced-motion audit: every pin/scrub has static fallback.
- Perf: transform/opacity-only animations, `will-change` on scrubbed nodes only, lazy-load below-fold images, pixelRatio cap 2 (exists), target Lighthouse 90+ mobile.
- A11y: focus-visible everywhere, carousel aria, contrast AA on paper (brown on cream passes), frame aria-hidden.
- SEO: per-chapter titles/descriptions, CollegeOrUniversity schema, OG image.
- `npm run build` clean; browser screenshot pass at 0/25/50/75/100% scroll, 390px + 1440px.

## 3. Assets & content needed (blockers, per AGENTS.md §10)
- [ ] 40–60 real CET photos (mosaic + story heroes + trail thumbs). Placeholders until then.
- [ ] Verified Kerala outline SVG (draft path used meanwhile).
- [ ] CET crest for shield badge + frame/accent colour confirmation (maroon vs gold).
- [ ] 3–5 short MP4 loops (optional story heroes, ≤3MB, poster images).
- [ ] Verified stats for counters (departments, alumni, acres) — do not publish invented numbers.
- [ ] Consent/credits for people in photos.

## 4. Risks
- Pin-heavy scroll on low-end phones → lite-motion mode (media query + `matchMedia` pointer coarse fallback: fewer pins, shorter scrubs).
- clip-path mask sync drift → drive both shape and clip from one GSAP progress value, never two tweens.
- Three.js double-canvas cost → inset moon canvas renders only while its scene is in view (IntersectionObserver pauses RAF).
- Copying reference assets → all imagery/type original or licensed; structure only borrowed.

## 5. Order of work
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8, build + screenshot verify after each.
Phases 1–3 deliver the visible "wow" (frame, header, postcard) fastest;
4–5 deliver the signature mask+mosaic; 6–7 complete the journey.
