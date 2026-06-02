# PokeDex Coin Tree Landing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, premium mystical-organic marketing landing for the "PokeDex" meme token, reusing react-bits-vault components, deployable to Vercel.

**Architecture:** Standalone Vite + React 19 + TypeScript SPA in `pokedex-landing/`. Needed react-bits components are copied into `src/vault/` (react-bits' intended copy-in usage) with their npm deps installed locally. All copy/numbers live in one typed config (`src/content/site.ts`) so the CA "launch flip" is a one-line change. Sections are composed top-to-bottom in `App.tsx`. Logic units (content integrity, clipboard copy, reduced-motion) are unit-tested with Vitest; visual sections are verified via build + Playwright screenshots.

**Tech Stack:** Vite 6, React 19, TypeScript 5.6, Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first), GSAP 3 + `@gsap/react`, `motion` (Framer Motion 12), `ogl`/`three`/`@react-three/fiber` (only if a chosen bg needs them), Vitest + @testing-library/react, Vercel static deploy.

**Reference spec:** `pokedex-landing/docs/superpowers/specs/2026-06-02-pokedex-coin-tree-landing-design.md`

**Vault source:** `/Users/henry/Documents/Gazillion-dollars/react-bits-vault/src/` (free: `free/<Category>/<Name>/<Name>.tsx`, pro: `pro/react-bits/<slug>`).

---

## File Structure

**Created in `pokedex-landing/`:**

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `vercel.json` — project scaffold.
- `src/main.tsx` — React root.
- `src/App.tsx` — composes sections + global polish wrappers.
- `src/index.css` — Tailwind v4 import + `@theme` tokens + base styles.
- `src/content/site.ts` — ALL copy/numbers/links (single source of truth).
- `src/content/site.test.ts` — content-integrity tests.
- `src/lib/useReducedMotion.ts` — reduced-motion hook.
- `src/lib/useReducedMotion.test.ts` — hook test.
- `src/lib/copy.ts` — clipboard copy helper (with fallback).
- `src/lib/copy.test.ts` — copy helper test.
- `src/components/Nav.tsx` — sticky anchor nav + mobile drawer.
- `src/components/CaCard.tsx` — CA pill with copy + toast.
- `src/components/CaCard.test.tsx` — CA copy behavior test.
- `src/components/Footer.tsx` — socials + disclaimer.
- `src/components/GlobalPolish.tsx` — cursor / click-spark / grain wrappers (reduced-motion aware).
- `src/sections/Hero.tsx`
- `src/sections/CoinTree.tsx`
- `src/sections/Tokenomics.tsx`
- `src/sections/TrustStrip.tsx`
- `src/sections/HowToBuy.tsx`
- `src/vault/` — copied react-bits components (structure mirrors vault), e.g. `src/vault/free/Backgrounds/Aurora/Aurora.tsx`. Plus `src/vault/LICENSES.md` attribution.

---

## Task 1: Scaffold the Vite + React + TS project

