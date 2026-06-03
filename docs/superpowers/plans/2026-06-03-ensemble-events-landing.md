# Ensemble Events Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable, cinematic quiet-luxury landing page for a Zürich full-service event house ("Ensemble"), with a lean serverless lead-capture backend.

**Architecture:** Standalone Vite + React 19 + TS + Tailwind v4 app at `normie-apps/ensemble-events/`. It consumes the private `react-bits-vault` by aliasing `@` → the vault's `src/`, so `@/free/...` and `@/pro/...` imports resolve natively; the app installs the vault's dependency set so vault components' bare imports (three, gsap, motion, ogl…) resolve. App-owned code uses the `@app` alias. One animated WebGL background (hero Silk) only; all other sections solid backgrounds with cheap motion. Lead capture is a Vercel serverless function with a pure, unit-tested `validateLead` core.

**Tech Stack:** React 19, Vite 6, TypeScript 5, Tailwind v4 (CSS `@theme`), react-bits-vault components, @fontsource (Cormorant + Inter), Vitest (unit tests), Vercel functions.

Design spec of record: `docs/superpowers/specs/2026-06-03-ensemble-events-landing-design.md`.

---

## File Structure

```
normie-apps/ensemble-events/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  vercel.json
  .env.example
  src/
    main.tsx                 # entry, mounts <App/>, smooth scroll, i18n provider
    App.tsx                  # composes sections in order
    index.css                # Tailwind v4 import + @theme tokens + fonts + base
    brand.ts                 # BRAND_NAME + contact placeholders (single source)
    lib/
      cn.ts                  # re-export cn from vault (or local copy)
    i18n/
      index.tsx              # I18nProvider + useT() hook + lang state
      en.ts                  # English strings
      de.ts                  # German strings
      types.ts               # Strings shape (keys)
    components/
      Section.tsx            # layout wrapper (cream | espresso variant, padding, id)
      Reveal.tsx             # thin wrapper over vault FadeContent/AnimatedContent
    sections/
      Nav.tsx                # PillNav sticky + Consultation button
      Hero.tsx               # Silk bg (lazy) + static image LCP + SplitText headline + StarBorder CTA
      Wedge.tsx              # ScrollReveal positioning statement (cream)
      Services.tsx           # MagicBento 4 capabilities (cream)
      Brigade.tsx            # CircularGallery + ProfileCard (ESPRESSO dark)
      BeforeAfter.tsx        # comparison-slider (cream)
      Portfolio.tsx          # Masonry + hover-preview (cream)
      Stats.tsx              # CountUp band (cream)
      Proof.tsx              # LogoLoop + SpotlightCard testimonials + scarcity (cream)
      Process.tsx            # Stepper / ScrollStack 5 steps (cream)
      Contact.tsx            # GlassSurface form (cream) -> POST /api/lead
      Footer.tsx
    assets/
      hero-poster.jpg        # graded hero still (LCP element; placeholder for now)
      ...placeholders
  api/
    lead.ts                  # Vercel serverless handler: validate -> store -> notify -> autoresponder
    _validateLead.ts         # pure function (unit-tested)
    _validateLead.test.ts    # Vitest
  src/i18n/i18n.test.ts       # Vitest for useT lookup/fallback
```

---

## Phase 0 — Scaffold & infrastructure

### Task 0.1: Create app dir + package.json
**Files:** Create `normie-apps/ensemble-events/package.json`

- [ ] Write package.json with scripts (`dev`,`build`,`preview`,`typecheck`,`test`) and the vault's dependency set + react-dom + @fontsource/cormorant, @fontsource-variable/inter; devDeps: vite, @vitejs/plugin-react, @tailwindcss/vite, tailwindcss, typescript, @types/*, vitest.
- [ ] `npm install` in the app dir. Expected: installs without peer-dep errors.

