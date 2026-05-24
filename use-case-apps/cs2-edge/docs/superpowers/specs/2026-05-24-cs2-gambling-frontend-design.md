# CS2 Gambling Frontend — Design Spec

**Date:** 2026-05-24
**Scope:** Full gambling frontend for cs2-edge — coinflip (first ship), crash, cases, plinko, roulette, blackjack
**Approach:** Extend existing `cs2-edge/frontend` (Vite + React + TypeScript + Tailwind)
**Moat:** 3D-powered key game moments. No competitor uses WebGL for coinflip or plinko — all use CSS. We use React Three Fiber.

---

## 1. Visual Identity

**Theme:** Dark, cinematic, premium. High-end casino meets CS2.

| Token | Value |
|---|---|
| Background | `#0a0a0a` (warm black, NOT blue-tinted) |
| Surface / card | `rgba(255,255,255,0.03)` glass |
| Gold accent | `#f59e0b` / `#b8860b` — borders and glows only, never fills |
| Win state | Gold glow ring + particle burst |
| Text primary | `#f1f5f9` |
| Text muted | `#64748b` |

**Key techniques:**
- **Grainy gradient texture** — SVG `feTurbulence` rasterized to WebP, overlaid at 5-8% opacity on panels. Single highest-ROI technique for "premium cinematic" feel.
- **Glassmorphism** — `backdrop-blur-md`, 1px gold border at 15% opacity on floating cards.
- **Gradient border** — `@property --angle` conic-gradient animation on active/selected game cards.
- **Gold glow on hover/win** — `box-shadow: 0 0 20px rgba(245,158,11,0.3)`.
- **Typography** — Inter for UI copy, a display serif (Playfair Display) for large multiplier numbers.

**Tooling:** `tweakcn` to generate shadcn CSS variables. Aceternity UI for Spotlight + Glow effects on loading states.

---

## 2. Shell Layout

```
┌──┬────────────────────────────────┐
│  │                                │
│ S│         Game Canvas            │
│ i│        (full viewport)         │
│ d│                                │
│ e│                                │
│  ├────────────────────────────────┤
│  │  ⏳ Waiting for opponent... ✕  │  ← matchmaking banner
└──┴────────────────────────────────┘
```

### Left Sidebar
- **Collapsed:** ~60px wide, icons only, always visible.
- **Expanded:** ~220px wide, icons + game labels, on hover.
- **Transition:** `width` CSS transition 200ms ease-out. No JS required.
- **Bottom section:** Steam avatar, wallet balance, settings icon.
- **Games listed:** Coinflip, Crash, Cases, Plinko, Roulette, Blackjack.

### Matchmaking Banner
- Fixed bottom of screen.
- Appears only when user has a pending coinflip game waiting for an opponent.
- Persists across all routes — user can navigate freely while queued.
- Content: game type icon, bet amount, side chosen, elapsed wait time, Cancel button.
- Implemented as a Zustand-driven portal rendered in the root layout.

### Wallet & Auth
- Steam avatar + balance displayed at the bottom of the sidebar (collapsed: avatar only; expanded: avatar + balance).
- Steam OAuth via existing `src/auth/steam-auth.ts`.
- Unauthenticated state: "Login with Steam" button in sidebar bottom slot.

---

## 3. Routing

All routes live inside the existing Vite React app. React Router v6.

```
/              → redirect to /coinflip
/coinflip      → Coinflip lobby + game
/crash         → Crash game
/cases         → Case opening
/plinko        → Plinko board
/roulette      → Roulette (2D)
/blackjack     → Blackjack (2D)
```

Each route renders inside the shell (sidebar always present). The R3F canvas mounts only on routes that need it — not globally.

---

## 4. New Dependencies

| Package | Purpose |
|---|---|
| `react-router-dom` | Client-side routing |
| `@react-three/fiber` | 3D renderer |
| `@react-three/drei` | useGLTF, Trail, Environment, useAnimations |
| `@react-three/postprocessing` | Bloom, Vignette, SelectiveBloom |
| `@react-three/rapier` | Physics engine (Plinko only) |
| `gsap` | Multi-phase animation sequencing |
| `wawa-vfx` | Particle system (coin landing, crash explosion, case reveal) |
| `zustand` | Global game state |
| `three` | Peer dep for R3F |

