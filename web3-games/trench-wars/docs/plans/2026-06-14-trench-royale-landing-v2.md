# Trench Royale — Landing v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename Trench Wars → Trench Royale everywhere, and build a premium full-scroll marketing landing page (DarkVeil hero, 3D battlefield diorama, roster, mechanics, token-economy) that fronts the existing game.

**Architecture:** A new `landing` screen state renders before the existing `menu | deck | battle` state machine; its PLAY CTA calls `onPlay()` → `setScreen('menu')`, leaving the game untouched. The landing lives in `src/landing/` and uses Tailwind v4 (preflight disabled to protect the game's plain CSS), Lenis smooth scroll, GSAP scroll reveals, React Three Fiber for the diorama, and vendored React Bits components copied from `react-bits-vault`.

**Tech Stack:** Vite 8 · React 19 · TypeScript · Tailwind CSS v4 (`@tailwindcss/vite`) · Lenis · GSAP · `@react-three/fiber` + `@react-three/drei` · Three.js (already present) · `ogl` (for DarkVeil) · Vitest + Playwright.

**Working directory:** `web3-games/trench-wars`. All paths below are relative to it unless absolute. Branch: `feat/trench-royale-landing`.

**Conventions:**
- Dev server runs on port **5174** (`npm run dev`).
- Commit after every task. Commit footer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- React Bits sources live at
  `/Users/henry/Documents/Gazillion-dollars/react-bits-vault/src/free/`.

---

## File Structure

**Rename touches (Phase 0):** `index.html`, `package.json`, `server/package.json`, `src/render/Brand.ts`, `src/ui/Menu.tsx`, `src/game/ladder.ts`, `e2e/smoke.spec.ts`, `server/src/index.ts`, `README.md`, `CLAUDE.md`, `scripts/prod-check.ts`.

**New landing files (Phases 1–8):**
```
src/landing/
  Landing.tsx                 # composition + Lenis provider
  landing.css                 # landing-scoped tokens + base, gated under .tr-landing
  data.ts                     # roster, steps, mechanics, token model (typed)
  useScrollReveal.ts          # GSAP scroll-reveal hook
  sections/
    Nav.tsx
    Hero.tsx
    Roster.tsx
    HowItWorks.tsx
    Mechanics.tsx
    TokenEconomy.tsx
    FinalCta.tsx
    Footer.tsx
    Divider.tsx
  three/
    BattlefieldDiorama.tsx
  reactbits/                  # vendored, copied verbatim from the vault
    DarkVeil.tsx
    SplitText.tsx
    CountUp.tsx
    StarBorder.tsx
    TiltedCard.tsx
    SpotlightCard.tsx
    ShinyText.tsx
```
**Modified for integration:** `src/ui/App.tsx`, `vite.config.ts`, `src/main.tsx` (CSS import), `package.json` (deps).
**New test:** `e2e/landing.spec.ts`.

---

## Phase 0 — Rename Trench Wars → Trench Royale

### Task 0.1: Update the e2e smoke assertion (failing test first)

**Files:**
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: Update the h1 assertion to the new name**

Find the line asserting the title and change it:
```ts
// was: await expect(page.locator('h1')).toHaveText('TRENCH WARS')
await expect(page.locator('h1')).toHaveText('TRENCH ROYALE')
```
If the locator differs (e.g. `getByRole('heading')`), keep the locator and only change the expected text to `TRENCH ROYALE`.

- [ ] **Step 2: Run it to confirm it now fails (old UI still says TRENCH WARS)**

Run: `npm run e2e -- smoke.spec.ts` (start backend first if required: `npm run dev:server` or per README; if e2e needs the API on 3001 and it's unavailable, instead run `npx playwright test e2e/smoke.spec.ts`).
Expected: FAIL — actual text is `TRENCH WARS`.

> If e2e can't boot in this environment, skip the run and proceed; Task 0.6 verifies via build + grep instead.

### Task 0.2: Rename the in-UI brand strings

**Files:**
- Modify: `src/render/Brand.ts`
- Modify: `src/ui/Menu.tsx`

- [ ] **Step 1: Update `Brand.ts`**

```ts
/** Shared brand tokens for Trench Royale UI ... */
// name constant:
name: 'TRENCH ROYALE',
```

- [ ] **Step 2: Update `Menu.tsx` heading**

```tsx
<h1>TRENCH ROYALE</h1>
```

- [ ] **Step 3: Verify the smoke test now passes** (if runnable)

Run: `npx playwright test e2e/smoke.spec.ts`
Expected: PASS.

### Task 0.3: Rename HTML metadata

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update title and meta description**

```html
<title>Trench Royale</title>
<meta name="description" content="Trench Royale — Traders vs Jeets. Real-time lane warfare on Solana." />
```

### Task 0.4: Rename package names + server log

**Files:**
- Modify: `package.json`
- Modify: `server/package.json`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Root package name**
```json
"name": "trench-royale",
```
- [ ] **Step 2: Server package name**
```json
"name": "trench-royale-server",
```
- [ ] **Step 3: Server console log** — change `'Trench Wars server listening...'` → `'Trench Royale server listening...'`.

### Task 0.5: Rename localStorage keys (with migration) + docs

**Files:**
- Modify: `src/game/ladder.ts`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `scripts/prod-check.ts`

- [ ] **Step 1: Rename keys with a one-time migration so existing local progress survives**

In `ladder.ts`, replace the key constants and add migration on read:
```ts
const KEY = 'trench-royale-ladder-level'
const WINS_KEY = 'trench-royale-total-wins'
const OLD_KEY = 'trench-wars-ladder-level'
const OLD_WINS_KEY = 'trench-wars-total-wins'

function migrate() {
  for (const [oldK, newK] of [[OLD_KEY, KEY], [OLD_WINS_KEY, WINS_KEY]] as const) {
    const old = localStorage.getItem(oldK)
    if (old != null && localStorage.getItem(newK) == null) {
      localStorage.setItem(newK, old)
      localStorage.removeItem(oldK)
    }
  }
}
```
Call `migrate()` once at the top of the existing read function(s) that use these keys (e.g. the function that loads the current ladder level), before reading.

- [ ] **Step 2: Update `README.md` heading + intro and `CLAUDE.md` heading** — replace "Trench Wars" → "Trench Royale" (keep "Clash Royale-style lane battler — Traders vs Jeets" description otherwise intact).

- [ ] **Step 3: `scripts/prod-check.ts`** — update display copy referencing the name. Leave the actual deployed URL string as-is with a `// TODO: rename Vercel/Railway project (ops)` comment, since renaming live infra is out of scope.

### Task 0.6: Verify rename completeness + commit

- [ ] **Step 1: Grep for stragglers (case-insensitive)**

Run: `grep -rin "trench wars\|trench-wars\|trenchwars" src server index.html package.json server/package.json README.md CLAUDE.md scripts --include="*.ts" --include="*.tsx" --include="*.json" --include="*.html" --include="*.md" | grep -vi "vercel\|railway\|up.railway\|TODO: rename"`
Expected: no output (remaining hits should only be the intentionally-deferred live-infra URLs).

- [ ] **Step 2: Typecheck/build**

Run: `npm run build`
Expected: succeeds (TypeScript passes, Vite builds).

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "refactor(trench-royale): rename Trench Wars -> Trench Royale

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 1 — Tooling + landing scaffold + App integration

### Task 1.1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install landing deps**

Run:
```bash
npm install -D tailwindcss@^4 @tailwindcss/vite@^4
npm install lenis@^1.3 gsap@^3.13 @gsap/react@^2.1 @react-three/fiber@^9.3 @react-three/drei@^10 ogl@^1.0
```
(Three.js is already a dependency. `@react-three/fiber@9` requires React 19 — already present.)

- [ ] **Step 2: Verify install**

Run: `npm ls lenis gsap @react-three/fiber ogl tailwindcss --depth=0`
Expected: all resolve without `UNMET`.

### Task 1.2: Wire Tailwind v4 into Vite with preflight disabled

**Files:**
- Modify: `vite.config.ts`
- Create: `src/landing/landing.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Add the Tailwind plugin to Vite**

In `vite.config.ts`, import and register the plugin alongside React:
```ts
import tailwindcss from '@tailwindcss/vite'
// ...
plugins: [react(), tailwindcss()],
```

- [ ] **Step 2: Create `src/landing/landing.css` — Tailwind WITHOUT preflight, plus landing tokens**

Importing the Tailwind layers individually and omitting `preflight` prevents Tailwind from resetting the existing game UI styled by `theme.css`.
```css
/* Tailwind v4 — utilities + theme only, NO preflight (protects game's theme.css) */
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);

@theme {
  --color-obsidian: #07090d;
  --color-panel: #0f1219;
  --color-gold: #d4a13c;
  --color-gold-dark: #9c7528;
  --color-ember: #ff6a2b;
  --color-trader: #2bff88;
  --color-jeet: #ff4d5e;
  --color-platinum: #ece8e5;
  --color-muted: #9aa3b2;
  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Rajdhani', sans-serif;
}

/* Landing-scoped base (gated so it never touches the game) */
.tr-landing {
  background: var(--color-obsidian);
  color: var(--color-platinum);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
.tr-landing * { box-sizing: border-box; }
.tr-landing h1, .tr-landing h2, .tr-landing h3 { font-family: var(--font-display); margin: 0; }

@media (prefers-reduced-motion: reduce) {
  .tr-landing * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Import the CSS in `main.tsx`** (after the existing `theme.css` import so landing tokens load):
```ts
import './landing/landing.css'
```

- [ ] **Step 4: Verify build still works**

Run: `npm run build`
Expected: builds clean.

### Task 1.3: App integration — add the `landing` screen state

**Files:**
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: Add `landing` as the initial screen and render a placeholder Landing**

In `App.tsx`, extend the screen union/state to include `'landing'`, make it the initial value, and render the Landing first:
```tsx
import { Landing } from '../landing/Landing'
// screen state type: 'landing' | 'menu' | 'deck' | 'battle'
const [screen, setScreen] = useState<Screen>('landing')
// ...in render:
if (screen === 'landing') return <Landing onPlay={() => setScreen('menu')} />
```
Keep all existing `menu | deck | battle` rendering unchanged below.

- [ ] **Step 2: Create a minimal placeholder `src/landing/Landing.tsx`** (real sections come next):
```tsx
export function Landing({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="tr-landing" style={{ minHeight: '100vh', padding: 40 }}>
      <h1 style={{ fontSize: 48 }}>TRENCH ROYALE</h1>
      <button onClick={onPlay} className="tr-play-placeholder">PLAY NOW</button>
    </div>
  )
}
```

- [ ] **Step 3: Run dev + manual check**

Run: `npm run dev` and open `http://localhost:5174`.
Expected: landing placeholder shows "TRENCH ROYALE"; clicking PLAY NOW shows the existing game Menu.

### Task 1.4: e2e test for landing→menu transition + commit

**Files:**
- Create: `e2e/landing.spec.ts`
- Modify: `e2e/smoke.spec.ts` (the menu now appears AFTER clicking PLAY)

- [ ] **Step 1: Write `e2e/landing.spec.ts`**
```ts
import { test, expect } from '@playwright/test'

test('landing shows brand and PLAY drops into the game menu', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'TRENCH ROYALE' })).toBeVisible()
  await page.getByRole('button', { name: /play now/i }).first().click()
  // existing Menu renders its own controls (guest/wallet/practice)
  await expect(page.getByText(/guest|connect wallet|practice/i).first()).toBeVisible()
})
```

- [ ] **Step 2: Update `smoke.spec.ts`** so it clicks into the menu before asserting menu-only elements (the landing now owns `/`). If `smoke.spec.ts` only asserts the `TRENCH ROYALE` heading, it still passes because the landing also shows that heading — leave it. If it asserts menu buttons directly, prepend:
```ts
await page.getByRole('button', { name: /play now/i }).first().click()
```

- [ ] **Step 3: Run e2e** (if runnable in env): `npx playwright test e2e/landing.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat(trench-royale): landing scaffold + Tailwind/R3F tooling, App integration

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Vendored React Bits + Hero

### Task 2.1: Vendor the React Bits components

**Files:**
- Create: `src/landing/reactbits/{DarkVeil,SplitText,CountUp,StarBorder,TiltedCard,SpotlightCard,ShinyText}.tsx`

- [ ] **Step 1: Copy each component verbatim from the vault**

Run:
```bash
VAULT=/Users/henry/Documents/Gazillion-dollars/react-bits-vault/src/free
mkdir -p src/landing/reactbits
cp "$VAULT/Backgrounds/DarkVeil/DarkVeil.tsx" src/landing/reactbits/DarkVeil.tsx
cp "$VAULT/TextAnimations/SplitText/SplitText.tsx" src/landing/reactbits/SplitText.tsx
cp "$VAULT/TextAnimations/CountUp/CountUp.tsx" src/landing/reactbits/CountUp.tsx
cp "$VAULT/TextAnimations/ShinyText/ShinyText.tsx" src/landing/reactbits/ShinyText.tsx
cp "$VAULT/Animations/StarBorder/StarBorder.tsx" src/landing/reactbits/StarBorder.tsx
cp "$VAULT/Components/TiltedCard/TiltedCard.tsx" src/landing/reactbits/TiltedCard.tsx
cp "$VAULT/Components/SpotlightCard/SpotlightCard.tsx" src/landing/reactbits/SpotlightCard.tsx
```

- [ ] **Step 2: Fix any CSS-import siblings**

Some components import a sibling `.css` (e.g. `./StarBorder.css`). For each copied file, check its top imports:
```bash
grep -n "import './" src/landing/reactbits/*.tsx
```
For every `import './X.css'` found, also copy that CSS file from the same vault folder into `src/landing/reactbits/` so the relative import resolves.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from the vendored files. (If a component uses a path alias like `@/...`, replace it with a relative import.)

- [ ] **Step 4: Commit**
```bash
git add src/landing/reactbits
git commit -m "feat(trench-royale): vendor React Bits (DarkVeil, SplitText, CountUp, StarBorder, TiltedCard, SpotlightCard, ShinyText)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 2.2: Build the Hero section

**Files:**
- Create: `src/landing/sections/Hero.tsx`
- Create: `src/landing/three/BattlefieldDiorama.tsx` (placeholder; real model in Phase 3)
- Modify: `src/landing/Landing.tsx`

- [ ] **Step 1: Temporary diorama placeholder** so Hero composes now:
```tsx
// src/landing/three/BattlefieldDiorama.tsx
export function BattlefieldDiorama() {
  return (
    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 24,
      background: 'radial-gradient(circle at 50% 40%, rgba(212,161,60,0.18), transparent 60%)',
      border: '1px solid rgba(212,161,60,0.25)' }} />
  )
}
```

- [ ] **Step 2: Write `Hero.tsx`**
```tsx
import { Suspense, lazy } from 'react'
import SplitText from '../reactbits/SplitText'
import CountUp from '../reactbits/CountUp'
import StarBorder from '../reactbits/StarBorder'
import { BattlefieldDiorama } from '../three/BattlefieldDiorama'

const DarkVeil = lazy(() => import('../reactbits/DarkVeil'))

export function Hero({ onPlay }: { onPlay: () => void }) {
  return (
    <section className="tr-hero" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Suspense fallback={null}>
          <DarkVeil hueShift={40} noiseIntensity={0.04} scanlineIntensity={0.1} speed={0.6} warpAmount={2} />
        </Suspense>
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 30% 50%, rgba(7,9,13,0) 0%, rgba(7,9,13,0.85) 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1.1fr 1fr',
        gap: 48, alignItems: 'center', maxWidth: 1280, margin: '0 auto', padding: '120px 32px 64px' }}
        className="tr-hero-grid">
        <div>
          <p style={{ color: 'var(--color-gold)', letterSpacing: '0.34em', textTransform: 'uppercase', fontSize: 13 }}>
            Traders vs Jeets
          </p>
          <h1 style={{ fontSize: 'clamp(48px, 8vw, 92px)', lineHeight: 0.95, fontWeight: 900, margin: '12px 0' }}>
            <SplitText text="TRENCH" /><br /><span style={{ color: 'var(--color-gold)' }}><SplitText text="ROYALE" /></span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 18, maxWidth: 440, margin: '16px 0 28px' }}>
            Real-time lane warfare on Solana. Stack your deck, storm the trench, burn $ROYALE.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <StarBorder as="button" color="#d4a13c" onClick={onPlay}>PLAY NOW</StarBorder>
            <button onClick={onPlay} className="tr-btn-ghost"
              style={{ background: 'transparent', border: '1px solid rgba(212,161,60,0.4)', color: 'var(--color-platinum)',
                padding: '12px 24px', borderRadius: 12, font: 'inherit', cursor: 'pointer' }}>
              Connect Wallet
            </button>
          </div>
          <div style={{ display: 'flex', gap: 36, marginTop: 40 }}>
            <Stat value={7} label="Commanders" />
            <Stat value={12} label="Cards" />
            <Stat value={50} suffix="%" label="Burn rate" />
          </div>
        </div>
        <div><BattlefieldDiorama /></div>
      </div>
    </section>
  )
}

function Stat({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--color-gold)' }}>
        <CountUp to={value} />{suffix}
      </div>
      <div style={{ color: 'var(--color-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</div>
    </div>
  )
}
```
> Note: verify the exact prop names of vendored `SplitText`, `CountUp`, `StarBorder` after copying (open each file). Adjust prop names if the vault version differs (e.g. `CountUp` may use `to`/`end`, `StarBorder` may use `as`/`color`/`speed`). Use what the source defines.

- [ ] **Step 3: Render Hero in `Landing.tsx`**
```tsx
import { Hero } from './sections/Hero'
export function Landing({ onPlay }: { onPlay: () => void }) {
  return <div className="tr-landing"><Hero onPlay={onPlay} /></div>
}
```

- [ ] **Step 4: Add hero responsive CSS to `landing.css`**
```css
@media (max-width: 860px) {
  .tr-hero-grid { grid-template-columns: 1fr !important; }
}
```

- [ ] **Step 5: Manual check + commit**

Run: `npm run dev` → confirm DarkVeil animates behind the headline, stats count up, PLAY works.
```bash
git add -A
git commit -m "feat(trench-royale): hero section with DarkVeil bg + split headline + CTAs

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — 3D Battlefield Diorama

### Task 3.1: Build the R3F floating battlefield

**Files:**
- Modify: `src/landing/three/BattlefieldDiorama.tsx`

- [ ] **Step 1: Replace placeholder with an R3F scene**

Uses existing KayKit GLTF terrain in `public/assets/3d/kaykit/` and a couple of character GLBs. Models are loaded via drei `useGLTF`; the whole group floats and rotates.
```tsx
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Float, ContactShadows, Bounds } from '@react-three/drei'
import * as THREE from 'three'

function Model({ url, position, rotationY = 0 }: { url: string; position: [number, number, number]; rotationY?: number }) {
  const { scene } = useGLTF(url)
  const cloned = scene.clone(true)
  return <primitive object={cloned} position={position} rotation={[0, rotationY, 0]} />
}

function Diorama() {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (group.current) group.current.rotation.y += dt * 0.15 })
  // 3x3 hex platform
  const tiles: [number, number, number][] = []
  for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) tiles.push([x * 1.0, 0, z * 1.0])
  return (
    <group ref={group}>
      {tiles.map((p, i) => <Model key={i} url="/assets/3d/kaykit/hex_grass.gltf" position={p} />)}
      <Model url="/assets/3d/kaykit/building_tower_A_blue.gltf" position={[-0.9, 0.2, -0.9]} />
      <Model url="/assets/3d/kaykit/building_tower_A_red.gltf" position={[0.9, 0.2, 0.9]} />
      <Model url="/assets/3d/kaykit/building_castle_blue.gltf" position={[0, 0.2, -0.9]} />
    </group>
  )
}

export function BattlefieldDiorama() {
  return (
    <div style={{ width: '100%', aspectRatio: '1/1' }}>
      <Canvas camera={{ position: [3, 3.2, 3.4], fov: 38 }} dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[4, 6, 3]} angle={0.4} intensity={2.2} color="#d4a13c" castShadow />
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
            <Bounds fit clip observe margin={1.1}><Diorama /></Bounds>
          </Float>
          <Environment preset="night" />
        </Suspense>
        <ContactShadows position={[0, -0.4, 0]} opacity={0.5} blur={2.4} far={4} color="#000000" />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/assets/3d/kaykit/hex_grass.gltf')
```
> If any GLTF path 404s, list `public/assets/3d/kaykit/` and use the actual filenames found there (the spec's audit listed `hex_grass.gltf`, `building_tower_A_blue/red.gltf`, `building_castle_blue.gltf`).

- [ ] **Step 2: Lazy-load the diorama in Hero** so WebGL doesn't block first paint. In `Hero.tsx` replace the static import with:
```tsx
import { Suspense, lazy } from 'react'
const BattlefieldDiorama = lazy(() =>
  import('../three/BattlefieldDiorama').then(m => ({ default: m.BattlefieldDiorama })))
// ...
<Suspense fallback={<div style={{ width: '100%', aspectRatio: '1/1' }} />}>
  <BattlefieldDiorama />
</Suspense>
```

- [ ] **Step 3: Manual check + commit**

Run: `npm run dev` → the right column shows a slowly rotating, floating hex battlefield with towers/castle under a gold spotlight.
```bash
git add -A
git commit -m "feat(trench-royale): R3F floating battlefield diorama in hero

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 — Roster section

### Task 4.1: Roster data + section

**Files:**
- Create: `src/landing/data.ts`
- Create: `src/landing/sections/Divider.tsx`
- Create: `src/landing/sections/Roster.tsx`
- Modify: `src/landing/Landing.tsx`

- [ ] **Step 1: Create `data.ts` with the roster** (portrait PNGs already exist in `public/assets/3d/portraits/`):
```ts
export type Faction = 'Trader' | 'Jeet'
export interface Commander { id: string; name: string; faction: Faction; portrait: string; flavor: string }

export const ROSTER: Commander[] = [
  { id: 'crimson',  name: 'Crimson',  faction: 'Trader', portrait: '/assets/3d/portraits/crimson.png',  flavor: 'Frontline bruiser. Soaks the lane.' },
  { id: 'vanguard', name: 'Vanguard', faction: 'Trader', portrait: '/assets/3d/portraits/vanguard.png', flavor: 'Shielded advance. Pushes towers.' },
  { id: 'explorer', name: 'Explorer', faction: 'Trader', portrait: '/assets/3d/portraits/explorer.png', flavor: 'Fast scout. First blood specialist.' },
  { id: 'phoenix',  name: 'Phoenix',  faction: 'Trader', portrait: '/assets/3d/portraits/phoenix.png',  flavor: 'Reborn on death. Tempo swing.' },
  { id: 'pepe',     name: 'Pepe',     faction: 'Jeet',   portrait: '/assets/3d/portraits/pepe.png',     flavor: 'Meme swarm. Overwhelms cheap.' },
  { id: 'degen',    name: 'Degen',    faction: 'Jeet',   portrait: '/assets/3d/portraits/degen.png',    flavor: 'High roll. Burst then dump.' },
  { id: 'bluemob',  name: 'Blue Mob', faction: 'Jeet',   portrait: '/assets/3d/portraits/bluemob.png',  flavor: 'Numbers game. Endless pressure.' },
]
```

- [ ] **Step 2: Create `Divider.tsx`** (reusable numbered section header):
```tsx
export function Divider({ numeral, label }: { numeral: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, maxWidth: 1280, margin: '0 auto', padding: '64px 32px 8px' }}>
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', fontSize: 14, letterSpacing: '0.3em' }}>{numeral}</span>
      <span style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(212,161,60,0.5), transparent)' }} />
      <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</h2>
    </div>
  )
}
```

- [ ] **Step 3: Create `Roster.tsx`** using vendored `TiltedCard`:
```tsx
import { ROSTER } from '../data'
import { Divider } from './Divider'

export function Roster() {
  return (
    <section id="roster">
      <Divider numeral="I" label="The Roster" />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 48px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {ROSTER.map(c => (
          <div key={c.id} style={{ border: '1px solid rgba(212,161,60,0.18)', borderRadius: 18, overflow: 'hidden',
            background: 'linear-gradient(180deg, var(--color-panel), #0a0c11)' }}>
            <div style={{ background: 'radial-gradient(circle at 50% 30%, rgba(212,161,60,0.16), transparent 60%)', padding: 16 }}>
              <img src={c.portrait} alt={c.name} style={{ width: '100%', height: 200, objectFit: 'contain',
                filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))' }} />
            </div>
            <div style={{ padding: '12px 16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 18 }}>{c.name}</h3>
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em',
                  color: c.faction === 'Trader' ? 'var(--color-trader)' : 'var(--color-jeet)' }}>{c.faction}</span>
              </div>
              <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 6 }}>{c.flavor}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```
> Optionally wrap each card in vendored `TiltedCard` for the 3D tilt; verify its required props (often `imageSrc`/children) before using. The plain version above is the guaranteed-working baseline.

- [ ] **Step 4: Render Roster in `Landing.tsx`** below `<Hero/>` and commit:
```bash
git add -A
git commit -m "feat(trench-royale): roster section with 7 commanders

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 5 — How It Works

### Task 5.1: Steps data + section

**Files:**
- Modify: `src/landing/data.ts`
- Create: `src/landing/sections/HowItWorks.tsx`
- Modify: `src/landing/Landing.tsx`

- [ ] **Step 1: Append steps to `data.ts`**
```ts
export interface Step { n: string; title: string; body: string }
export const STEPS: Step[] = [
  { n: '01', title: 'Build your deck', body: 'Draft commanders and cards into a battle deck.' },
  { n: '02', title: 'Deploy down the lanes', body: 'Spend elixir to send units into the trench.' },
  { n: '03', title: 'Destroy their towers', body: 'Break the enemy line before the timer ends.' },
  { n: '04', title: 'Climb the ladder', body: 'Win-gated unlocks and ELO across five tiers.' },
]
```

- [ ] **Step 2: Create `HowItWorks.tsx`**
```tsx
import { STEPS } from '../data'
import { Divider } from './Divider'

export function HowItWorks() {
  return (
    <section id="how">
      <Divider numeral="II" label="How It Works" />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 48px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {STEPS.map(s => (
          <div key={s.n} style={{ borderTop: '2px solid var(--color-gold)', padding: '18px 4px' }}>
            <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', fontSize: 28, fontWeight: 900 }}>{s.n}</div>
            <h3 style={{ fontSize: 18, margin: '8px 0' }}>{s.title}</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Render in `Landing.tsx` + commit**
```bash
git add -A
git commit -m "feat(trench-royale): how-it-works section

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 6 — Mechanics

### Task 6.1: Mechanics data + bento section

**Files:**
- Modify: `src/landing/data.ts`
- Create: `src/landing/sections/Mechanics.tsx`
- Modify: `src/landing/Landing.tsx`

- [ ] **Step 1: Append mechanics to `data.ts`**
```ts
export interface Mechanic { title: string; body: string; span?: boolean }
export const MECHANICS: Mechanic[] = [
  { title: 'Elixir economy', body: 'Resource regenerates over time — spend smart, punish overextension.', span: true },
  { title: 'Multi-lane combat', body: 'Commit and rotate across lanes to break the line.' },
  { title: 'Spell VFX & damage numbers', body: 'Readable feedback on every hit and AoE.' },
  { title: 'Six core mechanics', body: 'Charge, shield, splash, swarm, snipe, revive.' },
  { title: 'Card progression', body: 'Win-gated unlocks deepen your deck over the ladder.', span: true },
]
```

- [ ] **Step 2: Create `Mechanics.tsx`** (bento-style grid using `SpotlightCard`):
```tsx
import SpotlightCard from '../reactbits/SpotlightCard'
import { MECHANICS } from '../data'
import { Divider } from './Divider'

export function Mechanics() {
  return (
    <section id="mechanics">
      <Divider numeral="III" label="Mechanics" />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 48px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="tr-bento">
        {MECHANICS.map((m, i) => (
          <SpotlightCard key={i} className="tr-bento-cell"
            style={{ gridColumn: m.span ? 'span 2' : 'span 1', background: 'var(--color-panel)',
              border: '1px solid rgba(212,161,60,0.16)', borderRadius: 18, padding: 22 } as any}
            spotlightColor="rgba(212,161,60,0.25)">
            <h3 style={{ fontSize: 18 }}>{m.title}</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: 14, marginTop: 8 }}>{m.body}</p>
          </SpotlightCard>
        ))}
      </div>
    </section>
  )
}
```
> Verify `SpotlightCard`'s prop names (`spotlightColor`, `className`, children) from the vendored source; adjust if different. Add responsive fallback to `landing.css`:
```css
@media (max-width: 720px) { .tr-bento { grid-template-columns: 1fr !important; } .tr-bento-cell { grid-column: span 1 !important; } }
```

- [ ] **Step 3: Render in `Landing.tsx` + commit**
```bash
git add -A
git commit -m "feat(trench-royale): mechanics bento section

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 7 — Token Economy ($ROYALE)

### Task 7.1: Token model + section

**Files:**
- Modify: `src/landing/data.ts`
- Create: `src/landing/sections/TokenEconomy.tsx`
- Modify: `src/landing/Landing.tsx`

- [ ] **Step 1: Append token model to `data.ts`**
```ts
export interface TokenSplit { label: string; pct: number; color: string; note: string }
export const TOKEN = {
  ticker: '$ROYALE',
  burnedToDate: 1_240_000, // placeholder — wire to real data later
  splits: [
    { label: 'Burned', pct: 50, color: '#ff6a2b', note: 'Removed from supply forever — deflationary.' },
    { label: 'Reward pool', pct: 30, color: '#2bff88', note: 'Paid back to players via ladder rewards.' },
    { label: 'Treasury', pct: 20, color: '#d4a13c', note: 'Funds development and live ops.' },
  ] as TokenSplit[],
}
```

- [ ] **Step 2: Create `TokenEconomy.tsx`** — explains the lootbox→burn loop with a flow + a live burn counter:
```tsx
import CountUp from '../reactbits/CountUp'
import { TOKEN } from '../data'
import { Divider } from './Divider'

export function TokenEconomy() {
  return (
    <section id="economy">
      <Divider numeral="IV" label="Token Economy" />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 56px' }}>
        <p style={{ color: 'var(--color-muted)', maxWidth: 620, fontSize: 17 }}>
          <strong style={{ color: 'var(--color-gold)' }}>{TOKEN.ticker}</strong> is the fuel of the trench.
          Spend it on lootboxes and card packs — every spend routes on-chain, and half is
          <strong style={{ color: 'var(--color-ember)' }}> burned forever</strong>. Supply only shrinks.
        </p>

        {/* Flow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', margin: '28px 0' }}>
          {['Spend $ROYALE on lootbox', 'Routed to burn/treasury contract', '50% burned · 30% rewards · 20% treasury'].map((t, i, arr) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ border: '1px solid rgba(212,161,60,0.35)', borderRadius: 999, padding: '10px 18px',
                background: 'var(--color-panel)', fontSize: 14 }}>{t}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--color-gold)' }}>→</span>}
            </span>
          ))}
        </div>

        {/* Split bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 18, marginTop: 8 }}>
          {TOKEN.splits.map(s => (
            <div key={s.label} style={{ background: 'var(--color-panel)', border: '1px solid rgba(212,161,60,0.14)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: 17 }}>{s.label}</h3>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: s.color }}>{s.pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: '#1a1f29', marginTop: 10, overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color }} />
              </div>
              <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 10 }}>{s.note}</p>
            </div>
          ))}
        </div>

        {/* Burn counter + launch */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', marginTop: 36 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 900, color: 'var(--color-ember)' }}>
              <CountUp to={TOKEN.burnedToDate} separator="," /> 🔥
            </div>
            <div style={{ color: 'var(--color-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              {TOKEN.ticker} burned to date
            </div>
          </div>
          <div style={{ border: '1px solid rgba(212,161,60,0.35)', borderRadius: 16, padding: '16px 22px', background: 'var(--color-panel)' }}>
            <div style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}>Fair launch on pump.fun</div>
            <div style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 4 }}>No presale. No team allocation. Coming soon.</div>
          </div>
        </div>
      </div>
    </section>
  )
}
```
> Verify `CountUp` separator prop name from the vendored source; drop `separator` if unsupported.

- [ ] **Step 3: Render in `Landing.tsx` + commit**
```bash
git add -A
git commit -m "feat(trench-royale): token economy section (lootbox->burn, 50/30/20)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 8 — Nav, Final CTA, Footer, scroll polish

