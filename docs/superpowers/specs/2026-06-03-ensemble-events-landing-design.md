# Ensemble — Luxury Event House Landing Page — Design Spec

> Date: 2026-06-03 · Status: approved direction, pending spec review
> Supersedes the prose brief at `normie-apps/EVENTS_LANDING_BRIEF.md` (kept for strategy/research provenance).
> Strategy is settled. This document is the design of record for the build plan.

---

## 1. Positioning (the one thing that matters)

A **Zürich-based, full-service luxury event house** targeting the **elite / UHNW tier** (luxury
private events, premium corporate, weddings) — the ~CHF 100k+ event. We do catering + live
artists/DJs + an **in-house service brigade** that runs the floor.

**The wedge (burn it into every section):** every Swiss luxury competitor (Fête Accomplie, Mosaic,
Sara Mazzei, Events by Loukia, Howard & Co) markets "single point of contact" but is really a
**coordinator** — they rent caterers, DJs, and waitstaff from the freelance pool per event. **We own
our team.** Nobody else does. This is verified white space, not marketing spin.

> **Brand line:** "Not a network of vendors — one team, from the first sketch to the last glass cleared."

Three supporting pillars (all underexploited by competitors):
1. **One real team, end to end** — single accountability, no finger-pointing at a CHF 100k event.
2. **The service brigade as hero** — named, trained, recurring faces. The retention engine (this
   market runs on repeat + referral). Nobody romanticizes their team; we do.
3. **Discretion, productized** — NDA-by-default, private portfolio shown only under NDA.

**Tone:** cinematic, restrained, confident. Quiet luxury — editorial magazine, not nightclub flyer
(even though we do the parties).

---

## 2. Brand name

**Working name: ENSEMBLE** (wordmark *Ensemble — Zürich*). Triple meaning: "together / as one"
(the wedge), a **group of performers** (in-house DJs/artists), and quiet European luxury. Set in a
thin serif.

The name is a **swappable token** (`BRAND_NAME`), not a structural dependency. Alternates if it
changes: *Brigade*, *Maison Convive*. The build must not hardcode the name into component logic.

---

## 3. Design system

### 3.1 Palette — "Cream & Gold" (approved)

| Token | Hex | Role |
|---|---|---|
| `--cream` | `#F7F4EF` | Page background (light sections) |
| `--ink` | `#141414` | Primary text on cream |
| `--gold` | `#B89B5E` | Accent — hairlines, single accent words, CTA border/foil |
| `--greige` | `#C9BEA9` | Borders, dividers, muted UI lines |
| `--espresso` | `#1C1A17` | The one dark section background |
| `--cream-on-dark` | `#F2ECE0` | Text on the dark section |

Rules: gold is used **sparingly** (a hairline, one word, the CTA, foil details) — never as fills or
large areas. No rainbow, no neon. The page is overwhelmingly cream and ink.

### 3.2 Typography

- **Display:** Cormorant (oversized thin serif) — headlines, the wordmark, pull-quotes.
- **Body / UI:** Inter — paragraphs, nav, form, captions.
- Oversized headlines, generous line-height, lots of white space. Self-host + preload both fonts.

### 3.3 Motion

- **One animated WebGL background, hero only.** Every other section uses a **solid background** with
  cheap, light motion only (`FadeContent` / `AnimatedContent` / `ScrollReveal`) — no GPU cost.
- One reveal per section, slow and considered. Restraint reads as expensive.
- Respect `prefers-reduced-motion` everywhere — disable WebGL + text animations, show static state.

### 3.4 Photography

Photography is the product — large, professionally graded, consistent. Launch on high-quality stock
placeholders; design assumes great imagery and swaps real event/brigade shots in later.

### 3.5 Languages

Ship **DE + EN**; architecture ready for **FR** (Geneva reach). Plan i18n from the start
(string catalog, no hardcoded copy in components).

### 3.6 Page rhythm (light → dark → light)

Most sections sit on cream. **One section — the Brigade / artists beat — flips to a deep `--espresso`
solid background** for a single cinematic "evening / the party" moment, then back to cream. This gives
the page a heartbeat and shows we do both refined *and* fun.

---

## 4. Component library

