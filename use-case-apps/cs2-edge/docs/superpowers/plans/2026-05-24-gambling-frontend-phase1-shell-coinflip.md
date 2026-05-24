# CS2 Gambling Frontend — Phase 1: Shell + Coinflip

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dark-themed gambling shell (collapsible sidebar, routing) and the full coinflip experience (2D lobby + full-screen 3D flip animation with GSAP + R3F) as the first shippable milestone.

**Architecture:** Extend `cs2-edge/frontend` (Vite + React 19 + TypeScript + Tailwind v3). Add react-router-dom for routing, R3F + GSAP for the 3D coin animation, Zustand for state, and a WebSocket endpoint on the Hono backend so the frontend receives match-found and result events in real time. The coin renders as a CylinderGeometry placeholder until the GLB asset is delivered.

**Tech Stack:** React 19, Vite 8, TypeScript, Tailwind v3, react-router-dom v6, @react-three/fiber, @react-three/drei, @react-three/postprocessing, gsap, wawa-vfx, zustand, hono/bun WebSocket, bun test

---

## Scope Note

This plan covers **Phase 1 only**: shell + coinflip. Crash, cases, plinko, roulette, and blackjack each get a separate plan after this ships.

---

## File Map

**Backend (new/modified):**
- Create: `src/betting/coinflip.ws.ts` — module-level WS connection registry + event emitter
- Modify: `src/api/api.server.ts` — add `/ws/coinflip` upgrade route via `createBunWebSocket`
- Modify: `src/index.ts` — pass `websocket` handler to `Bun.serve`
- Modify: `src/betting/coinflip.service.ts` — call `coinflipWs.notifyMatched` + `notifyResult` on `joinGame`

**Frontend (new/modified):**
- Modify: `frontend/src/index.css` — replace light theme CSS vars with dark casino tokens
- Modify: `frontend/tailwind.config.js` — add `casino` color palette + grainy background utility
- Modify: `frontend/src/main.tsx` — wrap app in `<BrowserRouter>`, set `dark` class on `<html>`
- Create: `frontend/src/router.tsx` — all route definitions
- Modify: `frontend/src/App.tsx` — shell layout: sidebar + `<Outlet>` + matchmaking banner portal
- Create: `frontend/src/components/shell/Sidebar.tsx` — 60px collapsed / 220px expanded on hover
- Create: `frontend/src/components/shell/MatchmakingBanner.tsx` — fixed-bottom persistent wait indicator
- Create: `frontend/src/lib/api.ts` — typed fetch helpers for all endpoints used in Phase 1
- Create: `frontend/src/lib/socket.ts` — singleton WS connection, `onMessage` dispatcher
- Create: `frontend/src/lib/stores/user.store.ts` — Zustand: steamId, steamName, avatar, isAuthenticated
- Create: `frontend/src/lib/stores/wallet.store.ts` — Zustand: balance, fetchBalance
- Create: `frontend/src/games/coinflip/coinflip.store.ts` — Zustand: phase, gameId, players, result
- Create: `frontend/src/games/coinflip/CoinflipPage.tsx` — 2D lobby: create game form, open games list, history
- Create: `frontend/src/games/coinflip/CoinflipScene.tsx` — R3F canvas, EffectComposer, environment, scene orchestration
- Create: `frontend/src/games/coinflip/Coin.tsx` — CylinderGeometry coin + GSAP 4-phase animation
- Create: `frontend/src/games/coinflip/PlayerCard.tsx` — `<Html>` DOM overlay anchored inside R3F canvas

**Tests:**
- Create: `frontend/src/lib/stores/user.store.test.ts`
- Create: `frontend/src/lib/stores/wallet.store.test.ts`
- Create: `frontend/src/games/coinflip/coinflip.store.test.ts`
- Create: `frontend/src/lib/api.test.ts`

---

## Task 1: Backend — WebSocket connection manager

**Files:**
- Create: `src/betting/coinflip.ws.ts`

- [ ] **Step 1.1: Create the WS manager**

```ts
// src/betting/coinflip.ws.ts
import type { WSContext } from "hono/ws";

const connections = new Map<string, WSContext>();

export const coinflipWs = {
  register(userId: string, ws: WSContext) {
    connections.set(userId, ws);
  },
  unregister(userId: string) {
    connections.delete(userId);
  },
  notifyMatched(creatorId: string, joinerId: string, game: object) {
    const msg = JSON.stringify({ type: "coinflip:matched", game });
    connections.get(creatorId)?.send(msg);
    connections.get(joinerId)?.send(msg);
  },
  notifyResult(
    creatorId: string,
    joinerId: string,
    payload: { winnerId: string; game: object }
  ) {
    const msg = JSON.stringify({ type: "coinflip:result", ...payload });
    connections.get(creatorId)?.send(msg);
    connections.get(joinerId)?.send(msg);
  },
};
```

- [ ] **Step 1.2: Commit**

```bash
git add src/betting/coinflip.ws.ts
git commit -m "feat: add coinflip WebSocket connection manager"
```

---

## Task 2: Backend — WebSocket route + Bun.serve integration

**Files:**
- Modify: `src/api/api.server.ts`
- Modify: `src/index.ts`

- [ ] **Step 2.1: Add the WS upgrade route to `api.server.ts`**

Add at the top of `api.server.ts`:
```ts
import { createBunWebSocket } from "hono/bun";
import { coinflipWs } from "../betting/coinflip.ws.ts";

const { upgradeWebSocket, websocket } = createBunWebSocket();
export { websocket };
```

Add inside `createApp`, before `return app`:
```ts
app.get(
  "/ws/coinflip",
  upgradeWebSocket((c) => {
    let userId: string | null = null;
    return {
      onOpen(_, ws) {
        // userId is sent as first message after connect
      },
      onMessage(event, ws) {
        try {
          const data = JSON.parse(event.data.toString()) as { type: string; userId?: string };
          if (data.type === "auth" && data.userId) {
            userId = data.userId;
            coinflipWs.register(userId, ws);
          }
        } catch {
          // ignore malformed messages
        }
      },
      onClose() {
        if (userId) coinflipWs.unregister(userId);
      },
    };
  })
);
```

- [ ] **Step 2.2: Pass the `websocket` handler to `Bun.serve` in `src/index.ts`**

