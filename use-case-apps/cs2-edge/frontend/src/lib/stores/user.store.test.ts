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
      id: "uuid-1",
      steamId: "76561198000000001",
      steamName: "TestPlayer",
      avatar: "https://example.com/avatar.jpg",
    });
    const state = useUserStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.steamName).toBe("TestPlayer");
  });

  test("clearUser resets to unauthenticated", () => {
    useUserStore.getState().setUser({ id: "uuid-2", steamId: "123", steamName: "X", avatar: "" });
    useUserStore.getState().clearUser();
    expect(useUserStore.getState().isAuthenticated).toBe(false);
  });
});
