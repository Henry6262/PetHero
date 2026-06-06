# Züri Street Ball

Zürich youth streetball academy — landing page (Phase 1).

Free age-bracket street **jams** (U10–U18) are the magnet; professional **coaching**
(weekly classes + holiday camps) is the business. Players self-register; jam signups and
coaching interest are captured as **leads** (pay offline for now). Bilingual EN + Swiss
German (de-CH).

## Stack

Vite 6 · React 19 · TypeScript · Tailwind CSS v4 (`@theme`) · Lenis · GSAP · motion ·
lucide-react. React Bits components vendored under `src/free`. Deploys to Vercel.

## Develop

```bash
npm install      # uses local .npmrc (legacy-peer-deps)
npm run dev      # http://localhost:5173
npm run typecheck
npm run test     # i18n parity + registration validator
npm run build
```

## Design

"Street Court" direction — concrete dark-gray (`#14161a`) base, shock-lime (`#c6ff2e`)
accent, Anton condensed display + Inter body, glitch headline, court-line + halftone + grain
motifs. No emoji (lucide icons). All motion respects `prefers-reduced-motion`.

## Registration

The form POSTs to `/api/register` (Vercel serverless). The server re-derives the age bracket
from birth year (never trusts the client), enforces guardian consent for minors, and fans out
to env-gated side-effects (Slack / webhook / Resend). With zero env config it logs to console
and still returns 200.

## Phase 2 (not built)

Real DB + accounts, live bracket trees, class capacity/scheduling, Stripe checkout. All hang
off the `storeLead()` seam in `api/register.ts` and the server-trusted bracket — additive only.
