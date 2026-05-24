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