**Files:**
- Create: `pokedex-landing/package.json`
- Create: `pokedex-landing/vite.config.ts`
- Create: `pokedex-landing/tsconfig.json`, `pokedex-landing/tsconfig.node.json`
- Create: `pokedex-landing/index.html`
- Create: `pokedex-landing/.gitignore`
- Create: `pokedex-landing/src/main.tsx`
- Create: `pokedex-landing/src/App.tsx`
- Create: `pokedex-landing/src/index.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "pokedex-landing",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@gsap/react": "^2.1.2",
    "clsx": "^2.1.1",
    "gsap": "^3.13.0",
    "motion": "^12.23.12",
    "ogl": "^1.0.11",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-icons": "^5.5.0",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.3",
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^22.19.19",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4.0.3",
    "typescript": "^5.6.3",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

Note: `three`/`@react-three/*` are intentionally omitted. Add them later only if Task 7 selects a WebGL background that needs them (Aurora needs only `ogl`, already included).

- [ ] **Step 2: Create `vite.config.ts`** (alias `@` → `src`, Vitest config inline)

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
});
```

- [ ] **Step 3: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node", "vite/client", "vitest/globals", "@testing-library/jest-dom"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PokeDex — Fair Launch Meme Token</title>
    <meta name="description" content="PokeDex: a community meme token with a 1B fixed supply, zero tax, locked liquidity, and a fair launch on pump.fun. Grow the Coin Tree." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 7: Create `src/index.css`** (Tailwind v4 + theme tokens placeholder; expanded in Task 3)

```css
@import 'tailwindcss';

:root {
  color-scheme: dark;
}

html { scroll-behavior: smooth; }

body {
  margin: 0;
  background: #050a07;
  color: #eaf5ee;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

- [ ] **Step 8: Create placeholder `src/App.tsx`**

```tsx
export default function App() {
  return <main style={{ padding: 24 }}>PokeDex landing — scaffolding OK</main>;
}
```

- [ ] **Step 9: Create `.gitignore`**

```
node_modules
dist
.vercel
*.local
.DS_Store
```

- [ ] **Step 10: Install deps and verify dev server boots**

Run:
```bash
cd pokedex-landing && npm install && npm run build
```
Expected: install completes; `vite build` produces `dist/` with no TypeScript errors.

- [ ] **Step 11: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars
git add pokedex-landing
git commit -m "chore: scaffold pokedex-landing (Vite + React 19 + TS + Tailwind v4)"
```

---

## Task 2: Content config (single source of truth) + integrity tests

**Files:**
- Create: `pokedex-landing/src/content/site.ts`
- Test: `pokedex-landing/src/content/site.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { siteConfig } from './site';

describe('siteConfig', () => {
  it('allocations sum to 100 percent', () => {
    const sum = siteConfig.allocations.reduce((a, x) => a + x.pct, 0);
    expect(sum).toBe(100);
  });

  it('allocation amounts sum to total supply', () => {
    const sum = siteConfig.allocations.reduce((a, x) => a + x.amount, 0);
    expect(sum).toBe(siteConfig.token.totalSupply);
  });

  it('total supply is one billion', () => {
    expect(siteConfig.token.totalSupply).toBe(1_000_000_000);
  });

  it('CA is unlaunched with a placeholder string', () => {
    expect(siteConfig.ca.launched).toBe(false);
    expect(siteConfig.ca.address).toBeNull();
    expect(siteConfig.ca.placeholder.length).toBeGreaterThan(0);
  });

  it('has exactly four trust pillars and at least three buy steps', () => {
    expect(siteConfig.trust).toHaveLength(4);
    expect(siteConfig.buySteps.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pokedex-landing && npx vitest run src/content/site.test.ts`
Expected: FAIL — cannot resolve `./site`.

- [ ] **Step 3: Create `src/content/site.ts`**

```ts
export interface Allocation {
  label: string;
  amount: number;
  pct: number;
  branch?: 'trainer' | 'starter';
  blurb: string;
}

export interface TrustPillar {
  key: string;
  title: string;
  body: string;
}

export interface BuyStep {
  title: string;
  body: string;
}

export interface RewardCard {
  title: string;
  body: string;
}

export interface CoinTreeBranch {
  name: string;
  tagline: string;
  rewards: RewardCard[];
}

export const siteConfig = {
  token: {
    name: 'PokeDex',
    ticker: 'POKEDEX',
    totalSupply: 1_000_000_000,
    supplyDisplay: '1,000,000,000',
    pitch: 'Catch the launch. Grow the Coin Tree.',
    subPitch:
      'A community meme token with a fixed billion supply, zero tax, and locked liquidity — launching fair on pump.fun.',
  },
  ca: {
    launched: false,
    address: null as string | null,
    placeholder: 'Coming soon at launch',
  },
  links: {
    pumpfun: 'https://pump.fun',
    twitter: 'https://x.com',
  },
  allocations: [
    { label: 'Presale & Liquidity', amount: 600_000_000, pct: 60, blurb: 'Open fair launch on pump.fun' },
    { label: 'Coin Tree Rewards', amount: 150_000_000, pct: 15, blurb: 'Trainer and starter branches' },
    { label: 'Marketing & Listings', amount: 150_000_000, pct: 15, blurb: 'Growth and exchange reach' },
    { label: 'Community Treasury', amount: 100_000_000, pct: 10, blurb: 'Governed by holders' },
  ] satisfies Allocation[],
  trust: [
    { key: 'supply', title: 'Fixed Supply', body: 'One billion PokeDex, locked at genesis. No further minting, ever.' },
    { key: 'tax', title: 'Zero Tax', body: 'No buy or sell tax. What you trade is what you get, every transaction.' },
    { key: 'lp', title: 'Locked Liquidity', body: 'Liquidity is committed to the pool so the tree stays rooted and trustworthy.' },
    { key: 'fair', title: 'Fair Launch', body: 'Launching on pump.fun. No private rounds, no insider allocation games.' },
  ] satisfies TrustPillar[],
  buySteps: [
    { title: 'Get a Solana wallet', body: 'Install Phantom or Solflare and create a wallet. Keep your seed phrase safe.' },
    { title: 'Fund with SOL', body: 'Buy SOL on an exchange and send it to your wallet, or use the in-wallet on-ramp.' },
    { title: 'Open pump.fun at launch', body: 'When the contract address drops here and on X, open the PokeDex page on pump.fun.' },
    { title: 'Swap SOL for PokeDex', body: 'Enter an amount, confirm the swap, and approve it in your wallet.' },
    { title: 'Hold and grow the tree', body: 'Welcome to the Coin Tree. Trainer and starter branches reward the community.' },
  ] satisfies BuyStep[],
  coinTree: {
    branches: [
      {
        name: 'Trainer Branch',
        tagline: 'For the holders who show up',
        rewards: [
          { title: 'Holder rewards', body: 'A slice of Coin Tree Rewards routed to committed holders.' },
          { title: 'Community votes', body: 'Treasury decisions surfaced to the trainer community.' },
        ],
      },
      {
        name: 'Starter Branch',
        tagline: 'For the early believers',
        rewards: [
          { title: 'Early supporter perks', body: 'Recognition and rewards for those who plant first.' },
          { title: 'Growth incentives', body: 'Marketing and listing momentum that lifts the whole tree.' },
        ],
      },
    ] satisfies CoinTreeBranch[],
  },
  disclaimer:
    'PokeDex is a community meme project and is not affiliated with, endorsed by, or connected to The Pokémon Company, Nintendo, Game Freak, or any related entity. Names and characters are used in a parody and fan capacity only. Cryptocurrency carries risk; nothing here is financial advice. Do your own research.',
} as const;

export type SiteConfig = typeof siteConfig;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd pokedex-landing && npx vitest run src/content/site.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add pokedex-landing/src/content
git commit -m "feat: content config with integrity tests"
```

---

## Task 3: Theme tokens + global styles

**Files:**
- Modify: `pokedex-landing/src/index.css`

- [ ] **Step 1: Replace `src/index.css` with the themed version**

```css
@import 'tailwindcss';

@theme {
  --color-bark: #0b1410;
  --color-deep: #050a07;
  --color-moss: #1d3b2a;
  --color-leaf: #36c98a;
  --color-glow: #7ef7c0;
  --color-gold: #e9c46a;
  --color-amber: #f4a261;
  --color-cream: #eaf5ee;
  --color-mist: #9fc7b2;
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

:root { color-scheme: dark; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(54, 201, 138, 0.18), transparent 60%),
    var(--color-deep);
  color: var(--color-cream);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

/* Reusable glow utility for headings */
.text-glow { text-shadow: 0 0 24px rgba(126, 247, 192, 0.45); }