### Task 8.1: Sticky Nav with scroll state

**Files:**
- Create: `src/landing/sections/Nav.tsx`
- Modify: `src/landing/Landing.tsx`

- [ ] **Step 1: Create `Nav.tsx`**
```tsx
import { useEffect, useState } from 'react'

export function Nav({ onPlay }: { onPlay: () => void }) {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px', transition: 'background .3s, border-color .3s',
      background: solid ? 'rgba(7,9,13,0.8)' : 'transparent',
      backdropFilter: solid ? 'blur(10px)' : 'none',
      borderBottom: `1px solid ${solid ? 'rgba(212,161,60,0.18)' : 'transparent'}` }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '0.12em', color: 'var(--color-gold)' }}>
        TRENCH ROYALE
      </span>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }} className="tr-nav-links">
        {[['Roster', 'roster'], ['How It Works', 'how'], ['Mechanics', 'mechanics'], ['Economy', 'economy']].map(([t, id]) => (
          <a key={id} href={`#${id}`} style={{ color: 'var(--color-muted)', fontSize: 14, textDecoration: 'none' }}>{t}</a>
        ))}
        <button onClick={onPlay} style={{ background: 'var(--color-gold)', color: '#0a0c11', border: 'none',
          padding: '9px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>PLAY</button>
      </div>
    </nav>
  )
}
```
Add to `landing.css`: `@media (max-width: 720px){ .tr-nav-links a { display:none; } }`

### Task 8.2: Final CTA + Footer

**Files:**
- Create: `src/landing/sections/FinalCta.tsx`
- Create: `src/landing/sections/Footer.tsx`

- [ ] **Step 1: `FinalCta.tsx`**
```tsx
import StarBorder from '../reactbits/StarBorder'

