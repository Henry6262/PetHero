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
