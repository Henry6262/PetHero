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
