# Lithos Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship the Lithos marketing landing page — a single-page, Salar-Aurora-branded site targeting lithium counterparties with a "Request access" lead form.

**Architecture:** Standalone Vite + React 19 + TypeScript app under `normie-apps/lithium-broker/landing/`, Tailwind v4 (via `@tailwindcss/vite`), Framer Motion + Lenis for motion, React Three Fiber for the globe, Formspree for lead capture. Each landing section is its own component in `src/sections/`, composed in `App.tsx`. Static build → Vercel.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, framer-motion (`motion`), lenis, @react-three/fiber, @react-three/drei, three, lucide-react, @fontsource-variable/inter.

**Reference:** Mirror the structure of `normie-apps/ensemble-events` (same workspace stack). Verification per task = `npm run build` succeeds (no test suite for a static marketing page — YAGNI).

---

## File Structure

```
normie-apps/lithium-broker/landing/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  vercel.json
  README.md
  .env.example
  src/
    main.tsx            # React root
    App.tsx             # composes all sections
    index.css           # tailwind import + @theme (Salar tokens) + base
    brand.ts            # Salar token constants + copy data
    components/
      Section.tsx       # vertical-rhythm wrapper + reveal-on-scroll
      Button.tsx        # mint primary / ghost secondary
      GlassCard.tsx     # glass surface card
      Eyebrow.tsx       # section kicker label
      useLenis.ts       # smooth-scroll hook
    sections/
      Nav.tsx
      Hero.tsx
      Globe.tsx         # R3F globe, lazy + WebGL fallback
      Problem.tsx
      HowItWorks.tsx
      Roles.tsx
      Trust.tsx
      AppShowcase.tsx
      RequestAccess.tsx # Formspree form
      Footer.tsx
```

---

## Task 1: Scaffold the Vite app

**Files:**
- Create: `landing/package.json`, `landing/vite.config.ts`, `landing/tsconfig.json`, `landing/index.html`, `landing/src/main.tsx`, `landing/src/App.tsx`, `landing/src/index.css`

- [ ] **Step 1: Create `landing/package.json`**

```json
{
  "name": "lithos-landing",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@fontsource-variable/inter": "^5.1.1",
    "@react-three/drei": "^10.7.4",
    "@react-three/fiber": "^9.3.0",
    "lenis": "^1.3.13",
    "lucide-react": "^0.542.0",
    "motion": "^12.23.12",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "three": "^0.167.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.3",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.167.0",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.3",
    "typescript": "^5.7.2",
    "vite": "^6.0.3"
  }
}
```

- [ ] **Step 2: Create `landing/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolve(__dirname, './src') } },
});
```

- [ ] **Step 3: Create `landing/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `landing/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lithos — Verifiable lithium brokerage</title>
    <meta name="description" content="Lithos is a non-custodial brokerage desk for cross-border physical lithium. We replace blind trust with proof." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `landing/src/index.css`**

```css
@import "tailwindcss";
@import "@fontsource-variable/inter";

@theme {
  --color-mineral: #080b0d;
  --color-mineral-2: #0c1618;
  --color-mineral-3: #050708;
  --color-mint: #2dd4bf;
  --color-mint-2: #5eead4;
  --color-platinum: #d4dee3;
  --color-platinum-2: #8fa3ad;
  --color-amber: #f5b544;
  --color-flame: #fb7185;
  --font-sans: "Inter Variable", system-ui, sans-serif;
}

html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: #050708;
  color: #d4dee3;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
.tnum { font-variant-numeric: tabular-nums; }
```

- [ ] **Step 6: Create `landing/src/App.tsx` (skeleton)**

```tsx
export function App() {
  return (
    <main className="min-h-screen bg-mineral-3 text-platinum">
      <h1 className="p-10 text-2xl">Lithos landing — scaffold OK</h1>
    </main>
  );
}
```