Change the `Bun.serve` call (currently at the bottom of `index.ts`) from:
```ts
Bun.serve({
  port: PORT,
  fetch: app.fetch,
});
```
To:
```ts
import { websocket } from "./api/api.server.ts";

Bun.serve({
  port: PORT,
  fetch: app.fetch,
  websocket,
});
```

- [ ] **Step 2.3: Verify the server starts without errors**

```bash
cd use-case-apps/cs2-edge && bun run src/index.ts 2>&1 | head -5
```

Expected output includes: `[cs2-edge] API listening on http://localhost:3000`

- [ ] **Step 2.4: Commit**

```bash
git add src/api/api.server.ts src/index.ts
git commit -m "feat: add /ws/coinflip WebSocket upgrade endpoint"
```

---

## Task 3: Backend — emit WS events from CoinflipService.joinGame

**Files:**
- Modify: `src/betting/coinflip.service.ts`

- [ ] **Step 3.1: Import `coinflipWs` at the top of `coinflip.service.ts`**

```ts
import { coinflipWs } from "./coinflip.ws.ts";
```

- [ ] **Step 3.2: After the game resolves in `joinGame`, emit the events**

Find the `joinGame` method. After the `$transaction` that calls `resolveGame` (or sets winner/status), add:

```ts
// after transaction resolves and winnerId is known
const fullGame = await this.prisma.coinflipGame.findUnique({
  where: { id: gameId },
  include: {
    creator: { select: { steamName: true, avatarUrl: true } },
    joiner:  { select: { steamName: true, avatarUrl: true } },
    winner:  { select: { steamName: true } },
  },
});

if (fullGame && fullGame.winnerId) {
  coinflipWs.notifyMatched(game.creatorId, joinerId, fullGame);
  // small delay so client can mount the scene before result fires
  setTimeout(() => {
    coinflipWs.notifyResult(game.creatorId, joinerId, {
      winnerId: fullGame.winnerId!,
      game: fullGame,
    });
  }, 4500); // matches animation duration in the frontend
}
```

- [ ] **Step 3.3: Commit**

```bash
git add src/betting/coinflip.service.ts
git commit -m "feat: emit WS match + result events from coinflip joinGame"
```

---

## Task 4: Frontend — install dependencies

**Files:**
- Modify: `frontend/package.json` (via bun install)

- [ ] **Step 4.1: Install all new packages**

```bash
cd use-case-apps/cs2-edge/frontend && bun add \
  react-router-dom \
  three \
  @react-three/fiber \
  @react-three/drei \
  @react-three/postprocessing \
  gsap \
  wawa-vfx \
  zustand
```

- [ ] **Step 4.2: Install type definitions**

```bash
bun add -d @types/three
```

- [ ] **Step 4.3: Verify no peer dep errors**

```bash
bun install 2>&1 | grep -i "error\|warn" | head -10
```

Expected: no errors. Warnings about peer deps are fine.

- [ ] **Step 4.4: Commit**

```bash
git add frontend/package.json frontend/bun.lock
git commit -m "chore: install R3F, GSAP, wawa-vfx, zustand, react-router-dom"
```

---

## Task 5: Frontend — configure bun test

**Files:**
- Create: `frontend/bunfig.toml`

- [ ] **Step 5.1: Create `frontend/bunfig.toml`**

```toml
[test]
preload = []
```

- [ ] **Step 5.2: Verify bun test runs**

```bash
cd use-case-apps/cs2-edge/frontend && bun test 2>&1 | head -5
```

Expected: `0 tests` or similar — no crash.

- [ ] **Step 5.3: Commit**

```bash
git add frontend/bunfig.toml
git commit -m "chore: configure bun test for frontend"
```

---

## Task 6: Frontend — dark casino theme

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 6.1: Replace `frontend/src/index.css` entirely**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 210 17% 95%;
    --card: 0 0% 6%;
    --card-foreground: 210 17% 95%;
    --popover: 0 0% 6%;
    --popover-foreground: 210 17% 95%;
    --primary: 38 92% 50%;
    --primary-foreground: 0 0% 4%;
    --secondary: 0 0% 10%;
    --secondary-foreground: 210 17% 95%;
    --muted: 0 0% 10%;
    --muted-foreground: 215 14% 45%;
    --accent: 38 63% 35%;
    --accent-foreground: 210 17% 95%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 17% 95%;
    --border: 0 0% 14%;
    --input: 0 0% 14%;
    --ring: 38 92% 50%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  html {
    @apply dark;
  }
  body {
    background-color: #0a0a0a;
    @apply text-foreground;
    font-family: 'Inter', system-ui, sans-serif;
  }
}

/* Grainy texture overlay — applied to .grain-panel elements */
@layer utilities {
  .grain-panel {
    position: relative;
    isolation: isolate;
  }
  .grain-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.05;
    pointer-events: none;
    z-index: 0;
  }
  .grain-panel > * {
    position: relative;
    z-index: 1;
  }

  /* Gold glow utilities */
  .glow-gold {
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.3), 0 0 0 1px rgba(245, 158, 11, 0.2);
  }
  .glow-gold-strong {
    box-shadow: 0 0 32px rgba(245, 158, 11, 0.5), 0 0 0 1px rgba(245, 158, 11, 0.4);
  }

  /* Win / lose balance delta animation */
  @keyframes float-up {
    0%   { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-48px); }
  }
  .animate-float-up {
    animation: float-up 1.6s ease-out forwards;
  }
}
```

- [ ] **Step 6.2: Replace `frontend/tailwind.config.js` entirely**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem" },
    extend: {
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Casino-specific tokens
        casino: {
          bg:         "#0a0a0a",
          surface:    "#111111",
          border:     "#1c1c1c",
          gold:       "#f59e0b",
          "gold-dim": "#b8860b",
          win:        "#22c55e",
          lose:       "#ef4444",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

- [ ] **Step 6.3: Start dev server and verify dark background renders**

```bash
cd use-case-apps/cs2-edge/frontend && bun run dev
```

Open `http://localhost:5173`. Expect: dark `#0a0a0a` background (existing trading dashboard will now be dark-themed).

- [ ] **Step 6.4: Commit**