**No framer-motion-3d** — discontinued, no React 19 support.
**No Sparkles from drei inside moving groups** — known bug (drei #2070), use `wawa-vfx` instead.

---

## 5. State Architecture

Zustand stores. Real-time animation values always go through mutable refs, never React state.

```ts
// coinflipStore
{
  phase: 'idle' | 'waiting' | 'matched' | 'flipping' | 'result'
  gameId: string | null
  players: { creator: Player; joiner: Player } | null
  result: { winner: 'CT' | 'T'; serverSeed: string } | null
}

// crashStore
{
  phase: 'waiting' | 'flying' | 'crashed'
  crashPoint: number | null
  myBet: { amount: number; cashedOut: boolean; cashoutMultiplier: number | null } | null
}
// multiplier lives in a ref, NOT in this store:
// const multiplierRef = useRef(1.0) — written by WS handler, read by useFrame

// walletStore
{
  balance: number
  pendingBets: PendingBet[]
}

// userStore
{
  steamId: string | null
  steamName: string | null
  avatar: string | null
}
```

**WebSocket pattern:**
- Single persistent WS connection established on app mount.
- Incoming events write to Zustand or mutable refs directly — never through React state for animation-critical paths.
- `coinflip:matched` → sets `coinflipStore.phase = 'matched'` → triggers 3D scene mount.
- `coinflip:result` → sets phase + result → fires GSAP timeline.
- `crash:tick` → writes `multiplierRef.current = tick.multiplier` (zero reconciler overhead).

---

## 6. Coinflip — Full Design (First Ship)

### 6.1 Lobby (2D)

Three stacked sections, no 3D:

**Create game:**
- CT / T side selector — two large cards with faction art, gold border on selected.
- Amount input with quick-pick buttons ($1, $5, $10, $25, $100).
- "Create Game" CTA button.

**Open games:**
- Live list of games waiting for opponents.
- Each row: creator Steam avatar, their chosen side, bet amount, "Join" button.
- Gold glow on Join button hover.
- Empty state: "No open games — be the first to create one."

**Recent history:**
- Last 10 resolved flips.
- Winning side icon, amount, timestamp.

### 6.2 Waiting State

User has created a game. The lobby fades to a lighter "waiting" visual — the open game they created is highlighted. The matchmaking banner appears at the bottom of the screen. User can freely navigate to any route. Banner persists.

### 6.3 Match Found → 3D Scene Transition

WebSocket fires `coinflip:matched`. Wherever the user is in the app:
1. A modal-style overlay fades in over the current view ("Match found!").
2. User taps/clicks to enter OR it auto-transitions after 3 seconds.
3. The R3F canvas fades in full-screen. Current route is preserved underneath.

### 6.4 3D Scene Layout

Full-screen R3F canvas. Dark environment (`<Environment preset="night" />`). Two player cards (avatar, username, side, bet amount) anchor left and right of screen as 2D DOM overlays via `<Html>` from drei. The coin occupies the center.

**Post-processing:** `<EffectComposer>` with `<Bloom luminanceThreshold={0.9} intensity={0.4} mipmapBlur />` + `<Vignette offset={0.4} darkness={0.6} />`.

### 6.5 Animation Sequence (GSAP Timeline)

**Phase 1 — Idle (both players present, pre-flip):**
- `useFrame`: `coinRef.current.rotation.y += delta * 0.8` — slow Y-axis idle spin.
- Player cards glow softly. A "VS" text between them.
- Duration: until both players confirmed locked in.

**Phase 2 — Lock-in:**
- Player cards animate a gold border flash (CSS transition).
- Coin idle spin speed ramps up slightly.
- Dramatic 1-second pause.

**Phase 3 — Launch (GSAP Timeline fires):**
```
tl.to(coin.position, { y: 3, duration: 0.4, ease: 'power2.out' })
tl.to(coin.position, { y: 0, duration: 0.4, ease: 'power2.in' }, 0.4)
tl.to(coin.rotation, { x: Math.PI * 14, duration: 0.8, ease: 'none' }, 0)
```

**Phase 4 — Slow land:**
```
tl.to(coin.rotation, { x: targetAngle, duration: 0.7, ease: 'power4.out' }, 0.8)
```
`targetAngle` = 0 for CT face, `Math.PI` for T face.

**Phase 5 — Result:**
- `wawa-vfx` burst emitter fires at coin position (gold/amber particles).
- Bloom intensity briefly surges via GSAP tween on the postprocessing ref.
- Winning player card scales to 1.1x, golden glow ring.
- Losing player card dims to 40% opacity.
- Balance delta floats up from the coin: `+$24.50` (green) or `-$25.00` (red).
- "Play Again" button fades in after 2 seconds.

### 6.6 Coin Asset

User provides a custom GLTF/GLB coin model. Loaded via `useGLTF('/assets/coin.glb')`. Material overrides applied in code:
- `metalness: 1`, `roughness: 0.08`, `envMapIntensity: 2`.
- `toneMapped: false` — required for Bloom to catch the coin edge.
- Emissive intensity briefly pushed to 2.0 at landing for the glow burst.

**Reference repos:**
- `min-hieu/3D-Coin-Flip` — physics arc pattern.
- `remotion-dev/glb-example` — canonical `useGLTF + useAnimations` pattern.
- `d5b94396feba3/3D-Interactive-Coin-ThreeJS` — particle ring shader reference.

---

## 7. Remaining Games — High Level (each gets its own spec)

### Crash
- **3D:** Rocket model (GLTF) ascends via `Math.log(multiplier) * SCALE` mapped with `damp()` in `useFrame`. Background environment transitions: hangar (1x) → clouds (5x) → orbit (50x).
- **Trail:** `<Trail>` from drei (orange→transparent ribbon).
- **Engine glow:** `wawa-vfx` VFXEmitter at rocket nozzle, direction downward.
- **Explosion:** `wawa-vfx` burst + Rapier-scattered pre-fractured mesh pieces.
- **2D:** Recharts line chart + multiplier display + cash-out button.
- **Critical:** Multiplier lives in `useRef`, written by WS, read by `useFrame`. Never `useState`.
- **Visual benchmark:** JetX (SmartSoft) — background environment shift as multiplier climbs.

### Case Opening
- **3D:** GLTF case model with separate lid mesh. Lid lifts via `useSpring` on state toggle. `PointLight` inside case animates intensity 0→8 on open. `three-good-godrays` for volumetric light beam from interior.
- **Scroll strip:** CSS overlay (not WebGL). `transform: translateX()` with `cubic-bezier(0.12, 0, 0.08, 1)` over 7s. 60 items, winner at position ~50.
- **Hero reveal:** R3F canvas, `useSpring` scale-in, `SelectiveBloom` keyed to rarity emissive intensity.
- **Rarity bloom map:** white=0, blue=1.0, purple=1.5, pink=2.0, red=2.5, gold=3.0.
- **Confetti burst:** `ektogamat/r3f-confetti-component` on rare reveals.
- **Reference:** `wrongakram/React-Three-Minecraft-Chest` (lid animation), `leonlarsson/case-sim` (CS2 UI recreation).

### Plinko
- **First R3F + Rapier Plinko in production.** No open-source equivalent exists.
- Peg grid math ported from `AnsonH/plinko-game` (Matter.js reference).
- `InstancedRigidBodies` + `InstancedMesh` for multi-ball at 60fps (handles 100+ balls).
- Thin wall colliders at z=±0.5 to keep balls in board plane (2.5D).
- Emissive flash on collision: `onCollisionEnter` → `emissiveIntensity = 3` → decays via `useFrame`. `toneMapped={false}` + Bloom required.
- Bucket multipliers color-coded: center = cool blue (low), edges = hot red/orange (high).

### Roulette — 2D
Full 2D. Spinning wheel CSS animation or Canvas. No R3F.

### Blackjack — 2D
Full 2D. Card flip CSS animations. No R3F.

---

## 8. File Structure (additions to existing frontend)

```
frontend/src/
  components/
    shell/
      Sidebar.tsx           ← collapsible left nav
      MatchmakingBanner.tsx ← persistent waiting indicator
      WalletDisplay.tsx
    ui/                     ← existing shadcn components
  games/
    coinflip/
      CoinflipPage.tsx      ← lobby (2D)
      CoinflipScene.tsx     ← R3F canvas (3D flip)
      CoinflipStore.ts      ← Zustand store
      Coin.tsx              ← GLTF coin + GSAP animation
      PlayerCard.tsx        ← HTML overlay inside canvas
    crash/
    cases/
    plinko/
    roulette/
    blackjack/
  lib/
    socket.ts               ← single WS connection
    stores/                 ← shared Zustand stores (wallet, user)
  router.tsx                ← React Router config
```

---

## 9. Build Order

1. Shell (Sidebar + routing skeleton + dark theme tokens)
2. Coinflip lobby (2D, wired to backend API)
3. Coinflip 3D scene (coin asset placeholder → real asset when delivered)
4. Matchmaking banner + WS integration
5. Crash (3D rocket + 2D chart)
6. Case opening
7. Plinko
8. Roulette + Blackjack (2D, fastest to build)
