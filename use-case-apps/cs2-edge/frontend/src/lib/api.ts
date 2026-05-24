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