export function FinalCta({ onPlay }: { onPlay: () => void }) {
  return (
    <section style={{ position: 'relative', textAlign: 'center', padding: '120px 32px',
      background: 'radial-gradient(ellipse at 50% 50%, rgba(212,161,60,0.12), transparent 65%)' }}>
      <h2 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900 }}>ENTER THE TRENCH</h2>
      <p style={{ color: 'var(--color-muted)', margin: '14px auto 28px', maxWidth: 440 }}>
        Traders vs Jeets. Last line standing wins.
      </p>
      <StarBorder as="button" color="#d4a13c" onClick={onPlay}>PLAY NOW</StarBorder>
    </section>
  )
}
```

- [ ] **Step 2: `Footer.tsx`**
```tsx
export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(212,161,60,0.14)', padding: '28px 32px',
      display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, color: 'var(--color-muted)', fontSize: 13 }}>
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}>TRENCH ROYALE</span>
      <span>Traders vs Jeets · {new Date().getFullYear()}</span>
    </footer>
  )
}
```

### Task 8.3: Compose Landing + Lenis smooth scroll + scroll reveals

**Files:**
- Create: `src/landing/useScrollReveal.ts`
- Modify: `src/landing/Landing.tsx`

- [ ] **Step 1: `useScrollReveal.ts`** (GSAP fade/translate on sections):
```ts
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