/* Section rhythm */
.section { padding-block: clamp(4rem, 10vw, 8rem); }
.container { width: min(1180px, 92vw); margin-inline: auto; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```

- [ ] **Step 2: Add Space Grotesk font link to `index.html`** (inside `<head>`, before `<title>`)

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Verify build still passes**

Run: `cd pokedex-landing && npm run build`
Expected: PASS, no errors.

- [ ] **Step 4: Commit**

```bash
git add pokedex-landing/src/index.css pokedex-landing/index.html
git commit -m "feat: mystical-organic theme tokens and global styles"
```

---

## Task 4: Reduced-motion hook + clipboard helper (tested logic)

**Files:**
- Create: `pokedex-landing/src/lib/useReducedMotion.ts`
- Test: `pokedex-landing/src/lib/useReducedMotion.test.ts`
- Create: `pokedex-landing/src/lib/copy.ts`
- Test: `pokedex-landing/src/lib/copy.test.ts`

- [ ] **Step 1: Write failing test for `useReducedMotion`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }));
}

describe('useReducedMotion', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('returns true when user prefers reduced motion', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false otherwise', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd pokedex-landing && npx vitest run src/lib/useReducedMotion.test.ts`
Expected: FAIL — cannot resolve `./useReducedMotion`.

- [ ] **Step 3: Implement `src/lib/useReducedMotion.ts`**

```ts
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd pokedex-landing && npx vitest run src/lib/useReducedMotion.test.ts`
Expected: PASS.

- [ ] **Step 5: Write failing test for `copyText`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { copyText } from './copy';

describe('copyText', () => {
  it('uses navigator.clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const ok = await copyText('hello');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
    vi.unstubAllGlobals();
  });

  it('returns false when clipboard is unavailable and no DOM fallback succeeds', async () => {
    vi.stubGlobal('navigator', {});
    // execCommand not present in jsdom by default
    const ok = await copyText('hello');
    expect(ok).toBe(false);
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 6: Run test, verify it fails**

Run: `cd pokedex-landing && npx vitest run src/lib/copy.test.ts`
Expected: FAIL — cannot resolve `./copy`.

- [ ] **Step 7: Implement `src/lib/copy.ts`**

```ts
/** Copy text to clipboard. Returns true on success. Falls back to execCommand. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = typeof document.execCommand === 'function' && document.execCommand('copy');
    document.body.removeChild(el);
    return !!ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 8: Run test, verify it passes**

Run: `cd pokedex-landing && npx vitest run src/lib/copy.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add pokedex-landing/src/lib
git commit -m "feat: reduced-motion hook and clipboard helper with tests"
```

---

## Task 5: Copy needed vault components into the project

**Files:**
- Create: `pokedex-landing/src/vault/...` (mirrors vault structure)
- Create: `pokedex-landing/src/vault/LICENSES.md`

For each component, copy the component file(s) from the vault into the matching path under `src/vault/`. After copying, open each file and confirm its imports resolve to installed packages only (react, motion/react, gsap, @gsap/react, ogl, clsx, react-icons). If a copied component imports `react-router-dom` (e.g. `PillNav` uses `Link`), we will not use it directly — Task 6 builds a custom nav instead, so do NOT copy `PillNav`.

Components to copy (source → destination), all under the vault root `react-bits-vault/src/`:

- `free/Backgrounds/Aurora/Aurora.tsx` → `src/vault/free/Backgrounds/Aurora/Aurora.tsx`
- `free/TextAnimations/ShinyText/ShinyText.tsx` (+ any `.css`) → `src/vault/free/TextAnimations/ShinyText/`
- `free/TextAnimations/CountUp/CountUp.tsx` → `src/vault/free/TextAnimations/CountUp/CountUp.tsx`
- `free/TextAnimations/SplitText/` (all files) → `src/vault/free/TextAnimations/SplitText/`
- `free/Animations/StarBorder/` (all files incl. `.css` if present) → `src/vault/free/Animations/StarBorder/`
- `free/Components/Stepper/` (all files) → `src/vault/free/Components/Stepper/`
- `free/Components/GlassSurface/` (all files) → `src/vault/free/Components/GlassSurface/`
- `free/Components/SpotlightCard/` (all files) → `src/vault/free/Components/SpotlightCard/`
- `free/Backgrounds/Threads/Threads.tsx` → `src/vault/free/Backgrounds/Threads/Threads.tsx`
- `free/Animations/ClickSpark/` (all files) → `src/vault/free/Animations/ClickSpark/`

- [ ] **Step 1: Copy the component folders**

Run (from repo root):
```bash
cd /Users/henry/Documents/Gazillion-dollars
SRC=react-bits-vault/src
DST=pokedex-landing/src/vault
for p in \
  "free/Backgrounds/Aurora" \
  "free/TextAnimations/ShinyText" \
  "free/TextAnimations/CountUp" \
  "free/TextAnimations/SplitText" \
  "free/Animations/StarBorder" \
  "free/Components/Stepper" \
  "free/Components/GlassSurface" \
  "free/Components/SpotlightCard" \
  "free/Backgrounds/Threads" \
  "free/Animations/ClickSpark" ; do
  mkdir -p "$DST/$p"
  cp -R "$SRC/$p/." "$DST/$p/"
done
ls -R pokedex-landing/src/vault/free | head -60
```
Expected: each destination folder contains the component `.tsx` (and any `.css`).

- [ ] **Step 2: Verify no copied component imports an alias or uncopied path**

Run:
```bash
grep -rnE "from '@/|from \"@/|react-router" pokedex-landing/src/vault || echo "CLEAN"
```
Expected: `CLEAN`. If any match appears, open that file and replace the import with the installed-package equivalent, or copy the referenced helper into `src/vault/lib/` and update the path. (Known: `clsx`/`tailwind-merge` are installed; `react-icons` is installed.)

- [ ] **Step 3: Create attribution `src/vault/LICENSES.md`**

```markdown
# Vendored components

Components under `free/` are David Haz's **React Bits** (MIT + Commons Clause),
copied verbatim from our private `react-bits-vault`. They are used here to build
a product (this landing), which the license permits; the components themselves are
not redistributed or sold. Do not publish this `vault/` folder as a standalone library.
```

- [ ] **Step 4: Smoke-check the vault compiles in this project**

Create a temporary `src/vault/_smoke.ts`:
```ts
export { default as Aurora } from './free/Backgrounds/Aurora/Aurora';
export { default as CountUp } from './free/TextAnimations/CountUp/CountUp';
export { default as StarBorder } from './free/Animations/StarBorder/StarBorder';
export { default as Stepper } from './free/Components/Stepper/Stepper';
export { default as GlassSurface } from './free/Components/GlassSurface/GlassSurface';
export { default as SpotlightCard } from './free/Components/SpotlightCard/SpotlightCard';
export { default as ClickSpark } from './free/Animations/ClickSpark/ClickSpark';
export { default as Threads } from './free/Backgrounds/Threads/Threads';
```

Run: `cd pokedex-landing && npm run typecheck`
Expected: PASS. If a component has a named (not default) export, adjust the re-export to match what the file actually exports (open the file and check its `export` line). Fix until typecheck passes, then delete `_smoke.ts`.

- [ ] **Step 5: Commit**

```bash
git add pokedex-landing/src/vault
git commit -m "chore: vendor needed react-bits components into landing project"
```

---

## Task 6: Sticky Nav with anchor scrolling + mobile drawer

**Files:**
- Create: `pokedex-landing/src/components/Nav.tsx`
- Modify: `pokedex-landing/src/App.tsx`

- [ ] **Step 1: Implement `src/components/Nav.tsx`** (custom, no react-router; glassy sticky)

```tsx
import { useState } from 'react';
import { siteConfig } from '@/content/site';

const LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Coin Tree', href: '#coin-tree' },
  { label: 'Tokenomics', href: '#tokenomics' },
  { label: 'Buy', href: '#buy' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="container mt-4 flex items-center justify-between rounded-full border border-white/10 bg-black/30 px-5 py-3 backdrop-blur-md">
        <a href="#home" className="font-display text-lg font-700 tracking-tight text-glow">
          {siteConfig.token.name}
        </a>
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-mist transition hover:text-cream">
              {l.label}
            </a>
          ))}
          <a
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-leaf/20 px-4 py-1.5 text-sm font-500 text-glow ring-1 ring-leaf/40 transition hover:bg-leaf/30"
          >
            Follow on X
          </a>
        </div>
        <button
          aria-label="Toggle menu"
          className="md:hidden text-cream"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>
      {open && (
        <div className="container mt-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/70 p-3 backdrop-blur-md md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-mist hover:bg-white/5 hover:text-cream"
            >
              {l.label}
            </a>
          ))}
          <a
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-3 py-2 text-glow"
          >
            Follow on X
          </a>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Mount Nav in `src/App.tsx`**

```tsx
import Nav from './components/Nav';

export default function App() {
  return (
    <>
      <Nav />
      <main id="home">
        <section className="section container">Nav mounted — sections coming next</section>
      </main>
    </>
  );
}
```

- [ ] **Step 3: Verify build + dev render**

Run: `cd pokedex-landing && npm run build`
Expected: PASS. (Visual check happens in Task 13.)

- [ ] **Step 4: Commit**

```bash
git add pokedex-landing/src/components/Nav.tsx pokedex-landing/src/App.tsx
git commit -m "feat: sticky glass nav with mobile drawer"
```

---

## Task 7: Hero section + CA card

**Files:**
- Create: `pokedex-landing/src/components/CaCard.tsx`
- Test: `pokedex-landing/src/components/CaCard.test.tsx`
- Create: `pokedex-landing/src/sections/Hero.tsx`
- Modify: `pokedex-landing/src/App.tsx`

- [ ] **Step 1: Write failing test for `CaCard`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CaCard from './CaCard';

describe('CaCard', () => {
  it('shows the placeholder when not launched and copies it on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<CaCard />);
    expect(screen.getByText(/contract address coming soon/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('Coming soon at launch'));
    await waitFor(() => expect(screen.getByText(/copied/i)).toBeInTheDocument());

    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd pokedex-landing && npx vitest run src/components/CaCard.test.tsx`
Expected: FAIL — cannot resolve `./CaCard`.

- [ ] **Step 3: Implement `src/components/CaCard.tsx`**

```tsx
import { useState } from 'react';
import { siteConfig } from '@/content/site';
import { copyText } from '@/lib/copy';

export default function CaCard() {
  const [copied, setCopied] = useState(false);
  const { launched, address, placeholder } = siteConfig.ca;
  const value = launched && address ? address : placeholder;

  async function handleCopy() {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div className="mx-auto mt-8 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
      <div className="flex flex-col text-left">
        <span className="text-[11px] uppercase tracking-widest text-mist">Contract Address</span>
        <span className="font-mono text-sm text-cream">
          {launched && address ? address : 'Not launched yet — contract address coming soon'}
        </span>
      </div>
      <button
        onClick={handleCopy}
        className="ml-auto shrink-0 rounded-lg bg-leaf/20 px-3 py-2 text-sm text-glow ring-1 ring-leaf/40 transition hover:bg-leaf/30"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd pokedex-landing && npx vitest run src/components/CaCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Implement `src/sections/Hero.tsx`**

Open `src/vault/free/Backgrounds/Aurora/Aurora.tsx` and `src/vault/free/Animations/StarBorder/StarBorder.tsx` first to confirm their prop names; the usage below assumes Aurora accepts `colorStops`/`amplitude` props and StarBorder wraps children. Adjust prop names to match the actual files.

```tsx
import Aurora from '@/vault/free/Backgrounds/Aurora/Aurora';
import StarBorder from '@/vault/free/Animations/StarBorder/StarBorder';
import CaCard from '@/components/CaCard';
import { siteConfig } from '@/content/site';
import { useReducedMotion } from '@/lib/useReducedMotion';

export default function Hero() {
  const reduced = useReducedMotion();
  const { token, links } = siteConfig;

  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {!reduced ? (
          <Aurora colorStops={['#36c98a', '#7ef7c0', '#e9c46a']} amplitude={1.1} blend={0.6} />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(900px_500px_at_50%_-10%,rgba(54,201,138,0.25),transparent_60%)]" />
        )}
      </div>

      <div className="container text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-mist">Fair launch · pump.fun</p>
        <h1 className="font-display text-6xl font-700 leading-none text-glow sm:text-7xl md:text-8xl">
          {token.name}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-mist">{token.subPitch}</p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <StarBorder
            as="a"
            href={links.pumpfun}
            target="_blank"
            rel="noreferrer"
            color="#7ef7c0"
            speed="6s"
          >
            Buy on pump.fun
          </StarBorder>
          <a
            href={links.twitter}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-6 py-3 text-cream ring-1 ring-white/20 transition hover:bg-white/5"
          >
            Follow on X
          </a>
        </div>

        <CaCard />
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Render Hero in `App.tsx`**

```tsx
import Nav from './components/Nav';
import Hero from './sections/Hero';

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
      </main>
    </>
  );
}
```

- [ ] **Step 7: Verify build + tests**

Run: `cd pokedex-landing && npm run build && npx vitest run`
Expected: build PASS; all tests PASS. If Aurora/StarBorder props differ, fix per the actual component file, then rebuild.

- [ ] **Step 8: Commit**

```bash
git add pokedex-landing/src/sections/Hero.tsx pokedex-landing/src/components/CaCard.tsx pokedex-landing/src/components/CaCard.test.tsx pokedex-landing/src/App.tsx
git commit -m "feat: hero section with aurora bg, CTAs, and CA copy card"
```

---

## Task 8: Coin Tree section (scroll-grown tree + branch cards)

**Files:**
- Create: `pokedex-landing/src/sections/CoinTree.tsx`
- Modify: `pokedex-landing/src/App.tsx`

The growing tree is a hand-built inline SVG whose trunk/branch paths animate their `stroke-dashoffset` from full length to 0 as the section scrolls into view, using GSAP ScrollTrigger. Glowing nodes mark each branch; branch reward cards sit beside the tree. Threads background sits behind.

- [ ] **Step 1: Implement `src/sections/CoinTree.tsx`**

Open `src/vault/free/Backgrounds/Threads/Threads.tsx` first to confirm its props (assumed: `color`, `amplitude`, `distance`). Adjust to match.

```tsx
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Threads from '@/vault/free/Backgrounds/Threads/Threads';
import { siteConfig } from '@/content/site';
import { useReducedMotion } from '@/lib/useReducedMotion';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function CoinTree() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { branches } = siteConfig.coinTree;

  useGSAP(
    () => {
      if (reduced) return;
      const paths = gsap.utils.toArray<SVGPathElement>('.tree-path');
      paths.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.to('.tree-path', {
        strokeDashoffset: 0,
        stagger: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'bottom 60%', scrub: 1 },
      });
      gsap.from('.tree-node', {
        scale: 0,
        opacity: 0,
        stagger: 0.2,
        scrollTrigger: { trigger: root.current, start: 'top 55%', end: 'bottom 60%', scrub: 1 },
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section id="coin-tree" ref={root} className="section relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-40">
        <Threads color={[0.22, 0.78, 0.54]} amplitude={1} distance={0.4} />
      </div>
      <div className="container grid items-center gap-12 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <p className="text-sm uppercase tracking-[0.3em] text-mist">The Coin Tree</p>
          <h2 className="mt-3 font-display text-4xl font-700 text-glow md:text-5xl">
            One tree, many branches
          </h2>
          <p className="mt-4 max-w-md text-mist">
            Rewards grow from a single rooted token. Each branch nourishes a part of the community.
          </p>
          <div className="mt-8 grid gap-5">
            {branches.map((b) => (
              <div key={b.name} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <h3 className="font-display text-xl font-600 text-cream">{b.name}</h3>
                <p className="text-sm text-mist">{b.tagline}</p>
                <ul className="mt-3 space-y-2">
                  {b.rewards.map((r) => (
                    <li key={r.title} className="text-sm text-mist">
                      <span className="text-glow">◆</span> <span className="text-cream">{r.title}</span> — {r.body}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 flex justify-center md:order-2">
          <svg viewBox="0 0 300 360" className="w-full max-w-sm" fill="none">
            <path className="tree-path" d="M150 350 L150 200" stroke="#36c98a" strokeWidth="6" strokeLinecap="round" />
            <path className="tree-path" d="M150 230 C110 200 90 170 70 130" stroke="#36c98a" strokeWidth="5" strokeLinecap="round" />
            <path className="tree-path" d="M150 215 C190 185 210 150 235 115" stroke="#36c98a" strokeWidth="5" strokeLinecap="round" />
            <path className="tree-path" d="M150 195 C140 160 150 120 150 80" stroke="#36c98a" strokeWidth="5" strokeLinecap="round" />
            <circle className="tree-node" cx="70" cy="130" r="12" fill="#7ef7c0" />
            <circle className="tree-node" cx="235" cy="115" r="12" fill="#e9c46a" />
            <circle className="tree-node" cx="150" cy="80" r="14" fill="#7ef7c0" />
            <style>{`.tree-node{filter:drop-shadow(0 0 10px rgba(126,247,192,.8))}`}</style>
          </svg>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add CoinTree to `App.tsx`** (after `<Hero />`)

```tsx
import CoinTree from './sections/CoinTree';
// ...inside <main>, after <Hero />:
        <CoinTree />
```

- [ ] **Step 3: Verify build**

Run: `cd pokedex-landing && npm run build`
Expected: PASS. If `gsap/ScrollTrigger` import path errors, confirm gsap is installed (it is, per Task 1). If Threads props differ, fix per the file.

- [ ] **Step 4: Commit**

```bash
git add pokedex-landing/src/sections/CoinTree.tsx pokedex-landing/src/App.tsx
git commit -m "feat: coin tree section with scroll-grown SVG tree and branch cards"
```

---

## Task 9: Tokenomics section (animated counter + allocation bars)

**Files:**
- Create: `pokedex-landing/src/sections/Tokenomics.tsx`
- Modify: `pokedex-landing/src/App.tsx`

- [ ] **Step 1: Implement `src/sections/Tokenomics.tsx`**

Open `src/vault/free/TextAnimations/CountUp/CountUp.tsx` to confirm its props (assumed: `to`, `from`, `duration`, `separator`). Adjust to match.

```tsx
import CountUp from '@/vault/free/TextAnimations/CountUp/CountUp';
import { siteConfig } from '@/content/site';

export default function Tokenomics() {
  const { token, allocations } = siteConfig;
  return (
    <section id="tokenomics" className="section">
      <div className="container">
        <p className="text-center text-sm uppercase tracking-[0.3em] text-mist">The Numbers</p>
        <h2 className="mt-3 text-center font-display text-4xl font-700 text-glow md:text-5xl">Tokenomics</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-mist">
          A fixed supply of {token.supplyDisplay} {token.name}. No hidden mint, no team unlocks beyond the
          allocation below.
        </p>

        <div className="mt-12 flex flex-col items-center">
          <div className="font-display text-6xl font-700 text-glow md:text-8xl">
            <CountUp to={token.totalSupply} from={0} separator="," duration={2} />
          </div>
          <p className="mt-2 text-sm uppercase tracking-widest text-mist">Total Supply</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-5">
          {allocations.map((a) => (
            <div key={a.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg font-600 text-cream">{a.label}</span>
                <span className="font-display text-2xl font-700 text-glow">{a.pct}%</span>
              </div>
              <p className="mt-1 text-sm text-mist">
                {a.amount.toLocaleString('en-US')} tokens — {a.blurb}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-leaf to-gold"
                  style={{ width: `${a.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add Tokenomics to `App.tsx`** (after `<CoinTree />`)

```tsx
import Tokenomics from './sections/Tokenomics';
// ...after <CoinTree />:
        <Tokenomics />
```

- [ ] **Step 3: Verify build**

Run: `cd pokedex-landing && npm run build`
Expected: PASS. Fix CountUp prop names if needed per the component file.

- [ ] **Step 4: Commit**

```bash
git add pokedex-landing/src/sections/Tokenomics.tsx pokedex-landing/src/App.tsx
git commit -m "feat: tokenomics section with animated counter and allocation bars"
```

---

## Task 10: Trust strip (four pillars)

**Files:**
- Create: `pokedex-landing/src/sections/TrustStrip.tsx`
- Modify: `pokedex-landing/src/App.tsx`

- [ ] **Step 1: Implement `src/sections/TrustStrip.tsx`**

Open `src/vault/free/Components/SpotlightCard/SpotlightCard.tsx` to confirm its props (assumed: `className`, `spotlightColor`, children). Adjust to match.

```tsx
import SpotlightCard from '@/vault/free/Components/SpotlightCard/SpotlightCard';
import { siteConfig } from '@/content/site';

export default function TrustStrip() {
  return (
    <section className="section">
      <div className="container grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {siteConfig.trust.map((t) => (
          <SpotlightCard key={t.key} className="border border-white/10 bg-white/5" spotlightColor="rgba(126,247,192,0.25)">
            <h3 className="font-display text-xl font-600 text-glow">{t.title}</h3>
            <p className="mt-2 text-sm text-mist">{t.body}</p>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add TrustStrip to `App.tsx`** (after `<Tokenomics />`)

```tsx
import TrustStrip from './sections/TrustStrip';
// ...after <Tokenomics />:
        <TrustStrip />
```

- [ ] **Step 3: Verify build**

Run: `cd pokedex-landing && npm run build`
Expected: PASS. Fix SpotlightCard prop names if needed per the file.

- [ ] **Step 4: Commit**

```bash
git add pokedex-landing/src/sections/TrustStrip.tsx pokedex-landing/src/App.tsx
git commit -m "feat: trust strip with spotlight cards"
```

---

## Task 11: How to Buy (stepper)

**Files:**
- Create: `pokedex-landing/src/sections/HowToBuy.tsx`
- Modify: `pokedex-landing/src/App.tsx`

- [ ] **Step 1: Implement `src/sections/HowToBuy.tsx`**

Open `src/vault/free/Components/Stepper/Stepper.tsx` to confirm its API. The vault `Stepper` renders `Step` children and manages an internal active step with its own next/back buttons. Use it as a guided walkthrough; pass each buy step as a `Step` child. Confirm the named exports (`Stepper` default + `Step`) and adjust the import to match the actual file.

```tsx
import Stepper, { Step } from '@/vault/free/Components/Stepper/Stepper';
import StarBorder from '@/vault/free/Animations/StarBorder/StarBorder';
import { siteConfig } from '@/content/site';

export default function HowToBuy() {
  const { buySteps, links } = siteConfig;
  return (
    <section id="buy" className="section">
      <div className="container max-w-2xl">
        <p className="text-center text-sm uppercase tracking-[0.3em] text-mist">Get Started</p>
        <h2 className="mt-3 text-center font-display text-4xl font-700 text-glow md:text-5xl">How to Buy</h2>

        <div className="mt-10">
          <Stepper>
            {buySteps.map((s) => (
              <Step key={s.title}>
                <h3 className="font-display text-xl font-600 text-cream">{s.title}</h3>
                <p className="mt-2 text-mist">{s.body}</p>
              </Step>
            ))}
          </Stepper>
        </div>

        <div className="mt-10 flex justify-center">
          <StarBorder as="a" href={links.pumpfun} target="_blank" rel="noreferrer" color="#e9c46a" speed="6s">
            Open pump.fun
          </StarBorder>
        </div>
      </div>
    </section>
  );
}
```

If the vault `Stepper` does NOT export a `Step` child (some versions take a `steps` array or render-props), instead render a simple custom numbered list to avoid fighting the API:

```tsx
// Fallback if Stepper API differs — replace the <Stepper> block above with:
<ol className="space-y-5">
  {buySteps.map((s, i) => (
    <li key={s.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf/20 font-display font-700 text-glow ring-1 ring-leaf/40">
        {i + 1}
      </span>
      <div>
        <h3 className="font-display text-xl font-600 text-cream">{s.title}</h3>
        <p className="mt-1 text-mist">{s.body}</p>
      </div>
    </li>
  ))}
</ol>
```

- [ ] **Step 2: Add HowToBuy to `App.tsx`** (after `<TrustStrip />`)

```tsx
import HowToBuy from './sections/HowToBuy';
// ...after <TrustStrip />:
        <HowToBuy />
```

- [ ] **Step 3: Verify build**

Run: `cd pokedex-landing && npm run build`
Expected: PASS. Use whichever Stepper variant compiles cleanly.

- [ ] **Step 4: Commit**

```bash
git add pokedex-landing/src/sections/HowToBuy.tsx pokedex-landing/src/App.tsx
git commit -m "feat: how-to-buy stepper section"
```

---

## Task 12: Footer + disclaimer

**Files:**
- Create: `pokedex-landing/src/components/Footer.tsx`
- Modify: `pokedex-landing/src/App.tsx`

- [ ] **Step 1: Implement `src/components/Footer.tsx`**

```tsx
import { siteConfig } from '@/content/site';

export default function Footer() {
  const { token, links, disclaimer, ca } = siteConfig;
  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="container py-12">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <a href="#home" className="font-display text-xl font-700 text-glow">
            {token.name}
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-mist">
            <a href={links.twitter} target="_blank" rel="noreferrer" className="hover:text-cream">X / Twitter</a>
            <a href="#coin-tree" className="hover:text-cream">Coin Tree</a>
            <a href="#tokenomics" className="hover:text-cream">Tokenomics</a>
            <a href="#buy" className="hover:text-cream">Buy</a>
          </nav>
        </div>
        <p className="mt-8 text-xs leading-relaxed text-mist/80">{disclaimer}</p>
        {!ca.launched && (
          <p className="mt-3 text-xs text-mist/80">
            {token.name} — not launched yet. Contract address will be posted here and on X at launch.
          </p>
        )}
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Add Footer to `App.tsx`** (after `</main>`)

```tsx
import Footer from './components/Footer';
// ...after </main>:
      <Footer />
```

- [ ] **Step 3: Verify build**

Run: `cd pokedex-landing && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add pokedex-landing/src/components/Footer.tsx pokedex-landing/src/App.tsx
git commit -m "feat: footer with socials and parody/risk disclaimer"
```

---

## Task 13: Global polish (click spark + grain) wired with reduced-motion

**Files:**
- Create: `pokedex-landing/src/components/GlobalPolish.tsx`
- Modify: `pokedex-landing/src/App.tsx`

- [ ] **Step 1: Implement `src/components/GlobalPolish.tsx`**

Open `src/vault/free/Animations/ClickSpark/ClickSpark.tsx` to confirm its API (assumed: wraps children, props `sparkColor`, `sparkCount`). Adjust to match. ClickSpark typically wraps the whole app.

```tsx
import type { ReactNode } from 'react';
import ClickSpark from '@/vault/free/Animations/ClickSpark/ClickSpark';
import { useReducedMotion } from '@/lib/useReducedMotion';

export default function GlobalPolish({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <ClickSpark sparkColor="#7ef7c0" sparkCount={10} sparkRadius={18} duration={500}>
      {children}
    </ClickSpark>
  );
}
```

- [ ] **Step 2: Wrap app in `src/App.tsx`**

```tsx
import GlobalPolish from './components/GlobalPolish';
import Nav from './components/Nav';
import Hero from './sections/Hero';
import CoinTree from './sections/CoinTree';
import Tokenomics from './sections/Tokenomics';
import TrustStrip from './sections/TrustStrip';
import HowToBuy from './sections/HowToBuy';
import Footer from './components/Footer';

export default function App() {
  return (
    <GlobalPolish>
      <Nav />
      <main>
        <Hero />
        <CoinTree />
        <Tokenomics />
        <TrustStrip />
        <HowToBuy />
      </main>
      <Footer />
    </GlobalPolish>
  );
}
```

- [ ] **Step 3: Verify build + full test run**

Run: `cd pokedex-landing && npm run build && npx vitest run`
Expected: build PASS; all tests PASS. If ClickSpark prop names differ, fix per the file.

- [ ] **Step 4: Commit**

```bash
git add pokedex-landing/src/components/GlobalPolish.tsx pokedex-landing/src/App.tsx
git commit -m "feat: global click-spark polish, gated by reduced-motion"
```

---

## Task 14: Responsive QA + visual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `cd pokedex-landing && npm run dev`
Expected: server prints a local URL (typically `http://localhost:5173`).

- [ ] **Step 2: Screenshot the full page at three breakpoints**

Use the Playwright MCP (or `mcp__playwright__browser_navigate` + `browser_take_screenshot` with `fullPage: true`) at viewport widths 390, 768, and 1440. Capture each section.

- [ ] **Step 3: Review screenshots against the spec checklist**

Confirm: nav is legible over hero; "PokeDex" title is the focal point; CA card reads "Not launched yet…"; Coin Tree SVG draws and branch cards are readable; tokenomics counter lands on 1,000,000,000 and bars match percentages; four trust cards; buy steps legible; footer disclaimer present. Note any overflow, clipped text, or unreadable contrast.

- [ ] **Step 4: Fix any layout/contrast issues found**

Make targeted fixes to the affected section/component. Re-screenshot the changed breakpoint to confirm. Commit each fix:
```bash
git add -A && git commit -m "fix: <specific layout/contrast issue> at <breakpoint>"
```

- [ ] **Step 5: Verify reduced-motion path**

Re-run the desktop screenshot with reduced motion emulated (Playwright: `browser_emulate` media `prefers-reduced-motion: reduce`, or set it in the call). Confirm the hero shows the static gradient fallback and no console errors. Note result.

---

## Task 15: Vercel deploy config

**Files:**
- Create: `pokedex-landing/vercel.json`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true
}
```

- [ ] **Step 2: Final production build sanity**

Run: `cd pokedex-landing && npm run build && npm run preview`
Expected: build PASS; preview serves the built site without console errors.

- [ ] **Step 3: Commit**

```bash
git add pokedex-landing/vercel.json
git commit -m "chore: vercel static deploy config"
```

- [ ] **Step 4: (Optional, on user request) Deploy**

Deploy via the Vercel MCP or `vercel` CLI from `pokedex-landing/`. Do NOT deploy without explicit user go-ahead.

---

## Self-Review

**Spec coverage:**
- Purpose / single-page landing → Tasks 6–13 compose all spec sections. ✓
- Mystical-organic vibe → Task 3 theme tokens + Aurora/Threads usage. ✓
- PokeDex parody name + disclaimer → content config + Footer (Task 12). ✓
- Coin Tree growing visual → Task 8. ✓
- Tokenomics (1B + 60/15/15/10 split) → content config + Task 9; integrity enforced by Task 2 tests. ✓
- Trust strip (supply/tax/lp/fair) → Task 10. ✓
- How to Buy → Task 11. ✓
- CA "not launched" copy behavior → Task 7 (CaCard) with test. ✓
- One-file content config + easy launch flip → Task 2 (`ca.launched`). ✓
- Reduced-motion + WebGL fallbacks → Task 4 hook, used in Hero (Task 7) and GlobalPolish (Task 13). ✓
- Responsive QA + build + screenshots + Lighthouse-style review → Task 14. ✓
- Vercel deploy → Task 15. ✓
- Vault components consumed → Task 5 vendoring + per-section usage. ✓

**Placeholder scan:** No "TBD"/"implement later"; every code step shows real code. The few "open the component file and confirm props" notes are deliberate verification steps against vendored third-party files (props can't be invented), each paired with concrete example usage and a fallback. ✓

**Type consistency:** `siteConfig` shape (Task 2) is referenced identically across Tasks 6–13 (`token`, `ca`, `links`, `allocations`, `trust`, `buySteps`, `coinTree`, `disclaimer`). `copyText` (Task 4) used by `CaCard` (Task 7). `useReducedMotion` (Task 4) used in Tasks 7 & 13. ✓