- [ ] **Step 7: Create `landing/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 8: Install + build smoke**

Run: `cd normie-apps/lithium-broker/landing && npm install && npm run build`
Expected: install succeeds; `vite build` outputs `dist/` with no TS errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add landing
git commit -m "feat(landing): scaffold Vite+React+Tailwind v4 (Salar tokens)"
```

---

## Task 2: Brand data + shared components

**Files:**
- Create: `landing/src/brand.ts`, `landing/src/components/{Section,Button,GlassCard,Eyebrow,useLenis}.tsx`

- [ ] **Step 1: Create `landing/src/brand.ts`**

```typescript
// Salar Aurora palette (mirrors front-end/src/design-system/tokens.ts)
export const COLORS = {
  mineral: '#080b0d',
  mint: '#2dd4bf',
  mint2: '#5eead4',
  platinum: '#d4dee3',
  platinumDim: '#8fa3ad',
  amber: '#f5b544',
  flame: '#fb7185',
} as const;

export const NAV_LINKS = [
  { label: 'Problem', href: '#problem' },
  { label: 'How it works', href: '#how' },
  { label: 'Roles', href: '#roles' },
  { label: 'The App', href: '#app' },
] as const;

export const PIPELINE = [
  'Origination', 'Qualification', 'Indicative offer', 'Firm offer', 'Contract',
  'Compliance', 'Inspection', 'Finance', 'Logistics', 'Settlement',
] as const;
```

- [ ] **Step 2: Create `landing/src/components/Section.tsx`**

```tsx
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

export function Section({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`mx-auto w-full max-w-6xl px-6 py-24 md:py-32 ${className}`}
    >
      {children}
    </motion.section>
  );
}
```

- [ ] **Step 3: Create `landing/src/components/Button.tsx`**

```tsx
import type { ReactNode } from 'react';

export function Button({ href, children, variant = 'primary' }: { href: string; children: ReactNode; variant?: 'primary' | 'ghost' }) {
  const base = 'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.03]';
  const styles = variant === 'primary'
    ? 'bg-mint text-[#06201c] shadow-[0_0_40px_-8px_#2dd4bf]'
    : 'border border-platinum/20 text-platinum hover:border-mint/50';
  return <a href={href} className={`${base} ${styles}`}>{children}</a>;
}
```

- [ ] **Step 4: Create `landing/src/components/GlassCard.tsx`**

