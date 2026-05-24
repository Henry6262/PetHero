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
    expect(result).toEqual([{ id: "g1" }] as any);
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
    globalThis.fetch = mock((_: string, opts: RequestInit) => {
      capturedBody = opts.body as string;
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, game: { id: "g2" } }), { status: 201 })
      );
    }) as unknown as typeof fetch;

    await api.createGame({ amount: 25, side: "CT" });
    expect(JSON.parse(capturedBody!)).toEqual({ amount: 25, side: "CT" });
  });
});
