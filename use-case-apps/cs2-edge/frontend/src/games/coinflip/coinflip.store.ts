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
  setMatched: (game: CoinflipGame) => void;
  setFlipping: () => void;
  setResult: (winnerId: string, game: CoinflipGame) => void;
  reset: () => void;
}

export const useCoinflipStore = create<CoinflipState>((set) => ({
  phase: "idle",
  gameId: null,
  mySide: null,
  game: null,
  winnerId: null,

  setWaiting: (gameId, mySide) => set({ phase: "waiting", gameId, mySide }),
  setMatched: (game) => set({ phase: "matched", game, gameId: game.id }),
  setFlipping: () => set({ phase: "flipping" }),
  setResult: (winnerId, game) => set({ phase: "result", winnerId, game }),
  reset: () => set({ phase: "idle", gameId: null, mySide: null, game: null, winnerId: null }),
}));
