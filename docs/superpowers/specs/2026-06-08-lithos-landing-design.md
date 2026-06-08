# Lithos Landing Page — Design Spec

_2026-06-08_

## Goal

Ship the Lithos marketing landing page — the primary client-acquisition surface
(currently nonexistent; only the Expo app web-export exists). Target audience:
**lithium counterparties** (producers/miners, refiners/buyers, traders,
inspectors, logistics). Primary conversion: **Request access** (lead capture).

## Positioning

Lithos is a **non-custodial brokerage desk** for cross-border physical lithium
deals. It orchestrates the deal lifecycle, verifies documents, tracks
counterparty KYC, protects broker commission — and never holds funds (money moves
bank-to-bank via LC; commission via IMFPA; documents are hash-anchored for proof).
Narrative thesis (adapted from the AgroTrade template "blind trust → math"):
**"The lithium trade still runs on blind trust. Lithos replaces it with proof."**

## Stack & deployment

- **Vite + React 19 + TypeScript + Tailwind CSS v4** (workspace standard for
  premium landings, ref: `normie-apps/ensemble-events`).
- **Framer Motion** (`motion`) for scroll/entrance animation; **Lenis** for smooth
  scroll; **@react-three/fiber** + **@react-three/drei** for the globe;
  **lucide-react** for icons. Fonts via `@fontsource` (Inter variable + a display
  face). No backend coupling.
- Location: new standalone folder `normie-apps/lithium-broker/landing/` (its own
  `package.json`, self-contained — vendored, no monorepo hoisting; mirrors how
  other landings in this workspace are structured).
- **Deploy:** Vercel static build (`vite build` → `dist/`). Separate Vercel
  project from the app's web export.

## Brand — "Salar Aurora"

Reuse the mobile design tokens (`front-end/src/design-system/tokens.ts`):
- Background: mineral dark gradient `#0C1618` → `#080B0D` → `#050708`.
- Primary / light source / CTAs: lithium-mint `#2DD4BF` → `#5EEAD4`.
- Structure / secondary: platinum-ice `#8FA3AD` → `#D4DEE3`.
- Money / commission accents: molten amber `#B45309` → `#F5B544`.
- Alerts/energy: flame `#E11D48` → `#FB7185`.
- Glass surfaces (subtle/medium/strong) per the GLASS tokens; tabular-mono
  numerals for any figures; generous spacing; premium trading-desk restraint.

## Sections (single-page scroll)

Each section is its own component under `src/sections/`, composed in `App.tsx`.

1. **Nav** (`Nav.tsx`) — sticky, transparent→solid on scroll. Lithos wordmark;
   anchor links: Problem, How it works, Roles, The App; `Request access` button
   (scrolls to the form).
2. **Hero** (`Hero.tsx`) — thesis headline + sub; two CTAs (Request access /
   See how it works); a glass "deal pipeline" UI card floating beside the copy
   (static mock of the app's pipeline). Mint aurora glow as the light source.
3. **Globe** (`Globe.tsx`) — R3F globe; great-circle arcs animate from the
   Lithium Triangle (Chile/Argentina/Bolivia) to refiner hubs (China, Korea, EU).
   Caption: "From the salar to the refinery — every step verified." Must lazy-load
   and degrade gracefully (static fallback image if WebGL unavailable).
4. **Problem** (`Problem.tsx`) — 4–5 pain cards: blind trust & counterparty fraud;
   fake / double-sold Certificates of Analysis; document chaos (NCNDA→LOI→ICPO→
   SPA→CoA→LC→BL); broker commission circumvention; opaque settlement.
5. **HowItWorks** (`HowItWorks.tsx`) — the pipeline as an elegant stepper
   (Origination → Qualification → Offers → Contract → Compliance → Inspection →
   Finance → Logistics → Settlement); callouts: non-custodial, LC bank-to-bank,
   commission via IMFPA, hash-anchored documents.
6. **Roles** (`Roles.tsx`) — cards for Supplier, Buyer, Inspector, Logistics
   (+ Broker), each with the value it gets and a role-themed accent.
7. **Trust** (`Trust.tsx`) — "We never touch your funds." Pillars: non-custodial,
   hash-anchored document proof, immutable audit trail, double-sell protection,
   sanctions/KYC screening.
8. **AppShowcase** (`AppShowcase.tsx`) — the mobile app (now on TestFlight) — phone
   mockup(s) with the Salar deal screens; "Run your desk from your phone."
9. **RequestAccess** (`RequestAccess.tsx`) — lead form: name, company, role
   (select: Supplier/Buyer/Inspector/Logistics/Other), email, optional message.
   Submits to **Formspree** (env `VITE_FORMSPREE_ID`) for v1; success/error inline
   states. (Backend `POST /leads` is a documented future swap, out of scope now.)
10. **Footer** (`Footer.tsx`) — wordmark, anchor links, non-custodial disclaimer,
    copyright. (No real legal/privacy pages required for v1; link placeholders ok
    only if clearly inert — prefer omitting links we can't fulfill.)

## Shared components

- `src/components/` — `Section` (consistent vertical rhythm + reveal-on-scroll
  wrapper), `Button` (mint primary / ghost secondary), `GlassCard`, `Eyebrow`
  (section kicker label), `Marquee`/`StatRow` if needed. `src/lib/brand.ts` holds
  the Salar token values as TS constants + Tailwind theme extension.

## Data flow

- Static content; no API calls except the Formspree form POST.
- Form: client-side validation (required name/email/role) → `fetch` POST to
  `https://formspree.io/f/${VITE_FORMSPREE_ID}` → inline success/error. No PII
  stored client-side beyond the in-flight request.

## Error handling

- Globe: feature-detect WebGL; on failure render a static globe image (from
  `assets/marketing/`), no crash. Respect `prefers-reduced-motion` (freeze arcs).
- Form: network/Formspree error → inline retry message; disable submit while
  pending; never lose the user's typed input.
- Images: explicit width/height to avoid layout shift; lazy-load below the fold.

## Testing

- Manual: `vite build` succeeds; page renders top-to-bottom; globe loads + has a
  no-WebGL fallback; form submit shows success/error; responsive at 375 / 768 /
  1440; Lighthouse pass (perf/a11y reasonable). No unit tests for a static
  marketing page (YAGNI) beyond a build smoke.

## Out of scope (YAGNI)

- Backend `/leads` endpoint (Formspree for v1).
- CMS / blog / multi-page routing (single page only).
- i18n (English only for v1).
- Auth, dashboards, or any app functionality (this is marketing only).
- Privacy/terms legal pages (omit links rather than fake them).

## Risks / notes

- The mockups in `assets/marketing/` + `assets/landing-sections/` are the
  **AgroTrade** reference design — use for structure/inspiration only; all copy,
  palette (Salar mint, not amber-dominant), and the globe's lithium-triangle
  routing are Lithos-specific.
- Keep the bundle lean: lazy-load the R3F globe so the hero is fast.
- `VITE_FORMSPREE_ID` must be set at build/deploy (Vercel env); document in README.
