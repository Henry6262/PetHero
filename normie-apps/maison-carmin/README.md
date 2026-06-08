# Maison Carmin

Dark-premium landing for a **Zürich ruby fine-jewelry house**. A boutique
showcase + enquiry funnel: a small collection of pieces shown in **interactive
3D**, each with a "price on request" enquiry. No cart, no checkout — enquiries are
captured as leads and followed up offline (Phase 1).

> _Fire, set in Zürich._

## Stack

Vite 6 · React 19 · TypeScript · Tailwind v4 · Lenis · GSAP · motion ·
`@react-three/fiber` + `drei`. React Bits components are **vendored** under
`src/free` (no cross-repo dependency). Display face: **Bodoni Moda**; body: Inter.

## Develop

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # production build
bun run typecheck
```

## Architecture

```
src/
  sections/        Nav · Hero · Marquee · Collection · Craft · Bespoke · Enquiry · Footer
  components/      3D (JewelryModel / JewelryStage / JewelryShowcase), Frame, Section,
                   Divider, Reveal, CtaButton, GlobalBackdrop, Grain, SmoothScroll
  data/pieces.ts   the collection (one entry per piece)
  i18n/            EN + de-CH dictionaries
  lib/leads.ts     storeLead() — the Phase-2 backend seam
  free/            vendored React Bits (ShinyText, SpotlightCard, StarBorder, AnimatedContent, CountUp)
```

### The 3D showcase

`JewelryShowcase` is a single-canvas carousel (one WebGL context) that cycles the
collection, auto-advances, pauses on hover, and crossfades the caption + ruby glow.
`JewelryModel` renders a **procedural ruby placeholder** keyed by `kind` + `glow`
when a piece has no `model`, so the site is fully live before any 3D assets exist.

### Adding a real piece (Meshy → GLB)

1. Generate the piece in Meshy and export a GLB.
2. Compress it (rig-safe, ~8× smaller, drei auto-decodes meshopt):
   ```bash
   npx @gltf-transform/cli optimize in.glb public/models/pieces/<id>.glb \
     --compress meshopt --texture-compress webp --texture-size 1024 \
     --simplify false --flatten false --join false
   ```
3. Set `model: "/models/pieces/<id>.glb"` on that entry in `src/data/pieces.ts`.
   Keep raw exports out of the bundle (they live in the gitignored `raw-art/`).

## Leads

`storeLead()` posts to `VITE_LEADS_ENDPOINT` (a Formspree/Basin-style URL) if set;
otherwise it logs the lead and resolves as success so the form is demoable with no
backend. See `.env.example`.