```tsx
import type { ReactNode } from 'react';

export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-mint/12 bg-white/[0.04] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Create `landing/src/components/Eyebrow.tsx`**

```tsx
export function Eyebrow({ children }: { children: string }) {
  return (
    <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-mint">
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Create `landing/src/components/useLenis.ts`**

```typescript
import { useEffect } from 'react';
import Lenis from 'lenis';

export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);
}
```

- [ ] **Step 7: Build smoke**

Run: `cd normie-apps/lithium-broker/landing && npm run build`
Expected: builds clean (components not yet imported is fine; if `noUnusedLocals` complains they're unused, they're only flagged when imported — standalone module files are OK).

- [ ] **Step 8: Commit**

```bash
git add landing/src/brand.ts landing/src/components
git commit -m "feat(landing): brand tokens + shared components (Section/Button/GlassCard/Eyebrow/useLenis)"
```

---

## Task 3: Nav

**Files:**
- Create: `landing/src/sections/Nav.tsx`

- [ ] **Step 1: Implement `Nav.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { NAV_LINKS } from '@/brand';
import { Button } from '@/components/Button';

export function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors ${solid ? 'bg-mineral-3/80 backdrop-blur-md border-b border-white/5' : ''}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2 font-semibold tracking-tight text-platinum">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-mint text-[#06201c]">L</span>
          Lithos
        </a>
        <div className="hidden gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-platinum/70 transition-colors hover:text-mint">{l.label}</a>
          ))}
        </div>
        <Button href="#request">Request access</Button>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Build smoke + commit**

Run: `cd normie-apps/lithium-broker/landing && npm run build`
Expected: clean.

```bash
git add landing/src/sections/Nav.tsx
git commit -m "feat(landing): sticky nav with scroll-solidify"
```

---

## Task 4: Hero

**Files:**
- Create: `landing/src/sections/Hero.tsx`

- [ ] **Step 1: Implement `Hero.tsx`**

```tsx
import { motion } from 'motion/react';
import { Button } from '@/components/Button';
import { GlassCard } from '@/components/GlassCard';
import { PIPELINE } from '@/brand';

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-36 pb-24 md:pt-44">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-mint/20 blur-[140px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="text-4xl font-bold leading-[1.05] tracking-tight text-platinum md:text-6xl"
          >
            The lithium trade still runs on <span className="text-platinum/50">blind trust.</span>{' '}
            <span className="bg-gradient-to-r from-mint to-mint2 bg-clip-text text-transparent">Lithos replaces it with proof.</span>
          </motion.h1>
          <p className="mt-6 max-w-md text-lg text-platinum/70">
            A non-custodial brokerage desk for cross-border physical lithium. We orchestrate the deal, verify every document, and protect commission — without ever touching your funds.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="#request">Request access</Button>
            <Button href="#how" variant="ghost">See how it works</Button>
          </div>
        </div>
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between text-xs text-platinum/50">
            <span>LIVE DEAL · LX-2026-001</span><span className="text-mint">SETTLEMENT</span>
          </div>
          <div className="space-y-2">
            {PIPELINE.map((stage, i) => (
              <div key={stage} className="flex items-center gap-3 text-sm">
                <span className={`h-2 w-2 rounded-full ${i <= 9 ? 'bg-mint' : 'bg-platinum/20'}`} />
                <span className={i <= 9 ? 'text-platinum' : 'text-platinum/40'}>{stage}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-white/5 pt-3 text-sm tnum">
            <span className="text-platinum/50">Commission</span>
            <span className="text-amber">recorded · paid</span>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build smoke + commit**

Run: `cd normie-apps/lithium-broker/landing && npm run build`
Expected: clean.

```bash
git add landing/src/sections/Hero.tsx
git commit -m "feat(landing): hero — blind-trust→proof thesis + live-pipeline card"
```

---

## Task 5: Globe (R3F, lazy + WebGL fallback)

**Files:**
- Create: `landing/src/sections/Globe.tsx`

- [ ] **Step 1: Implement `Globe.tsx`**

A points-sphere globe with animated arcs from the Lithium Triangle to refiner hubs; lazy `<Canvas>` and a CSS fallback if WebGL is unavailable or `prefers-reduced-motion`.

```tsx
import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Eyebrow } from '@/components/Eyebrow';

function Sphere() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(1.6, 48, 48);
    return new THREE.BufferGeometry().setAttribute('position', g.getAttribute('position'));
  }, []);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.12; });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.018} color="#2dd4bf" transparent opacity={0.7} />
    </points>
  );
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch { return false; }
}

export function Globe() {
  const webgl = typeof window !== 'undefined' && hasWebGL();
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl text-center">
        <Eyebrow>Lithium Triangle → the world</Eyebrow>
        <h2 className="mx-auto max-w-2xl text-3xl font-bold text-platinum md:text-4xl">
          From the salar to the refinery — every step verified.
        </h2>
        <div className="relative mx-auto mt-10 h-[420px] w-full max-w-3xl">
          <div className="pointer-events-none absolute inset-0 rounded-full bg-mint/10 blur-[120px]" />
          {webgl && !reduced ? (
            <Canvas camera={{ position: [0, 0, 4.2], fov: 50 }} dpr={[1, 2]}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.6} />
                <Sphere />
              </Suspense>
            </Canvas>
          ) : (
            <div className="grid h-full place-items-center">
              <div className="h-64 w-64 rounded-full border border-mint/30 bg-mineral-2 shadow-[0_0_80px_-20px_#2dd4bf]" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build smoke + commit**

Run: `cd normie-apps/lithium-broker/landing && npm run build`
Expected: clean (three/@react-three resolve).

```bash
git add landing/src/sections/Globe.tsx
git commit -m "feat(landing): R3F globe section with WebGL + reduced-motion fallback"
```

---

## Task 6: Problem

**Files:**
- Create: `landing/src/sections/Problem.tsx`

- [ ] **Step 1: Implement `Problem.tsx`**

```tsx
import { ShieldAlert, FileWarning, Copy, Scissors, EyeOff } from 'lucide-react';
import { Section } from '@/components/Section';
import { Eyebrow } from '@/components/Eyebrow';
import { GlassCard } from '@/components/GlassCard';

const PAINS = [
  { icon: ShieldAlert, title: 'Blind trust & counterparty fraud', body: 'Deals close on faxed promises and forwarded PDFs. One bad actor and the cargo — or the payment — is gone.' },
  { icon: FileWarning, title: 'Fake & unverifiable CoAs', body: 'Certificates of Analysis are trivially forged. Buyers pay refinery-grade prices for off-spec material.' },
  { icon: Copy, title: 'Double-sold cargo', body: 'The same lot gets pledged to multiple buyers. Nobody has a shared source of truth.' },
  { icon: Scissors, title: 'Commission circumvention', body: 'Brokers get cut out the moment buyer and seller shake hands. IMFPAs are ignored.' },
  { icon: EyeOff, title: 'Opaque settlement', body: 'LCs, banks and intermediaries operate in the dark. No one sees the deal state in real time.' },
];

export function Problem() {
  return (
    <Section id="problem">
      <Eyebrow>The problem</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold text-platinum md:text-4xl">A multi-billion-dollar market still clears on trust it can't verify.</h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PAINS.map((p) => (
          <GlassCard key={p.title} className="p-6">
            <p.icon className="mb-4 h-6 w-6 text-flame" />
            <h3 className="mb-2 font-semibold text-platinum">{p.title}</h3>
            <p className="text-sm text-platinum/60">{p.body}</p>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Build smoke + commit**

```bash
cd normie-apps/lithium-broker/landing && npm run build
git add landing/src/sections/Problem.tsx
git commit -m "feat(landing): problem section (5 pain cards)"
```

---

## Task 7: HowItWorks

**Files:**
- Create: `landing/src/sections/HowItWorks.tsx`

- [ ] **Step 1: Implement `HowItWorks.tsx`**

```tsx
import { Section } from '@/components/Section';
import { Eyebrow } from '@/components/Eyebrow';
import { PIPELINE } from '@/brand';

const PILLARS = [
  { k: 'Non-custodial', v: 'Lithos never holds or moves funds. Money settles bank-to-bank via the buyer’s LC.' },
  { k: 'Commission protected', v: 'Every intermediary’s cut is locked in an IMFPA before the deal can advance.' },
  { k: 'Hash-anchored proof', v: 'Every CoA, contract and bill of lading is fingerprinted — tamper-evident and auditable.' },
];

export function HowItWorks() {
  return (
    <Section id="how">
      <Eyebrow>How it works</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold text-platinum md:text-4xl">One verifiable pipeline, from origination to settlement.</h2>
      <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PIPELINE.map((stage, i) => (
          <li key={stage} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <span className="text-xs tnum text-mint">{String(i + 1).padStart(2, '0')}</span>
            <p className="mt-1 text-sm font-medium text-platinum">{stage}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PILLARS.map((p) => (
          <div key={p.k} className="border-l-2 border-mint/40 pl-4">
            <h3 className="font-semibold text-platinum">{p.k}</h3>
            <p className="mt-1 text-sm text-platinum/60">{p.v}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Build smoke + commit**

```bash
cd normie-apps/lithium-broker/landing && npm run build
git add landing/src/sections/HowItWorks.tsx
git commit -m "feat(landing): how-it-works pipeline + non-custodial pillars"
```

---

## Task 8: Roles

**Files:**
- Create: `landing/src/sections/Roles.tsx`

- [ ] **Step 1: Implement `Roles.tsx`**

```tsx
import { Section } from '@/components/Section';
import { Eyebrow } from '@/components/Eyebrow';
import { GlassCard } from '@/components/GlassCard';

const ROLES = [
  { role: 'Supplier', accent: '#2dd4bf', body: 'Miners & producers. List verified cargo, prove specs once, reach vetted buyers.' },
  { role: 'Buyer', accent: '#60a5fa', body: 'Refiners & traders. Buy against verified CoAs with double-sell protection.' },
  { role: 'Inspector', accent: '#f5b544', body: 'Assay & quality. Record results that anchor the deal’s truth on-chain.' },
  { role: 'Logistics', accent: '#8fa3ad', body: 'Freight & customs. Slot into the deal with a live, shared status.' },
];

export function Roles() {
  return (
    <Section id="roles">
      <Eyebrow>Built for every side of the deal</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold text-platinum md:text-4xl">A portal for each counterparty — one shared source of truth.</h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <GlassCard key={r.role} className="p-6">
            <span className="h-1.5 w-10 rounded-full" style={{ background: r.accent, display: 'block' }} />
            <h3 className="mt-4 font-semibold text-platinum">{r.role}</h3>
            <p className="mt-2 text-sm text-platinum/60">{r.body}</p>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Build smoke + commit**

```bash
cd normie-apps/lithium-broker/landing && npm run build
git add landing/src/sections/Roles.tsx
git commit -m "feat(landing): roles section (Supplier/Buyer/Inspector/Logistics)"
```

---

## Task 9: Trust

**Files:**
- Create: `landing/src/sections/Trust.tsx`

- [ ] **Step 1: Implement `Trust.tsx`**

```tsx
import { Lock, Fingerprint, ScrollText, Copy, ShieldCheck } from 'lucide-react';
import { Section } from '@/components/Section';
import { Eyebrow } from '@/components/Eyebrow';

const PILLARS = [
  { icon: Lock, t: 'Non-custodial', d: 'We never touch your money. Funds move bank-to-bank via LC.' },
  { icon: Fingerprint, t: 'Hash-anchored docs', d: 'Every document is fingerprinted — tamper-evident proof.' },
  { icon: ScrollText, t: 'Immutable audit trail', d: 'Every phase change and verification is logged forever.' },
  { icon: Copy, t: 'Double-sell protection', d: 'A CoA can back only one active deal at a time.' },
  { icon: ShieldCheck, t: 'KYC & sanctions screening', d: 'Counterparties are screened before they can transact.' },
];

export function Trust() {
  return (
    <Section>
      <Eyebrow>Trust, by construction</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold text-platinum md:text-4xl">We never touch your funds. We just make the truth verifiable.</h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PILLARS.map((p) => (
          <div key={p.t} className="flex gap-4">
            <p.icon className="h-6 w-6 shrink-0 text-mint" />
            <div>
              <h3 className="font-semibold text-platinum">{p.t}</h3>
              <p className="mt-1 text-sm text-platinum/60">{p.d}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Build smoke + commit**

```bash
cd normie-apps/lithium-broker/landing && npm run build
git add landing/src/sections/Trust.tsx
git commit -m "feat(landing): non-custodial trust pillars"
```

---

## Task 10: AppShowcase

**Files:**
- Create: `landing/src/sections/AppShowcase.tsx`

- [ ] **Step 1: Implement `AppShowcase.tsx`** (no external image dependency — a CSS phone mock so the build never breaks on a missing asset)

```tsx
import { Section } from '@/components/Section';
import { Eyebrow } from '@/components/Eyebrow';
import { Button } from '@/components/Button';
import { PIPELINE } from '@/brand';

export function AppShowcase() {
  return (
    <Section id="app">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <Eyebrow>On iOS now</Eyebrow>
          <h2 className="text-3xl font-bold text-platinum md:text-4xl">Run your desk from your phone.</h2>
          <p className="mt-4 max-w-md text-platinum/70">
            The Lithos app puts the full deal pipeline, document vault and counterparty portals in your pocket — with live updates as every deal advances.
          </p>
          <div className="mt-8"><Button href="#request">Request access</Button></div>
        </div>
        <div className="flex justify-center">
          <div className="relative h-[520px] w-[260px] rounded-[2.5rem] border border-white/10 bg-mineral-2 p-4 shadow-[0_0_80px_-20px_#2dd4bf]">
            <div className="mb-4 mt-2 text-center text-sm font-semibold text-mint">Lithos</div>
            <div className="space-y-2">
              {PIPELINE.slice(0, 7).map((s, i) => (
                <div key={s} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-xs">
                  <span className={`h-1.5 w-1.5 rounded-full ${i < 5 ? 'bg-mint' : 'bg-platinum/20'}`} />
                  <span className="text-platinum/80">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Build smoke + commit**

```bash
cd normie-apps/lithium-broker/landing && npm run build
git add landing/src/sections/AppShowcase.tsx
git commit -m "feat(landing): app showcase (CSS phone mock)"
```

---

## Task 11: RequestAccess (Formspree form)

**Files:**
- Create: `landing/src/sections/RequestAccess.tsx`, `landing/.env.example`

- [ ] **Step 1: Create `landing/.env.example`**

```
# Formspree form id, e.g. "xmyzabcd" from https://formspree.io/f/<id>
VITE_FORMSPREE_ID=replace-me
```

- [ ] **Step 2: Implement `RequestAccess.tsx`**

```tsx
import { useState } from 'react';
import { Section } from '@/components/Section';
import { Eyebrow } from '@/components/Eyebrow';

const ROLES = ['Supplier', 'Buyer', 'Inspector', 'Logistics', 'Other'];

export function RequestAccess() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const formId = import.meta.env.VITE_FORMSPREE_ID as string | undefined;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST', body: data, headers: { Accept: 'application/json' },
      });
      setStatus(res.ok ? 'ok' : 'error');
      if (res.ok) e.currentTarget.reset();
    } catch { setStatus('error'); }
  };

  const field = 'w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-platinum placeholder:text-platinum/30 focus:border-mint/50 focus:outline-none';

  return (
    <Section id="request">
      <div className="mx-auto max-w-xl text-center">
        <Eyebrow>Request access</Eyebrow>
        <h2 className="text-3xl font-bold text-platinum md:text-4xl">Bring your next lithium deal onto Lithos.</h2>
        <p className="mt-3 text-platinum/60">Tell us who you are — we onboard counterparties by invitation.</p>
      </div>
      {status === 'ok' ? (
        <p className="mx-auto mt-10 max-w-xl rounded-xl border border-mint/30 bg-mint/10 p-6 text-center text-mint">
          Thanks — we’ve got your request and will be in touch.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mx-auto mt-10 grid max-w-xl gap-4">
          <input name="name" required placeholder="Full name" className={field} />
          <input name="company" placeholder="Company" className={field} />
          <select name="role" required defaultValue="" className={field}>
            <option value="" disabled>Your role</option>
            {ROLES.map((r) => <option key={r} value={r} className="bg-mineral-2">{r}</option>)}
          </select>
          <input name="email" type="email" required placeholder="Work email" className={field} />
          <textarea name="message" rows={3} placeholder="What are you trading? (optional)" className={field} />
          <button type="submit" disabled={status === 'sending' || !formId}
            className="rounded-full bg-mint px-6 py-3 font-semibold text-[#06201c] transition-transform hover:scale-[1.02] disabled:opacity-50">
            {status === 'sending' ? 'Sending…' : 'Request access'}
          </button>
          {status === 'error' && <p className="text-center text-sm text-flame">Something went wrong — please try again.</p>}
          {!formId && <p className="text-center text-xs text-platinum/40">Set VITE_FORMSPREE_ID to enable submissions.</p>}
        </form>
      )}
    </Section>
  );
}
```

- [ ] **Step 3: Build smoke + commit**

```bash
cd normie-apps/lithium-broker/landing && npm run build
git add landing/src/sections/RequestAccess.tsx landing/.env.example
git commit -m "feat(landing): Request-access lead form (Formspree)"
```

---

## Task 12: Footer

**Files:**
- Create: `landing/src/sections/Footer.tsx`

- [ ] **Step 1: Implement `Footer.tsx`**

```tsx
import { NAV_LINKS } from '@/brand';

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2 font-semibold text-platinum">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-mint text-[#06201c]">L</span>
          Lithos
        </div>
        <div className="flex gap-6">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-platinum/50 hover:text-mint">{l.label}</a>
          ))}
        </div>
        <p className="text-xs text-platinum/40">Non-custodial brokerage technology. Lithos never holds client funds.</p>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs text-platinum/30">© 2026 Lithos. All rights reserved.</p>
    </footer>
  );
}
```

- [ ] **Step 2: Build smoke + commit**

```bash
cd normie-apps/lithium-broker/landing && npm run build
git add landing/src/sections/Footer.tsx
git commit -m "feat(landing): footer with non-custodial disclaimer"
```

---

## Task 13: Assemble, polish, deploy config

**Files:**
- Modify: `landing/src/App.tsx`
- Create: `landing/vercel.json`, `landing/README.md`

- [ ] **Step 1: Compose `App.tsx`**

```tsx
import { useLenis } from '@/components/useLenis';
import { Nav } from '@/sections/Nav';
import { Hero } from '@/sections/Hero';
import { Globe } from '@/sections/Globe';
import { Problem } from '@/sections/Problem';
import { HowItWorks } from '@/sections/HowItWorks';
import { Roles } from '@/sections/Roles';
import { Trust } from '@/sections/Trust';
import { AppShowcase } from '@/sections/AppShowcase';
import { RequestAccess } from '@/sections/RequestAccess';
import { Footer } from '@/sections/Footer';

export function App() {
  useLenis();
  return (
    <main className="bg-mineral-3">
      <Nav />
      <Hero />
      <Globe />
      <Problem />
      <HowItWorks />
      <Roles />
      <Trust />
      <AppShowcase />
      <RequestAccess />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Create `landing/vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

- [ ] **Step 3: Create `landing/README.md`**

```markdown
# Lithos Landing

Vite + React + Tailwind v4 marketing site for Lithos.

## Dev
npm install && npm run dev

## Build
npm run build   # -> dist/

## Env
VITE_FORMSPREE_ID — Formspree form id powering the Request-access form.

## Deploy
Vercel (framework: Vite). Set VITE_FORMSPREE_ID in project env.
```

- [ ] **Step 4: Full build + preview check**

Run: `cd normie-apps/lithium-broker/landing && npm run build && npm run preview`
Expected: build clean; preview serves the full page (nav → hero → globe → problem → how → roles → trust → app → request → footer). Manually verify at 375 / 768 / 1440 widths and that the form shows the "set VITE_FORMSPREE_ID" hint when unset.

- [ ] **Step 5: Commit**

```bash
git add landing/src/App.tsx landing/vercel.json landing/README.md
git commit -m "feat(landing): assemble all sections + Vercel config + README"
```

---

## Notes for the implementer

- **No backend coupling.** The only network call is the Formspree POST. Leave the backend `/leads` endpoint for a future iteration (out of scope).
- **Salar palette is the law:** mint `#2dd4bf` is the light source / CTA; amber only for money/commission; flame only for problems/alerts. Don't introduce new hues.
- **Globe must never crash the page:** keep the WebGL + reduced-motion fallback. If R3F version mismatches cause build errors, pin `@react-three/fiber`/`three`/`@types/three` to compatible versions (fiber 9 ↔ three 0.167).
- **Self-contained app:** all deps in `landing/package.json`; do not rely on monorepo hoisting (this repo has hit hoisting issues before).
- **Copy is final, not placeholder** — every section above ships real Lithos copy. Tighten wording if desired, but there are no TODOs to fill.
- **Assets:** the mockups in `assets/marketing` are AgroTrade reference; the plan deliberately uses CSS/R3F mocks so the build has zero image dependencies. Real screenshots/photography can be dropped in later.
```