export function useScrollReveal(rootSelector = '.tr-landing section') {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(rootSelector).forEach(el => {
        gsap.from(el, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 80%' } })
      })
    })
    return () => ctx.revert()
  }, [rootSelector])
}
```

- [ ] **Step 2: Final `Landing.tsx`** wiring Lenis + all sections:
```tsx
import { useEffect } from 'react'
import Lenis from 'lenis'
import { Nav } from './sections/Nav'
import { Hero } from './sections/Hero'
import { Roster } from './sections/Roster'
import { HowItWorks } from './sections/HowItWorks'
import { Mechanics } from './sections/Mechanics'
import { TokenEconomy } from './sections/TokenEconomy'
import { FinalCta } from './sections/FinalCta'
import { Footer } from './sections/Footer'
import { useScrollReveal } from './useScrollReveal'

export function Landing({ onPlay }: { onPlay: () => void }) {
  useScrollReveal()
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis()
    let raf = 0
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); lenis.destroy() }
  }, [])
  return (
    <div className="tr-landing">
      <Nav onPlay={onPlay} />
      <Hero onPlay={onPlay} />
      <Roster />
      <HowItWorks />
      <Mechanics />
      <TokenEconomy />
      <FinalCta onPlay={onPlay} />
      <Footer />
    </div>
  )
}
```

- [ ] **Step 3: Build + manual full-page check**

Run: `npm run build` (expect clean) then `npm run dev` and scroll the whole page: nav goes solid on scroll, sections fade in, smooth scroll feels right, anchor links jump to sections, PLAY (nav, hero, final) all enter the game.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat(trench-royale): nav, final CTA, footer, Lenis + GSAP scroll polish

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 8.4: Final verification + e2e

- [ ] **Step 1: Run the full landing e2e**

Run: `npx playwright test e2e/landing.spec.ts e2e/smoke.spec.ts`
Expected: PASS — landing renders, PLAY enters menu.

- [ ] **Step 2: Run unit tests (ensure rename + migration didn't break sim/game)**

Run: `npm test`
Expected: existing suite still green.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: clean build, no TS errors.

- [ ] **Step 4: Final commit if any fixups**
```bash
git add -A
git commit -m "test(trench-royale): verify landing + rename end-to-end

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Notes (coverage vs spec)