```bash
git add frontend/src/index.css frontend/tailwind.config.js
git commit -m "feat: dark casino theme — CSS vars + Tailwind casino tokens"
```

---

## Task 7: Frontend — Zustand stores (user + wallet)

**Files:**
- Create: `frontend/src/lib/stores/user.store.ts`
- Create: `frontend/src/lib/stores/wallet.store.ts`
- Create: `frontend/src/lib/stores/user.store.test.ts`
- Create: `frontend/src/lib/stores/wallet.store.test.ts`

- [ ] **Step 7.1: Write failing test for userStore**

```ts
// frontend/src/lib/stores/user.store.test.ts
import { describe, test, expect, beforeEach } from "bun:test";

// Reset module between tests so store starts fresh
let useUserStore: typeof import("./user.store").useUserStore;
beforeEach(async () => {
  const mod = await import("./user.store?t=" + Date.now());
  useUserStore = mod.useUserStore;
});

describe("userStore", () => {
  test("starts unauthenticated", () => {
    const state = useUserStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.steamId).toBeNull();
  });

  test("setUser marks authenticated", () => {
    useUserStore.getState().setUser({
      steamId: "76561198000000001",
      steamName: "TestPlayer",
      avatar: "https://example.com/avatar.jpg",
    });
    const state = useUserStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.steamName).toBe("TestPlayer");
  });

  test("clearUser resets to unauthenticated", () => {
    useUserStore.getState().setUser({ steamId: "123", steamName: "X", avatar: "" });
    useUserStore.getState().clearUser();
    expect(useUserStore.getState().isAuthenticated).toBe(false);
  });
});
```

- [ ] **Step 7.2: Run test — expect it to fail**

```bash
cd use-case-apps/cs2-edge/frontend && bun test src/lib/stores/user.store.test.ts
```

Expected: error — module not found.

- [ ] **Step 7.3: Create `user.store.ts`**

```ts
// frontend/src/lib/stores/user.store.ts
import { create } from "zustand";

interface UserState {
  id: string | null;          // Prisma user UUID — use this to compare winnerId/creatorId
  steamId: string | null;     // Steam 64-bit ID — display only
  steamName: string | null;
  avatar: string | null;
  isAuthenticated: boolean;
  setUser: (user: { id: string; steamId: string; steamName: string; avatar: string }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  id: null,
  steamId: null,
  steamName: null,
  avatar: null,
  isAuthenticated: false,
  setUser: (user) => set({ ...user, isAuthenticated: true }),
  clearUser: () => set({ id: null, steamId: null, steamName: null, avatar: null, isAuthenticated: false }),
}));
```

- [ ] **Step 7.4: Run test — expect pass**

```bash
bun test src/lib/stores/user.store.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 7.5: Write failing test for walletStore**

```ts
// frontend/src/lib/stores/wallet.store.test.ts
import { describe, test, expect, mock, beforeEach } from "bun:test";

let useWalletStore: typeof import("./wallet.store").useWalletStore;
beforeEach(async () => {
  const mod = await import("./wallet.store?t=" + Date.now());
  useWalletStore = mod.useWalletStore;
});

describe("walletStore", () => {
  test("starts with null balance", () => {
    expect(useWalletStore.getState().balance).toBeNull();
  });

  test("setBalance updates balance", () => {
    useWalletStore.getState().setBalance(250.5);
    expect(useWalletStore.getState().balance).toBe(250.5);
  });
});
```

- [ ] **Step 7.6: Run test — expect fail**

```bash
bun test src/lib/stores/wallet.store.test.ts
```

Expected: module not found.

- [ ] **Step 7.7: Create `wallet.store.ts`**

```ts
// frontend/src/lib/stores/wallet.store.ts
import { create } from "zustand";

