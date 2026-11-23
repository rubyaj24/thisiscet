# CET Website Build Script

A build blueprint for a scroll-driven, story-first website for the College of Engineering Trivandrum, based on the current thisiscet.vercel.app and the structure of Expedia's Route 66 Texas page.

## 1. Where you are and where you're heading

**Current site (thisiscet.vercel.app).** A single page with a dark intro, the quote "IITians took us to silicon valley, but CETians took us to moon", a hero (THIS IS CET, #1 in Kerala, NAAC A+, NBA, NIRF Top 100), and short text blocks for About, Festivals, Events and Sports, plus a footer with the address and contact details. The bones are good: a strong tagline, clear sections and a proud tone. What it lacks is depth, imagery, motion and navigation between stories.

**Reference (Expedia Route 66, Texas).** What makes it feel premium, and what we will borrow as *ideas*, not assets or copy:

- **Chapter structure.** Each state is its own full-screen chapter with a title card, "Welcome to" intro, a big headline and a scroll prompt.
- **Previous / next chapter navigation.** The state header links to the previous and next state, so the site feels like a journey.
- **Photo mosaic intro.** A scattered set of large photos sits under a bold headline.
- **About block with live facts.** A short story paragraph, a stop list (Shamrock, McLean, Amarillo, Adrian, Glenrio), a mile counter and a state outline map.
- **Story carousel.** Five stories, each with a big title, a Read story button and Prev / Next controls. Each opens into a full-screen immersive page with a hero image or video and a short "About" paragraph.
- **Gamification.** Collectible state key chains (0/8) with a toast notification ("New keychain!").
- **Utility strip.** Sound on/off, a 3D map link, a states menu, and one clear call to action.
- **Texture and closing.** Pattern overlays, and a closing "Did you know" fact with an animated counter.

**The big idea for CET.** Turn the college into a journey. Expedia has *The Mother Road*; CET has *The Trail*: a single scroll through 80+ years of legacy, from the 1939 founding to the moon. Each chapter is a "state".

## 2. Concept: "The CET Trail"

**Tagline options:** *This is CET.* / *From Kulathoor to the Moon.* / *Eighty years. One campus. Endless orbit.*

**Metaphor.** The visitor travels a trail through the campus and its story. Each stop is a chapter with its own colour, hero image, stories and facts, and a collectible "stamp" earned on completion.

| Chapter ("state") | Theme | Stories inside ("roadside stories") |
| --- | --- | --- |
| 01 Origins | 1939 founding, legacy | Founding story, the oldest building, a timeline |
| 02 Academics | Departments, labs, research | One story per flagship department; a lab tour |
| 03 Festivals | Three fests: Drishti, Dhwani and Disha | One story per fest (Drishti, Dhwani, Disha), behind the scenes, signature moments, a photo wall |
| 04 Events | Lectures, hackathons, workshops | Hackathon recap, guest lecture highlights |
| 05 Sports | Annual meet, teams, grounds | Meet day, a team profile, the grounds |
| 06 Alumni | The "CETians who went to the moon" | Alumni spotlights in space, tech, public service |
| 07 Campus Life | Hostels, clubs, food, places | The canteen, the library, the hangout spots |
| 08 Join / Contact | Admissions, visit, alumni connect | CTA, map, contact |

> Placeholder note: every fact, name and number above beyond what is on the current site (founded 1939, NAAC A+, NBA, NIRF Top 100, Dhwani, Drishti, address, email, phone) must be verified with the college before launch. Do not publish invented statistics.

## 3. Sitemap and page templates

- `/` Home: cinematic intro, trail overview, chapter teasers, stat counters, CTA
- `/chapter/[slug]` Chapter page: title card, welcome, mosaic, about + facts + mini-map, story carousel, prev/next chapter
- `/chapter/[slug]/[story]` Story page: full-screen hero (image or video), one headline, an "About" block, a gallery, prev/next story
- `/map` Interactive campus map (2D first, 3D later)
- `/stamps` Collectible badge page
- `/about`, `/contact`, `/admissions` (can link out to official pages)

## 4. Experience design

**Intro (first 5 seconds).** Black screen, the quote types in, then a hard cut to the "THIS IS CET" title with a slow camera push on a campus photo. A scroll cue ("Scroll to explore") fades in.

**Scroll behaviour.**

- Smooth scroll (Lenis) with pinned sections.
- Parallax on hero photos; the headline letters reveal on enter.
- The photo mosaic drifts at different speeds per image.
- Counters (years, departments, alumni, acres) animate once when entering view.
- A thin progress line on the side shows position along the trail.

**Story carousel.** Large type titles, one active at a time, with a numbered label ("Story 03"). Thumbnails below. Keyboard arrows and swipe supported. Clicking opens the immersive story page with a shared-element transition.

**Gamified stamps.** Finish a chapter and a toast appears: "New stamp unlocked". Stamps save in local storage. Collect all 8 for a shareable "I explored CET" card (or a prospective-student perk, if the college wants one).

**Sound.** Optional, off by default, with a toggle. A soft ambient bed and a subtle click on transitions.

**Mobile first.** Most Kerala visitors will arrive on a phone. Design the 390px layout first: stacked mosaic, swipe carousel, tap targets of at least 44px, lighter animations.

## 5. Visual design system

- **Mood:** proud, cinematic, a bit nostalgic and a bit space-age.
- **Palette (starting point):** deep ink `#0B0D12`, warm paper `#F4EFE6`, a CET accent (maroon or gold pulled from the college crest, to be confirmed), plus one cool "moon" tone `#C9D6E8`. Give each chapter a secondary hue.
- **Type:** a bold display face (for example Anton, Bebas Neue or a condensed grotesque) for headlines, a clean serif or sans for body (for example Inter or Source Serif), and a mono face for labels like "STORY 03".
- **Texture:** subtle grain and a repeating pattern overlay between sections, like Expedia's peekaboo pattern.
- **Imagery rule:** real CET photography only. Commission or collect 40 to 60 strong photos (campus, festivals, sports, labs, people). Photography will make or break this site.
- **Motion rules:** ease-out curves, 400 to 800ms, nothing that blocks reading, and full support for reduced-motion.

## 6. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Routing, SEO, image optimisation, easy Vercel deploy |
| Styling | Tailwind CSS + CSS variables | Fast, themeable per chapter |
| Motion | GSAP + ScrollTrigger, Lenis, Framer Motion | Scroll storytelling and page transitions |
| 3D (optional, phase 3) | Three.js / React Three Fiber | 3D campus map, hero effects |
| Maps | MapLibre GL (free) or Mapbox | Campus and trail map |
| CMS | Sanity | Editors update stories, photos and stats without code |
| Media | next/image, Cloudinary or Sanity assets, WebP/AVIF, short MP4 loops | Fast loading |
| Hosting | Vercel | You already use it |
| Analytics | Vercel Analytics or Plausible | Privacy-friendly |

## 7. Suggested project structure

```
cet-site/
  app/
    layout.tsx
    page.tsx                      # Home
    chapter/[slug]/page.tsx       # Chapter template
    chapter/[slug]/[story]/page.tsx
    map/page.tsx
    stamps/page.tsx
  components/
    intro/Quote.tsx, TitleCard.tsx
    chapter/Mosaic.tsx, AboutFacts.tsx, StoryCarousel.tsx, ChapterNav.tsx
    story/StoryHero.tsx, Gallery.tsx
    ui/Header.tsx, SoundToggle.tsx, StampToast.tsx, Counter.tsx, ProgressRail.tsx
  lib/
    sanity.ts, scroll.ts (Lenis + GSAP setup), stamps.ts
  sanity/schemas/
    chapter.ts, story.ts, fact.ts, stat.ts
  public/ (fonts, patterns, audio)
```

**Content model (Sanity).**

- `chapter`: title, slug, subtitle, accentColour, heroImage, intro, mosaicImages\[\], facts\[\], stories\[\], order
- `story`: title, slug, chapterRef, heroImage or heroVideo, aboutHeading, aboutBody, gallery\[\], order
- `stat`: label, value, unit

## 8. Build phases

**Phase 0: Foundations (2 to 3 days).** Collect the brief, logo, crest, brand colours and the first 40 photos. Verify every fact with the college. Set up the repo, Vercel project and Sanity studio.

**Phase 1: Skeleton (week 1).** Design tokens, fonts, header, footer, smooth scroll, routing for home, chapter and story templates with dummy content. Deploy a preview link to share.

**Phase 2: Core experience (weeks 2 to 3).** Intro sequence, home page, one fully finished chapter (Festivals is a good pilot because it is photogenic), the story carousel and story page, counters and the progress rail. Review with students and staff.

**Phase 3: Scale out (weeks 4 to 5).** Roll out the remaining chapters from the template, add stamps and toasts, the sound toggle, and the campus map.

**Phase 4: Polish and launch (week 6).** Performance pass, accessibility pass, SEO and Open Graph images, 404 page, analytics, a custom domain, and a launch plan with the student bodies.

**Phase 5: Later.** 3D map, alumni submission form, a virtual campus tour, Malayalam language toggle, admissions integration.

## 9. Performance, accessibility, SEO

- Target Lighthouse 90+ on mobile. Lazy-load below-the-fold media, serve AVIF/WebP, cap video loops at about 3MB and give them a poster image.
- Respect `prefers-reduced-motion` by replacing parallax and reveals with simple fades.
- Provide real alt text, visible focus states, keyboard-operable carousels and a sound-off default.
- Colour contrast at WCAG AA or better, especially text over photos (use gradient scrims).
- Server-render all story text so search engines and slow phones get content without waiting for animation. Add per-page titles, descriptions and Open Graph images, and schema.org `CollegeOrUniversity` data.
- Do not hide essential information (admissions, contact) behind animation.

## 10. Content checklist (collect before building)

- [ ] Official logo, crest, brand colours and permission to use them
- [ ] 40 to 60 high-resolution photos with credits and consent for people shown
- [ ] 3 to 5 short videos (campus, Drishti, Dhwani, Disha, sports meet)
- [ ] Verified timeline from 1939 to today
- [ ] 5 stories per chapter, each with a 80 to 120 word "About" paragraph
- [ ] Verified stats (departments, students, alumni, campus area, rankings and their year)
- [ ] Alumni spotlights with their consent
- [ ] Official contact, admissions link and social handles
- [ ] Approval from the college administration, since this is a public face of the institution

## 11. Risks and how to handle them

- **Copying too closely.** Borrow the structure and feel, not Expedia's code, images, copy or branding. Everything on the CET site should be original.
- **Heavy animation hurting phones.** Build mobile first, profile early and keep a lite-motion mode.
- **Weak photography.** If real photos are thin, run a campus shoot weekend with student photographers before design polish.
- **Unverified claims.** Rankings and "#1" statements need a source and a year, or they should be softened.
- **Content going stale.** The CMS lets student clubs maintain stories, with an editor approval step.

## 12. Master prompt for your AI coding assistant

Copy this when you are ready to start building:

```
Build a Next.js 14 (App Router, TypeScript, Tailwind) website for College of Engineering Trivandrum called "The CET Trail".

Structure: a home page plus chapter pages (/chapter/[slug]) and story pages (/chapter/[slug]/[story]).
Chapters: Origins, Academics, Festivals (Drishti, Dhwani, Disha), Events, Sports, Alumni, Campus Life, Join.

Home: black intro that types the quote "IITians took us to silicon valley, but CETians took us to moon", then a full-screen "THIS IS CET" title with a scroll cue, stat counters (NAAC A+, NBA, NIRF Top 100, since 1939), and chapter teasers.

Chapter page: full-screen title card with prev/next chapter links, a "Welcome to" intro, a drifting photo mosaic, an About block with a short paragraph, a stop list and animated facts, then a story carousel (big titles, numbered label, thumbnails, Prev/Next, swipe and arrow keys). Each story opens to a full-screen hero with a headline and About paragraph.

Extras: side progress rail, collectible stamp per chapter with a toast and local-storage persistence, optional sound toggle (off by default), grain and pattern overlays.

Tech: GSAP ScrollTrigger + Lenis for scroll, Framer Motion for page transitions, Sanity for content, next/image for media. Mobile-first, respect prefers-reduced-motion, Lighthouse 90+ on mobile, WCAG AA contrast.

Start with the design tokens, layout, smooth scroll and the chapter template using dummy content, then build the home page.
```

## 13. Next steps

1. Confirm the chapter list and the "Trail" concept with your team.
2. Start collecting photos and verified facts today, since content is the longest-lead item.
3. Sketch the mobile home page and one chapter page.
4. Run Phase 0 and Phase 1, then share a preview link for feedback.