- Rename (26 refs) → Phase 0 ✓ (incl. localStorage migration so progress survives).
- Tailwind v4 preflight-disabled isolation → Task 1.2 ✓.
- App `landing` state, PLAY → existing menu untouched → Task 1.3 ✓.
- DarkVeil hero, text left / 3D right, CTAs, CountUp stats → Phase 2 ✓.
- Floating hex battlefield diorama (KayKit GLTF) → Phase 3 ✓.
- Roster (7 commanders, faction tags) → Phase 4 ✓.
- How It Works (4 steps) → Phase 5 ✓.
- Mechanics bento → Phase 6 ✓.
- Token economy ($ROYALE, lootbox→burn, 50/30/20, burn counter, pump.fun) → Phase 7 ✓.
- Nav + Final CTA + Footer, Lenis + GSAP, reduced-motion, responsive → Phase 8 ✓.
- Vendored-component prop names flagged for verify-on-copy (SplitText/CountUp/StarBorder/SpotlightCard) to avoid type drift.

## Notes / risks
- **Vendored component props:** open each copied React Bits file after Task 2.1 and confirm exact prop names; the Hero/Mechanics/Token tasks flag the props to check.
- **GLTF paths:** confirm `public/assets/3d/kaykit/` filenames before wiring the diorama (Task 3.1 step 1 note).
- **e2e environment:** if Playwright/backend can't boot here, rely on `npm run build` + `npm test` + manual dev check; the e2e specs are still authored for CI.
- **Out of scope:** live Vercel/Railway project rename; real pump.fun contract + on-chain burn wiring.