interface WalletState {
  balance: number | null;
  setBalance: (balance: number) => void;
  fetchBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  setBalance: (balance) => set({ balance }),
  fetchBalance: async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/wallet/balance`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { balance: number };
      set({ balance: data.balance });
    } catch {
      // network error — keep existing balance
    }
  },
}));
```

- [ ] **Step 7.8: Run test — expect pass**

```bash
bun test src/lib/stores/wallet.store.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 7.9: Commit**

```bash
git add frontend/src/lib/stores/
git commit -m "feat: user + wallet Zustand stores with tests"
```

---

## Task 8: Frontend — API helpers

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/api.test.ts`

- [ ] **Step 8.1: Write failing tests for `api.ts`**

```ts
// frontend/src/lib/api.test.ts
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

let api: typeof import("./api");
beforeEach(async () => {
  api = await import("./api?t=" + Date.now());
});

describe("api.getOpenGames", () => {
  test("returns games array on success", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ games: [{ id: "g1" }] }), { status: 200 }))
    ) as unknown as typeof fetch;

    const result = await api.getOpenGames();
    expect(result).toEqual([{ id: "g1" }]);
  });

  test("returns empty array on network error", async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error("network"))) as unknown as typeof fetch;
    const result = await api.getOpenGames();
    expect(result).toEqual([]);
  });
});

describe("api.createGame", () => {
  test("posts correct body", async () => {
    let capturedBody: string | null = null;
    globalThis.fetch = mock((_, opts: RequestInit) => {
      capturedBody = opts.body as string;
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, game: { id: "g2" } }), { status: 201 })
      );
    }) as unknown as typeof fetch;

    await api.createGame({ amount: 25, side: "CT" });
    expect(JSON.parse(capturedBody!)).toEqual({ amount: 25, side: "CT" });
  });
});
```

- [ ] **Step 8.2: Run test — expect fail**

```bash
bun test src/lib/api.test.ts
```

Expected: module not found.

- [ ] **Step 8.3: Create `api.ts`**

```ts
// frontend/src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { credentials: "include" });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function getMe() {
  return get<{ id: string; steamId: string; steamName: string; avatarUrl: string | null }>("/auth/me");
}

// ── Wallet ────────────────────────────────────────────────────────────────────
export async function getBalance() {
  const res = await get<{ balance: number }>("/wallet/balance");
  return res?.balance ?? null;
}

// ── Coinflip ──────────────────────────────────────────────────────────────────
export interface CoinflipGame {
  id: string;
  amount: number;
  creatorSide: "CT" | "T";
  status: string;
  creatorId: string;
  joinerId: string | null;
  winnerId: string | null;
  serverSeedHash: string | null;
  serverSeed: string | null;
  creator: { steamName: string; avatarUrl?: string | null };
  joiner:  { steamName: string; avatarUrl?: string | null } | null;
  winner:  { steamName: string } | null;
}

export async function getOpenGames(): Promise<CoinflipGame[]> {
  const res = await get<{ games: CoinflipGame[] }>("/betting/coinflip/games/open");
  return res?.games ?? [];
}

export async function createGame(body: { amount: number; side: "CT" | "T" }) {
  return post<{ success: boolean; game: CoinflipGame }>("/betting/coinflip/games", body);
}

export async function joinGame(gameId: string) {
  return post<{ success: boolean; game: CoinflipGame }>(`/betting/coinflip/games/${gameId}/join`, {});
}

export async function cancelGame(gameId: string) {
  return post<{ success: boolean }>(`/betting/coinflip/games/${gameId}/cancel`, {});
}

export async function getCoinflipHistory(): Promise<CoinflipGame[]> {
  const res = await get<{ history: CoinflipGame[] }>("/betting/coinflip/history");
  return res?.history ?? [];
}
```

- [ ] **Step 8.4: Run tests — expect pass**

```bash
bun test src/lib/api.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 8.5: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/lib/api.test.ts
git commit -m "feat: typed API helpers with tests"
```

---

## Task 9: Frontend — WebSocket client

**Files:**
- Create: `frontend/src/lib/socket.ts`

- [ ] **Step 9.1: Create `socket.ts`**

```ts
// frontend/src/lib/socket.ts
type MessageHandler = (data: unknown) => void;
const handlers = new Map<string, Set<MessageHandler>>();

let ws: WebSocket | null = null;
let userId: string | null = null;

export function initSocket(uid: string) {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  userId = uid;
  const wsUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000")
    .replace(/^http/, "ws") + "/ws/coinflip";

  ws = new WebSocket(wsUrl);

  ws.addEventListener("open", () => {
    ws!.send(JSON.stringify({ type: "auth", userId: uid }));
  });

  ws.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data as string) as { type: string };
      const set = handlers.get(data.type);
      if (set) set.forEach((fn) => fn(data));
    } catch {
      // ignore
    }
  });

  ws.addEventListener("close", () => {
    // retry after 3s
    setTimeout(() => { if (userId) initSocket(userId); }, 3000);
  });
}

export function closeSocket() {
  ws?.close();
  ws = null;
  userId = null;
}

export function onSocketEvent(type: string, handler: MessageHandler) {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type)!.add(handler);
  return () => handlers.get(type)?.delete(handler); // returns unsubscribe fn
}
```

- [ ] **Step 9.2: Commit**

```bash
git add frontend/src/lib/socket.ts
git commit -m "feat: singleton WebSocket client with event subscription"
```

---

## Task 10: Frontend — coinflip Zustand store

**Files:**
- Create: `frontend/src/games/coinflip/coinflip.store.ts`
- Create: `frontend/src/games/coinflip/coinflip.store.test.ts`

- [ ] **Step 10.1: Write failing tests**

```ts
// frontend/src/games/coinflip/coinflip.store.test.ts
import { describe, test, expect, beforeEach } from "bun:test";

let useCoinflipStore: typeof import("./coinflip.store").useCoinflipStore;
beforeEach(async () => {
  const mod = await import("./coinflip.store?t=" + Date.now());
  useCoinflipStore = mod.useCoinflipStore;
});

describe("coinflipStore", () => {
  test("starts idle with no game", () => {
    const state = useCoinflipStore.getState();
    expect(state.phase).toBe("idle");
    expect(state.gameId).toBeNull();
  });

  test("setWaiting stores gameId and creator side", () => {
    useCoinflipStore.getState().setWaiting("game-abc", "CT");
    const state = useCoinflipStore.getState();
    expect(state.phase).toBe("waiting");
    expect(state.gameId).toBe("game-abc");
    expect(state.mySide).toBe("CT");
  });

  test("setMatched transitions to matched phase", () => {
    const fakeGame = { id: "game-abc" } as never;
    useCoinflipStore.getState().setMatched(fakeGame);
    expect(useCoinflipStore.getState().phase).toBe("matched");
  });

  test("setResult stores winner and transitions to result", () => {
    useCoinflipStore.getState().setResult("winner-id", {} as never);
    const state = useCoinflipStore.getState();
    expect(state.phase).toBe("result");
    expect(state.winnerId).toBe("winner-id");
  });

  test("reset returns to idle", () => {
    useCoinflipStore.getState().setWaiting("g1", "T");
    useCoinflipStore.getState().reset();
    expect(useCoinflipStore.getState().phase).toBe("idle");
    expect(useCoinflipStore.getState().gameId).toBeNull();
  });
});
```

- [ ] **Step 10.2: Run test — expect fail**

```bash
bun test src/games/coinflip/coinflip.store.test.ts
```

Expected: module not found.

- [ ] **Step 10.3: Create `coinflip.store.ts`**

```ts
// frontend/src/games/coinflip/coinflip.store.ts
import { create } from "zustand";
import type { CoinflipGame } from "../../lib/api";

type Phase = "idle" | "waiting" | "matched" | "flipping" | "result";

interface CoinflipState {
  phase: Phase;
  gameId: string | null;
  mySide: "CT" | "T" | null;
  game: CoinflipGame | null;
  winnerId: string | null;

  setWaiting: (gameId: string, mySide: "CT" | "T") => void;
  setMatched:  (game: CoinflipGame) => void;
  setFlipping: () => void;
  setResult:   (winnerId: string, game: CoinflipGame) => void;
  reset:       () => void;
}

export const useCoinflipStore = create<CoinflipState>((set) => ({
  phase:    "idle",
  gameId:   null,
  mySide:   null,
  game:     null,
  winnerId: null,

  setWaiting:  (gameId, mySide) => set({ phase: "waiting", gameId, mySide }),
  setMatched:  (game)           => set({ phase: "matched", game, gameId: game.id }),
  setFlipping: ()               => set({ phase: "flipping" }),
  setResult:   (winnerId, game) => set({ phase: "result", winnerId, game }),
  reset:       ()               => set({ phase: "idle", gameId: null, mySide: null, game: null, winnerId: null }),
}));
```

- [ ] **Step 10.4: Run test — expect pass**

```bash
bun test src/games/coinflip/coinflip.store.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 10.5: Commit**

```bash
git add frontend/src/games/coinflip/
git commit -m "feat: coinflip Zustand store with tests"
```

---

## Task 11: Frontend — Router + shell layout

**Files:**
- Modify: `frontend/src/main.tsx`
- Create: `frontend/src/router.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 11.1: Create `router.tsx`**

```tsx
// frontend/src/router.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const CoinflipPage = lazy(() => import("./games/coinflip/CoinflipPage"));

function GamePlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      {name} — coming soon
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/coinflip" replace />} />
        <Route path="/coinflip" element={<CoinflipPage />} />
        <Route path="/crash"     element={<GamePlaceholder name="Crash" />} />
        <Route path="/cases"     element={<GamePlaceholder name="Cases" />} />
        <Route path="/plinko"    element={<GamePlaceholder name="Plinko" />} />
        <Route path="/roulette"  element={<GamePlaceholder name="Roulette" />} />
        <Route path="/blackjack" element={<GamePlaceholder name="Blackjack" />} />
      </Routes>
    </Suspense>
  );
}
```

- [ ] **Step 11.2: Replace `main.tsx`**

```tsx
// frontend/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 11.3: Replace `App.tsx` with shell layout**

```tsx
// frontend/src/App.tsx
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./components/shell/Sidebar";
import { MatchmakingBanner } from "./components/shell/MatchmakingBanner";
import { AppRouter } from "./router";
import { useUserStore } from "./lib/stores/user.store";
import { useWalletStore } from "./lib/stores/wallet.store";
import { initSocket } from "./lib/socket";
import * as api from "./lib/api";

export default function App() {
  const { setUser, steamId } = useUserStore();
  const { fetchBalance } = useWalletStore();

  useEffect(() => {
    // On mount: check auth + load balance
    api.getMe().then((user) => {
      if (user) {
        setUser({
          id: user.id,
          steamId: user.steamId,
          steamName: user.steamName,
          avatar: user.avatarUrl ?? "",
        });
        fetchBalance();
        initSocket(user.steamId);
      }
    });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-casino-bg">
      <Sidebar />
      <main className="relative flex-1 overflow-auto">
        <AppRouter />
      </main>
      <MatchmakingBanner />
    </div>
  );
}
```

- [ ] **Step 11.4: Verify app compiles**

```bash
cd use-case-apps/cs2-edge/frontend && bun run dev 2>&1 | grep -E "error|Error|ready" | head -10
```

Expected: `ready` with no errors (Sidebar + MatchmakingBanner don't exist yet — that's fine, they're imported but will be created next).

- [ ] **Step 11.5: Commit**

```bash
git add frontend/src/main.tsx frontend/src/router.tsx frontend/src/App.tsx
git commit -m "feat: router + shell layout scaffold"
```

---

## Task 12: Frontend — Sidebar component

**Files:**
- Create: `frontend/src/components/shell/Sidebar.tsx`

- [ ] **Step 12.1: Create `Sidebar.tsx`**

```tsx
// frontend/src/components/shell/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useUserStore } from "../../lib/stores/user.store";
import { useWalletStore } from "../../lib/stores/wallet.store";

const GAMES = [
  { path: "/coinflip",  label: "Coinflip",  icon: "🪙" },
  { path: "/crash",     label: "Crash",     icon: "🚀" },
  { path: "/cases",     label: "Cases",     icon: "📦" },
  { path: "/plinko",    label: "Plinko",    icon: "🎯" },
  { path: "/roulette",  label: "Roulette",  icon: "🎡" },
  { path: "/blackjack", label: "Blackjack", icon: "🃏" },
] as const;

export function Sidebar() {
  const location = useLocation();
  const { steamName, avatar, isAuthenticated } = useUserStore();
  const { balance } = useWalletStore();

  const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  return (
    <aside
      className={cn(
        "group/sidebar flex flex-col justify-between",
        "h-screen w-[60px] hover:w-[220px]",
        "bg-casino-surface border-r border-casino-border",
        "transition-[width] duration-200 ease-out overflow-hidden",
        "shrink-0 z-40"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-casino-border shrink-0">
        <span className="text-xl shrink-0">⚡</span>
        <span className="ml-3 text-sm font-semibold text-foreground opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 whitespace-nowrap">
          CS2 Edge
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-1 overflow-hidden">
        {GAMES.map(({ path, label, icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center h-10 px-3 mx-2 rounded-md",
                "transition-colors duration-150",
                active
                  ? "bg-casino-gold/10 text-casino-gold glow-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <span className="text-base shrink-0 w-5 text-center">{icon}</span>
              <span className="ml-3 text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User / wallet */}
      <div className="border-t border-casino-border p-3 shrink-0">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {avatar && (
              <img src={avatar} alt={steamName ?? ""} className="w-8 h-8 rounded-full shrink-0 border border-casino-border" />
            )}
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{steamName}</p>
              <p className="text-xs text-casino-gold">
                ${balance !== null ? balance.toFixed(2) : "—"}
              </p>
            </div>
          </div>
        ) : (
          <a
            href={`${apiBase}/auth/steam`}
            className={cn(
              "flex items-center h-10 px-3 rounded-md",
              "bg-casino-gold/10 text-casino-gold hover:bg-casino-gold/20",
              "transition-colors duration-150"
            )}
          >
            <span className="text-base shrink-0">🔑</span>
            <span className="ml-3 text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              Login with Steam
            </span>
          </a>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 12.2: Commit**

```bash
git add frontend/src/components/shell/Sidebar.tsx
git commit -m "feat: collapsible sidebar with game nav + wallet"
```

---

## Task 13: Frontend — MatchmakingBanner

**Files:**
- Create: `frontend/src/components/shell/MatchmakingBanner.tsx`

- [ ] **Step 13.1: Create `MatchmakingBanner.tsx`**

```tsx
// frontend/src/components/shell/MatchmakingBanner.tsx
import { createPortal } from "react-dom";
import { useCoinflipStore } from "../../games/coinflip/coinflip.store";
import * as api from "../../lib/api";
import { useWalletStore } from "../../lib/stores/wallet.store";
import { cn } from "../../lib/utils";

export function MatchmakingBanner() {
  const { phase, gameId, mySide, game, reset } = useCoinflipStore();
  const { fetchBalance } = useWalletStore();

  const isWaiting = phase === "waiting";
  if (!isWaiting) return null;

  async function handleCancel() {
    if (!gameId) return;
    await api.cancelGame(gameId);
    await fetchBalance();
    reset();
  }

  return createPortal(
    <div
      className={cn(
        "fixed bottom-0 left-[60px] right-0 z-50",
        "flex items-center justify-between",
        "h-12 px-6",
        "bg-casino-surface border-t border-casino-gold/20",
        "grain-panel"
      )}
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="animate-pulse text-casino-gold">●</span>
        <span className="text-foreground font-medium">
          Waiting for opponent
        </span>
        {game && (
          <span className="text-muted-foreground">
            — ${Number(game.amount).toFixed(2)} · {mySide} side
          </span>
        )}
      </div>
      <button
        onClick={handleCancel}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded border border-casino-border hover:border-foreground/30"
      >
        Cancel
      </button>
    </div>,
    document.body
  );
}
```

- [ ] **Step 13.2: Commit**

```bash
git add frontend/src/components/shell/MatchmakingBanner.tsx
git commit -m "feat: matchmaking banner — persists across routes while waiting"
```

---

## Task 14: Frontend — CoinflipPage (2D lobby)

**Files:**
- Create: `frontend/src/games/coinflip/CoinflipPage.tsx`

- [ ] **Step 14.1: Create `CoinflipPage.tsx`**

```tsx
// frontend/src/games/coinflip/CoinflipPage.tsx
import { useEffect, useState, useRef } from "react";
import * as api from "../../lib/api";
import type { CoinflipGame } from "../../lib/api";
import { useCoinflipStore } from "./coinflip.store";
import { useUserStore } from "../../lib/stores/user.store";
import { useWalletStore } from "../../lib/stores/wallet.store";
import { CoinflipScene } from "./CoinflipScene";
import { cn } from "../../lib/utils";
import { onSocketEvent } from "../../lib/socket";

const QUICK_AMOUNTS = [1, 5, 10, 25, 100];

export default function CoinflipPage() {
  const { phase, setWaiting, setMatched, setResult } = useCoinflipStore();
  const { isAuthenticated, steamId, id: userId } = useUserStore();
  const { fetchBalance } = useWalletStore();
  const [openGames, setOpenGames] = useState<CoinflipGame[]>([]);
  const [history, setHistory] = useState<CoinflipGame[]>([]);
  const [side, setSide] = useState<"CT" | "T">("CT");
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll open games every 5s
  useEffect(() => {
    const refresh = async () => {
      const games = await api.getOpenGames();
      setOpenGames(games);
    };
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  // Load history on mount (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    api.getCoinflipHistory().then(setHistory);
  }, [isAuthenticated]);

  // Subscribe to WS events
  useEffect(() => {
    const unsubMatched = onSocketEvent("coinflip:matched", (raw) => {
      const data = raw as { game: CoinflipGame };
      setMatched(data.game);
    });
    const unsubResult = onSocketEvent("coinflip:result", (raw) => {
      const data = raw as { winnerId: string; game: CoinflipGame };
      setResult(data.winnerId, data.game);
      fetchBalance();
    });
    return () => { unsubMatched(); unsubResult(); };
  }, []);

  async function handleCreate() {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    const res = await api.createGame({ amount, side });
    setLoading(false);
    if (!res?.success) {
      setError("Failed to create game. Check your balance.");
      return;
    }
    fetchBalance();
    setWaiting(res.game.id, side);
  }

  async function handleJoin(game: CoinflipGame) {
    if (!isAuthenticated) return;
    setLoading(true);
    const res = await api.joinGame(game.id);
    setLoading(false);
    if (!res?.success) {
      setError("Failed to join game.");
      return;
    }
    fetchBalance();
    const mySide = game.creatorSide === "CT" ? "T" : "CT";
    setWaiting(game.id, mySide);
  }

  // Show 3D scene when matched/flipping/result
  if (phase === "matched" || phase === "flipping" || phase === "result") {
    return <CoinflipScene />;
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Create game */}
      <section className="grain-panel rounded-xl border border-casino-border bg-casino-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Create Game</h2>

        {/* Side selector */}
        <div className="flex gap-3">
          {(["CT", "T"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={cn(
                "flex-1 h-16 rounded-lg border text-sm font-semibold transition-all",
                side === s
                  ? "border-casino-gold bg-casino-gold/10 text-casino-gold glow-gold"
                  : "border-casino-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              {s === "CT" ? "🛡 Counter-Terrorist" : "💣 Terrorist"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium border transition-colors",
                  amount === a
                    ? "border-casino-gold text-casino-gold bg-casino-gold/10"
                    : "border-casino-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                ${a}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            min={1}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
            className="w-full h-10 px-3 rounded-lg bg-casino-bg border border-casino-border text-foreground text-sm focus:outline-none focus:border-casino-gold/50"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading || !isAuthenticated || phase === "waiting"}
          className={cn(
            "w-full h-11 rounded-lg text-sm font-semibold transition-all",
            "bg-casino-gold text-casino-bg hover:bg-casino-gold-dim",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {!isAuthenticated ? "Login to Play" : loading ? "Creating…" : "Create Game"}
        </button>
      </section>

      {/* Open games */}
      <section className="grain-panel rounded-xl border border-casino-border bg-casino-surface p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Open Games ({openGames.length})
        </h2>

        {openGames.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No open games — be the first to create one.
          </p>
        ) : (
          openGames.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between py-2 border-b border-casino-border last:border-0"
            >
              <div className="flex items-center gap-3">
                {game.creator.avatarUrl && (
                  <img src={game.creator.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-casino-border" />
                )}
                <span className="text-sm text-foreground">{game.creator.steamName}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-casino-bg border border-casino-border text-muted-foreground">
                  {game.creatorSide}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-casino-gold">${Number(game.amount).toFixed(2)}</span>
                <button
                  onClick={() => handleJoin(game)}
                  disabled={loading || !isAuthenticated || game.creatorId === userId || phase === "waiting"}
                  className={cn(
                    "px-4 py-1.5 rounded text-xs font-semibold transition-all",
                    "border border-casino-gold/40 text-casino-gold hover:bg-casino-gold/10 hover:glow-gold",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  Join
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* History */}
      {isAuthenticated && history.length > 0 && (
        <section className="grain-panel rounded-xl border border-casino-border bg-casino-surface p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent Games</h2>
          {history.slice(0, 10).map((game) => {
            const won = game.winnerId === userId;
            return (
              <div key={game.id} className="flex items-center justify-between py-1.5 border-b border-casino-border last:border-0">
                <span className="text-xs text-muted-foreground">
                  vs {game.creatorId === userId ? game.joiner?.steamName : game.creator.steamName}
                </span>
                <span className={cn("text-xs font-semibold", won ? "text-casino-win" : "text-casino-lose")}>
                  {won ? `+$${(Number(game.amount) * 1.96).toFixed(2)}` : `-$${Number(game.amount).toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 14.2: Commit**

```bash
git add frontend/src/games/coinflip/CoinflipPage.tsx
git commit -m "feat: coinflip lobby — create game, open games list, history"
```

---

## Task 15: Frontend — Coin component (placeholder + GSAP animation)

**Files:**
- Create: `frontend/src/games/coinflip/Coin.tsx`

- [ ] **Step 15.1: Create `Coin.tsx`**

The coin is a CylinderGeometry placeholder. CT face = gold, T face = green. When the real GLB asset is provided, replace the geometry with `useGLTF('/assets/coin.glb')` and keep the GSAP animation logic unchanged.

```tsx
// frontend/src/games/coinflip/Coin.tsx
import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export interface CoinHandle {
  playFlip: (winsideCT: boolean) => Promise<void>;
}

interface CoinProps {
  idleSpin?: boolean;
}

export const Coin = forwardRef<CoinHandle, CoinProps>(function Coin({ idleSpin = true }, ref) {
  const groupRef = useRef<THREE.Group>(null!);
  const isFlipping = useRef(false);

  // Idle spin via useFrame
  useFrame((_, delta) => {
    if (!groupRef.current || isFlipping.current) return;
    if (idleSpin) {
      groupRef.current.rotation.y += delta * 0.8;
    }
  });

  useImperativeHandle(ref, () => ({
    playFlip(winsideCT: boolean): Promise<void> {
      return new Promise((resolve) => {
        if (!groupRef.current) { resolve(); return; }
        isFlipping.current = true;

        // target X rotation: 0 = CT face up, Math.PI = T face up
        const targetX = winsideCT ? 0 : Math.PI;

        const tl = gsap.timeline({
          onComplete: () => {
            isFlipping.current = false;
            resolve();
          },
        });

        // Phase 1: arc up
        tl.to(groupRef.current.position, { y: 2.5, duration: 0.35, ease: "power2.out" });
        // Phase 2: arc down (overlapping)
        tl.to(groupRef.current.position, { y: 0, duration: 0.35, ease: "power2.in" }, 0.35);
        // Phase 3: rapid X spin during air (full arc)
        tl.to(groupRef.current.rotation, { x: Math.PI * 14, duration: 0.7, ease: "none" }, 0);
        // Phase 4: slow land on correct face
        tl.to(groupRef.current.rotation, {
          x: Math.PI * 14 + targetX, // preserve full rotation count + land angle
          duration: 0.6,
          ease: "power4.out",
        }, 0.7);
      });
    },
  }));

  return (
    <group ref={groupRef}>
      {/* Coin body */}
      <mesh castShadow>
        <cylinderGeometry args={[1, 1, 0.12, 64]} />
        <meshStandardMaterial color="#d4a017" metalness={1} roughness={0.08} toneMapped={false} />
      </mesh>
      {/* CT face (top, y+ = visible when x=0) */}
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 64]} />
        <meshStandardMaterial color="#c8a600" metalness={0.9} roughness={0.15} toneMapped={false} />
      </mesh>
      {/* T face (bottom, y- = visible when x=PI) */}
      <mesh position={[0, -0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 64]} />
        <meshStandardMaterial color="#8b4513" metalness={0.9} roughness={0.15} toneMapped={false} />
      </mesh>
    </group>
  );
});
```

- [ ] **Step 15.2: Commit**

```bash
git add frontend/src/games/coinflip/Coin.tsx
git commit -m "feat: Coin component — CylinderGeometry placeholder + GSAP 4-phase flip"
```

---

## Task 16: Frontend — PlayerCard component

**Files:**
- Create: `frontend/src/games/coinflip/PlayerCard.tsx`

- [ ] **Step 16.1: Create `PlayerCard.tsx`**

```tsx
// frontend/src/games/coinflip/PlayerCard.tsx
import { Html } from "@react-three/drei";
import { cn } from "../../lib/utils";
import type { CoinflipGame } from "../../lib/api";

interface PlayerCardProps {
  player: { steamName: string; avatarUrl?: string | null } | null;
  side: "CT" | "T";
  amount: number;
  position: [number, number, number];
  isWinner: boolean | null; // null = result not yet known
  isLoser: boolean | null;
}

export function PlayerCard({ player, side, amount, position, isWinner, isLoser }: PlayerCardProps) {
  return (
    <Html position={position} center>
      <div
        className={cn(
          "w-36 rounded-xl border p-3 text-center transition-all duration-500",
          "bg-casino-surface/90 backdrop-blur-md",
          isWinner && "border-casino-gold glow-gold-strong scale-110",
          isLoser  && "border-casino-border opacity-40",
          !isWinner && !isLoser && "border-casino-border"
        )}
      >
        {player?.avatarUrl && (
          <img src={player.avatarUrl} alt="" className="w-10 h-10 rounded-full mx-auto mb-2 border border-casino-border" />
        )}
        <p className="text-xs font-medium text-foreground truncate">{player?.steamName ?? "Waiting…"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{side} side</p>
        <p className="text-sm font-semibold text-casino-gold mt-1">${amount.toFixed(2)}</p>
        {isWinner && (
          <p className="text-xs text-casino-win font-semibold mt-1 animate-float-up">
            +${(amount * 1.96).toFixed(2)}
          </p>
        )}
      </div>
    </Html>
  );
}
```

- [ ] **Step 16.2: Commit**

```bash
git add frontend/src/games/coinflip/PlayerCard.tsx
git commit -m "feat: PlayerCard HTML overlay for R3F coinflip scene"
```

---

## Task 17: Frontend — CoinflipScene (R3F canvas)

**Files:**
- Create: `frontend/src/games/coinflip/CoinflipScene.tsx`

- [ ] **Step 17.1: Create `CoinflipScene.tsx`**

```tsx
// frontend/src/games/coinflip/CoinflipScene.tsx
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useRef, useEffect, useState } from "react";
import { Coin, type CoinHandle } from "./Coin";
import { PlayerCard } from "./PlayerCard";
import { useCoinflipStore } from "./coinflip.store";
import { useUserStore } from "../../lib/stores/user.store";
import { cn } from "../../lib/utils";

export function CoinflipScene() {
  const { phase, game, winnerId, setFlipping, reset } = useCoinflipStore();
  const { steamId } = useUserStore();
  const coinRef = useRef<CoinHandle>(null);
  const [showResult, setShowResult] = useState(false);

  // When matched → start idle spin; when result arrives → trigger flip
  useEffect(() => {
    if (phase === "matched") {
      // Transition to flipping after a dramatic 1.5s pause
      const timer = setTimeout(() => {
        setFlipping();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "flipping" && game && winnerId && coinRef.current) {
      const creatorWon = winnerId === game.creatorId;
      const ctWon = creatorWon
        ? game.creatorSide === "CT"
        : game.creatorSide === "T"; // joiner takes opposite side

      coinRef.current.playFlip(ctWon).then(() => {
        setShowResult(true);
      });
    }
  }, [phase]);

  const creator = game?.creator ?? null;
  const joiner  = game?.joiner  ?? null;
  const amount  = game ? Number(game.amount) : 0;

  const creatorWon = winnerId ? winnerId === game?.creatorId : null;
  const joinerWon  = winnerId ? winnerId !== game?.creatorId : null;

  return (
    <div className="relative w-full h-full bg-casino-bg">
      <Canvas
        camera={{ position: [0, 1, 6], fov: 50 }}
        shadows
        gl={{ antialias: true, toneMapping: 2 /* ACESFilmicToneMapping */ }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <pointLight position={[-3, 3, 3]} intensity={0.8} color="#f59e0b" />

        <Environment preset="night" />

        {/* Coin */}
        <Coin ref={coinRef} idleSpin={phase === "matched"} />

        {/* Player cards */}
        <PlayerCard
          player={creator}
          side={game?.creatorSide ?? "CT"}
          amount={amount}
          position={[-3, 0, 0]}
          isWinner={showResult ? creatorWon : null}
          isLoser={showResult ? !creatorWon : null}
        />
        <PlayerCard
          player={joiner}
          side={game?.creatorSide === "CT" ? "T" : "CT"}
          amount={amount}
          position={[3, 0, 0]}
          isWinner={showResult ? joinerWon : null}
          isLoser={showResult ? !joinerWon : null}
        />

        {/* Post-processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.85} intensity={0.5} mipmapBlur />
          <Vignette offset={0.4} darkness={0.6} />
        </EffectComposer>
      </Canvas>

      {/* Play again overlay */}
      {showResult && (
        <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
          <button
            onClick={reset}
            className={cn(
              "pointer-events-auto",
              "px-8 py-3 rounded-xl text-sm font-semibold",
              "bg-casino-gold text-casino-bg hover:bg-casino-gold-dim",
              "transition-colors shadow-lg"
            )}
          >
            Play Again
          </button>
        </div>
      )}

      {/* VS text */}
      {(phase === "matched" || phase === "flipping") && !showResult && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-4xl font-bold text-white/10 select-none">VS</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 17.2: Commit**

```bash
git add frontend/src/games/coinflip/CoinflipScene.tsx
git commit -m "feat: CoinflipScene — R3F canvas with Bloom, Vignette, GSAP flip"
```

---

## Task 18: Integration smoke test + verify full flow

- [ ] **Step 18.1: Run all store tests**

```bash
cd use-case-apps/cs2-edge/frontend && bun test
```

Expected: all tests pass (user.store, wallet.store, coinflip.store, api).

- [ ] **Step 18.2: Start backend**

```bash
cd use-case-apps/cs2-edge && bun run src/index.ts &
```

Expected: `[cs2-edge] API listening on http://localhost:3000`

- [ ] **Step 18.3: Start frontend**

```bash
cd use-case-apps/cs2-edge/frontend && bun run dev
```

Expected: `ready at http://localhost:5173`

- [ ] **Step 18.4: Verify sidebar renders**

Open `http://localhost:5173`. Confirm:
- Dark `#0a0a0a` background
- Sidebar visible on left, 60px wide
- Hover sidebar → expands to 220px with labels
- Game icons visible for Coinflip, Crash, Cases, Plinko, Roulette, Blackjack
- Clicking each nav item routes to the correct page (most show "coming soon")

- [ ] **Step 18.5: Verify coinflip lobby**

Navigate to `/coinflip`. Confirm:
- Create Game panel visible with CT/T selector and amount picker
- Login with Steam shows if unauthenticated
- Open games list shows (empty is fine)

- [ ] **Step 18.6: Final commit**

```bash
git add -A
git commit -m "feat: CS2 gambling frontend Phase 1 — shell + coinflip complete"
```

---

## Notes for next session

- **Coin GLB asset:** When the GLTF coin model is delivered, replace the `CylinderGeometry` in `Coin.tsx` with:
  ```tsx
  const { scene } = useGLTF('/assets/coin.glb')
  // apply material overrides: metalness=1, roughness=0.08, toneMapped=false
  // keep all GSAP animation logic unchanged
  ```
  Place the `.glb` file at `frontend/public/assets/coin.glb`.

- **Phase 2:** Crash game spec + plan — run `superpowers:brainstorming` when ready.
- **wawa-vfx particle burst:** Add to `CoinflipScene.tsx` after `showResult` triggers — fire a burst emitter at `[0,0,0]` with gold/amber colors. Reference: `wawa-vfx` `VFXEmitter` with `spawnMode="burst"`.