`react-bits-vault` (sibling repo at `../react-bits-vault`, 230 components).
- Free import: `@/free/<Category>/<Name>/<Name>` · Pro import: `@/pro/react-bits/<slug>`
- `@/` aliases to vault `src/`; `cn` helper at `@/lib/utils`. Browse `catalog.json` / `CATALOG.md`.
- Vault components are private/licensed — fine inside our product, do **not** redistribute.

---

## 5. Section-by-section spec

Page order top-to-bottom. Each section: intent + exact component(s) + background treatment.

### 5.0 Preloader (optional, first load only) — `@/pro/react-bits/preloader`
Brand curtain: wordmark composes, then lifts to reveal the hero. Tasteful, easy to cut. Skippable
after first visit (session flag). Must not delay LCP measurement materially.

### 5.1 Hero (full viewport) — `Silk` background
- **Background:** `@/free/Backgrounds/Silk/Silk` (soft fabric motion, gold-on-cream tuning) with a
  faint `@/free/Animations/Noise/Noise` grain overlay for matte-paper texture. **Static graded image
  paints first as the LCP element; Silk shader lazy-inits and fades in after.**
- **Headline (one reveal on load, then still):** `@/free/TextAnimations/SplitText/SplitText` or
  `BlurText` — "One team. Every detail. From concept to the last glass cleared."
- **Sub:** Full-service luxury events across Zürich and Switzerland — catering, artists, and a service
  team entirely our own.
- **CTA:** single button, gold `@/free/Animations/StarBorder/StarBorder` — "Request a private
  consultation" (scrolls to contact). Optional `ShinyText` on the CTA word only.

### 5.2 The wedge (positioning statement) — solid cream
- Pure typography, maximum white space. `@/free/TextAnimations/ScrollReveal/ScrollReveal` brings it
  in line by line. Nothing else on screen.
- Copy: *Most houses coordinate vendors. We are the kitchen, the music, and the floor — under one
  roof, accountable to you alone.*

### 5.3 What we own (services) — solid cream
- `@/free/Components/MagicBento/MagicBento` asymmetric grid, four cards:
  **Catering · Live Artists & DJs · The Service Brigade · End-to-End Production.**
- Each card = one outcome-led line (not a feature list). This is where "one team" becomes visual.

### 5.4 The Brigade ⭐ (signature differentiator) — **solid dark (`--espresso`)**
- The page's one dark beat. Romanticize the in-house team: real action shots (kitchen pass, DJ booth,
  floor mid-service).
- `@/free/Components/CircularGallery/CircularGallery` for action shots;
  `@/free/Components/ProfileCard/ProfileCard` for a few named, uniformed, recurring faces.
- Caption carries discretion: *the same trusted faces, every time.*

### 5.5 Before / after — solid cream — `@/pro/react-bits/comparison-slider`
- Draggable "empty venue → finished event." Shows literally what the team does. Distinctive — no
  competitor has this. Sits as a bridge into the portfolio.

### 5.6 Portfolio — solid cream
- `@/free/Components/Masonry/Masonry` editorial grid by event type (Private · Corporate · Wedding),
  with `@/pro/react-bits/hover-preview` reveal-on-hover thumbnails.
- Designed to look intentional with **one flagship event** at launch (sparse-by-design); scales as
  more is shot. Filter by type only once enough assets exist.

### 5.7 Proof in numbers — solid cream — `@/free/TextAnimations/CountUp/CountUp`
- Quiet stats band: *events delivered · guests served · years · team members **on staff*** (the last
  number hammers the wedge). Discreet, single row.

### 5.8 Social proof — solid cream
- `@/free/Animations/LogoLoop/LogoLoop` client-logo marquee (highest-impact trust signal in this
  market) + 2–3 emotional testimonials in `@/free/Components/SpotlightCard/SpotlightCard`.
- **Launch reality:** no logos yet → lead with **founder credentials + discretion + "a limited number
  of events each year"** scarcity; slot the logo wall in the moment a client permits.

### 5.9 How we work (process) — solid cream
- `@/free/Components/Stepper/Stepper` or `@/free/Components/ScrollStack/ScrollStack`, five beats:
  Discovery → Design → Brigade assembly → Execution → After-care. Reassurance for a CHF 100k+ buyer.

