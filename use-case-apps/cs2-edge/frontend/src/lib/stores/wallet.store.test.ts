import { describe, test, expect, beforeEach } from "bun:test";

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