### Task 0.2: vite.config.ts + tsconfig.json with vault alias
**Files:** Create `vite.config.ts`, `tsconfig.json`

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const VAULT = resolve(__dirname, '../../react-bits-vault/src');
export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.glb', '**/*.hdr'],
  resolve: {
    alias: {
      '@': VAULT,                                  // vault components: @/free, @/pro, @/lib
      '@app': resolve(__dirname, './src'),         // our app code
    },
  },
});
```
tsconfig `paths`: `"@/*": ["../../react-bits-vault/src/*"]`, `"@app/*": ["./src/*"]`.
- [ ] Verify `npm run typecheck` resolves a sample `import Silk from '@/free/Backgrounds/Silk/Silk'`.

### Task 0.3: index.css — Tailwind v4 theme tokens + fonts
**Files:** Create `src/index.css`, `index.html`, `src/main.tsx`, `src/App.tsx`

```css
@import "tailwindcss";
@import "@fontsource/cormorant/400.css";
@import "@fontsource/cormorant/500.css";
@import "@fontsource-variable/inter";

@theme {
  --color-cream: #F7F4EF;
  --color-ink: #141414;
  --color-gold: #B89B5E;
  --color-greige: #C9BEA9;
  --color-espresso: #1C1A17;
  --color-cream-dark: #F2ECE0;
  --font-display: "Cormorant", ui-serif, Georgia, serif;
  --font-body: "Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif;
}
html { scroll-behavior: smooth; }
body { background: var(--color-cream); color: var(--color-ink); font-family: var(--font-body); }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```
- [ ] App.tsx renders a single `<h1 className="font-display">` placeholder; `npm run dev` shows cream bg + serif. Commit.

---

## Phase 1 — Shell: brand, i18n, layout primitives

### Task 1.1: brand.ts
```ts
export const BRAND_NAME = "Ensemble";
export const BRAND_CITY = "Zürich";
export const CONTACT = {
  whatsapp: "+41 00 000 00 00",   // PLACEHOLDER
  phone: "+41 00 000 00 00",       // PLACEHOLDER
  email: "hello@ensemble.example", // PLACEHOLDER
};
```

### Task 1.2: i18n (TDD)
**Files:** `src/i18n/types.ts`, `en.ts`, `de.ts`, `index.tsx`, `i18n.test.ts`
- [ ] **Test first** (`i18n.test.ts`): `t('hero.h1')` returns the EN string; switching lang returns DE; unknown key falls back to the key string.
- [ ] Run vitest → FAIL.
- [ ] Implement `I18nProvider` (lang state, default 'en') + `useT()` returning `t(key)` that looks up nested dot keys with fallback to the key.
- [ ] Run vitest → PASS. Commit.

### Task 1.3: Section.tsx + Reveal.tsx
- [ ] `Section`: props `{ id?, tone?: 'cream'|'espresso', className?, children }`; applies bg/text tokens, vertical rhythm (`py-24 md:py-36`), max-width container.
- [ ] `Reveal`: wraps `@/free/Animations/AnimatedContent/AnimatedContent` (or FadeContent) with sane defaults; respects reduced motion. Commit.

---

## Phase 2 — Sections (build top-to-bottom). Each: build → view in dev → commit.

For each section, exact vault imports + intent are below. Copy in the design-spec copy (placeholder, founder-refined). Keep motion to one reveal per section.

### Task 2.1: Nav — `@/free/Components/PillNav/PillNav`
Sticky, minimal: Services · Portfolio · About · Contact + persistent "Consultation" button (scrolls to #contact). Gold hairline on scroll.

### Task 2.2: Hero — `@/free/Backgrounds/Silk/Silk` + `@/free/Animations/Noise/Noise` + `@/free/TextAnimations/SplitText/SplitText` + `@/free/Animations/StarBorder/StarBorder`
- Static `hero-poster.jpg` is the LCP element (object-cover, absolute). Silk lazy-mounts after first paint (dynamic import / `requestIdleCallback`), tuned to gold-on-cream (`color="#B89B5E"` low intensity), faint Noise overlay. Dark scrim for text legibility.
- H1 (SplitText, one reveal): "One team. Every detail. From concept to the last glass cleared." Sub line. StarBorder CTA `color="#B89B5E"` → "Request a private consultation" (scroll to #contact).
- Reduced-motion: skip Silk, show poster only.

### Task 2.3: Wedge — `@/free/TextAnimations/ScrollReveal/ScrollReveal` (cream)
Pure type, max whitespace: "Most houses coordinate vendors. We are the kitchen, the music, and the floor — under one roof, accountable to you alone."

### Task 2.4: Services — `@/free/Components/MagicBento/MagicBento` (cream)
4 capabilities: Catering · Live Artists & DJs · The Service Brigade · End-to-End Production. One outcome line each.

### Task 2.5: Brigade — ESPRESSO tone — `@/free/Components/CircularGallery/CircularGallery` + `@/free/Components/ProfileCard/ProfileCard`
The one dark beat. Action shots + 2–3 named faces. Caption: "The same trusted faces, every time."

### Task 2.6: BeforeAfter — `@/pro/react-bits/comparison-slider` (cream)
Empty venue → finished event. Two placeholder images.

### Task 2.7: Portfolio — `@/free/Components/Masonry/Masonry` + `@/pro/react-bits/hover-preview` (cream)
Editorial grid; Private · Corporate · Wedding tags. Sparse-by-design (works with few assets).

### Task 2.8: Stats — `@/free/TextAnimations/CountUp/CountUp` (cream)
Row: events delivered · guests served · years · team members **on staff**.

### Task 2.9: Proof — `@/free/Animations/LogoLoop/LogoLoop` + `@/free/Components/SpotlightCard/SpotlightCard` (cream)
Logo marquee (placeholder logos, hidden if empty) + 2–3 testimonials + scarcity line "A limited number of events each year." Launch fallback: founder credentials + discretion.

### Task 2.10: Process — `@/free/Components/Stepper/Stepper` (cream)
Discovery → Design → Brigade assembly → Execution → After-care.

### Task 2.11: Contact — `@/free/Components/GlassSurface/GlassSurface` + `@/free/Animations/StarBorder/StarBorder` (cream)
Form: name · email · event type (select) · approx date · approx guest count + consent checkbox + honeypot. WhatsApp/phone/email concierge links. POST to `/api/lead`; success state = same-day reply promise.

### Task 2.12: Footer
Contact, languages (DE/EN), discretion note, socials.

### Task 2.13 (optional, feature-flagged): Preloader `@/pro/react-bits/preloader` + FrameBorder `@/pro/react-bits/frame-border`
Behind `?preloader=1` / env flag; founder confirms keep/cut.

---

## Phase 3 — Backend lead capture (TDD core)

### Task 3.1: `api/_validateLead.ts` + test (TDD)
- [ ] **Test first**: valid payload passes; missing name/email fails; bad email fails; honeypot filled → rejected as spam; guest count non-numeric fails; strips/limits field lengths.
- [ ] vitest → FAIL → implement pure `validateLead(input): {ok:true,data}|{ok:false,errors}` → PASS. Commit.

### Task 3.2: `api/lead.ts` handler
- [ ] Vercel function: method guard (POST), parse JSON, `validateLead`; on spam → 200 silent; on invalid → 422; on valid → store (start: console + optional Google Sheet/webhook via `LEAD_WEBHOOK_URL`), notify (`SLACK_WEBHOOK_URL` + email via `RESEND_API_KEY` if set), send branded autoresponder; return 200 `{ok:true}`. All integrations env-gated so it runs without keys.
- [ ] `.env.example` documents: `SLACK_WEBHOOK_URL`, `LEAD_WEBHOOK_URL`, `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `PLAUSIBLE_DOMAIN`. Commit.

### Task 3.3: `vercel.json`
- [ ] SPA rewrite (all non-`/api` → `/index.html`); function config. Commit.

---

## Phase 4 — Polish & verify

- [ ] Responsive pass (mobile + desktop). Commit.
- [ ] Performance: lazy Silk, `loading`/`srcset` on imagery, code-split comparison-slider + galleries, preload fonts. Commit.
- [ ] `npm run build` clean; `npm run typecheck` clean; vitest green. Commit.
- [ ] (Manual) Lighthouse spot-check; note score in README.
- [ ] README: run/deploy/env + open-inputs checklist for founder. Commit.

---

## Self-Review notes
- **Spec coverage:** every spec §5 section → a Phase 2 task; backend §6 → Phase 3; perf §7 → Phase 4; palette/type/motion §3 → Phase 0; i18n §3.5 → Task 1.2; name token §2 → Task 1.1. Covered.
- **Pro deps:** preloader/frame-border/hover-preview/comparison-slider verified present on disk as `src/pro/react-bits/<slug>.tsx`.
- **Risk:** cross-repo `@`→vault alias must be present at build (sibling dir). Static Vite build bundles everything, so Vercel deploy of the built output is self-contained.