### 5.10 Contact / lead capture — solid cream
- `@/free/Components/GlassSurface/GlassSurface` card; ≤5 fields (name · email · event type [select] ·
  approx. date · approx. guest count); gold `StarBorder` submit.
- Also offer direct **WhatsApp / phone / email** (UHNW buyers expect concierge access).
- Confirmation state: same-day human-reply promise. Backend in §6.

### 5.11 Nav + footer
- **Nav:** sticky, minimal `@/free/Components/PillNav/PillNav` — Services · Portfolio · About ·
  Contact + a persistent *Consultation* button.
- **Footer:** contact, languages, discretion note, socials.
- **Global (optional):** `@/pro/react-bits/frame-border` thin mat framing the page like a gallery
  print.

---

## 6. Backend / lead capture

Lean and reliable — the point is a fast white-glove reply, not a CRM.

- **Endpoint:** Vercel serverless function. (1) validate the ≤5 fields server-side; (2) store the lead
  (start with Google Sheet or Vercel KV, upgrade to CRM later); (3) **notify instantly** (email +
  Slack webhook) for a same-day SLA; (4) **branded autoresponder** to the lead, warm, sets the
  expectation of a personal follow-up.
- **Spam:** honeypot field + basic rate limit. No CAPTCHA unless abuse appears (it hurts the feel).
- **Privacy:** GDPR / Swiss FADP — explicit consent checkbox, privacy-policy link, minimal data, no
  personal data in URLs/query strings. Matches the discretion positioning.
- **Analytics:** privacy-friendly (Plausible / Fathom) over GA.

---

## 7. Performance & quality bar

Half the competitive edge — incumbents lose on dated, slow sites.

- **Hero paints fast:** static graded image is the LCP element; Silk WebGL lazy-inits, caps DPR,
  pauses offscreen, fades in after. Target hero interactive < 3s.
- **Exactly one** heavy background on the page (hero). Everything else CSS/SVG/light motion.
- **Mobile responsive**, with equal craft on **desktop** (B2B luxury buyers browse on desktop).
- Lighthouse 90+ on Performance / Best-practices / SEO. Compress + `srcset` all imagery; preload
  fonts; code-split the gallery, Comparison Slider, and any 3D/WebGL.
- Accessibility: real focus states, alt text, `prefers-reduced-motion`, keyboard-navigable form.

---

## 8. Tech stack

- React + Vite + TypeScript + Tailwind (matches the vault). Consume the vault via the `@/` alias so
  updates stay clean (preferred over copying components in).
- New app lives at `normie-apps/ensemble-events/` (final folder name TBD with founder).
- Deploy: Vercel. i18n: lightweight string catalog (DE/EN, FR-ready).

---

## 9. Open inputs (defaults chosen; founder overrides anytime)

| Input | Default for v1 |
|---|---|
| Brand name | **Ensemble** (swappable token) |
| Photography | High-quality stock placeholders; swap real shots later |
| Client logos | Launch on credentials + scarcity + discretion; add logo wall when permitted |
| Languages | DE + EN at launch; FR-ready |
| Contact details (WhatsApp / phone / inbox) | Placeholders until founder provides |
| Lead notification target (email + Slack webhook) | Placeholder env vars |
| Domain | TBD |
| Preloader + Frame Border | Built but feature-flagged; founder confirms keep/cut on review |

---

## 10. Build sequence (feeds the implementation plan)

1. Scaffold app (Vite + React + TS + Tailwind) at `normie-apps/ensemble-events/`; wire `@/` alias to
   `react-bits-vault`.
2. Lock design tokens (palette §3.1, type §3.2, spacing) in Tailwind config first.
3. Build static section skeleton top-to-bottom (§5) with placeholder copy/imagery, solid backgrounds.
4. Add the hero `Silk` background (lazy, static-image LCP) — the only WebGL on the page.
5. Drop in the per-section components from §5 (MagicBento, CircularGallery, Comparison Slider, etc.).
6. Wire contact form + serverless endpoint + notifications + autoresponder (§6).
7. Performance pass (§7) — lazy WebGL, image optimization, Lighthouse.
8. i18n (DE/EN, then FR). Feature-flag Preloader + Frame Border.
9. Ship to Vercel; privacy-friendly analytics + form-conversion tracking.
