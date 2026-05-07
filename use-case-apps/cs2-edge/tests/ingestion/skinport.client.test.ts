import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
  SkinportClient,
  SkinportRateLimitError,
  SkinportApiError,
} from "../../src/ingestion/skinport.client.ts";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockItem = {
  market_hash_name: "AK-47 | Redline (Field-Tested)",
  currency: "USD",
  suggested_price: 12.5,
  item_page: "https://skinport.com/item/ak-47-redline-field-tested",
  market_page: "https://skinport.com/market/730",
  min_price: 10.0,
  max_price: 15.0,
  mean_price: 12.3,
  median_price: 12.0,
  quantity: 45,
  created_at: 1620000000,
  updated_at: 1620000001,
  version: null,
};

const mockSalesHistory = {
  market_hash_name: "AK-47 | Redline (Field-Tested)",
  currency: "USD",
  item_page: "https://skinport.com/item/ak-47-redline-field-tested",
  market_page: "https://skinport.com/market/730",
  last_24_hours: { min: 11.0, max: 13.0, avg: 12.0, median: 12.0, volume: 3 },
  last_7_days: { min: 10.5, max: 14.0, avg: 12.2, median: 12.1, volume: 21 },
  last_30_days: { min: 9.0, max: 16.0, avg: 12.5, median: 12.3, volume: 90 },
  last_90_days: { min: 8.0, max: 18.0, avg: 13.0, median: 12.8, volume: 270 },
};

function makeFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  return mock(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
      }),
    ),
  ) as unknown as typeof globalThis.fetch;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SkinportClient.getItems", () => {
  let client: SkinportClient;

  beforeEach(() => {
    client = new SkinportClient("http://mock.skinport.test");
  });

  test("returns parsed items on 200", async () => {
    globalThis.fetch = makeFetch(200, [mockItem]);
    const items = await client.getItems();
    expect(items).toHaveLength(1);
    expect(items[0]?.market_hash_name).toBe("AK-47 | Redline (Field-Tested)");
    expect(items[0]?.min_price).toBe(10.0);
    expect(items[0]?.quantity).toBe(45);
  });

  test("accepts nullable price fields", async () => {
    const nullPriceItem = { ...mockItem, min_price: null, max_price: null, median_price: null };
    globalThis.fetch = makeFetch(200, [nullPriceItem]);
    const items = await client.getItems();
    expect(items[0]?.min_price).toBeNull();
  });

  test("returns empty array when API returns []", async () => {
    globalThis.fetch = makeFetch(200, []);
    const items = await client.getItems();
    expect(items).toHaveLength(0);
  });

  test("throws SkinportRateLimitError on 429 with Retry-After header", async () => {
    globalThis.fetch = makeFetch(429, {}, { "Retry-After": "120" });
    await expect(client.getItems()).rejects.toBeInstanceOf(SkinportRateLimitError);
  });

  test("SkinportRateLimitError carries retryAfterSeconds", async () => {
    globalThis.fetch = makeFetch(429, {}, { "Retry-After": "60" });
    try {
      await client.getItems();
    } catch (e) {
      expect(e).toBeInstanceOf(SkinportRateLimitError);
      expect((e as SkinportRateLimitError).retryAfterSeconds).toBe(60);
    }
  });

  test("uses default 300s retry when Retry-After header missing on 429", async () => {
    globalThis.fetch = makeFetch(429, {});
    try {
      await client.getItems();
    } catch (e) {
      expect(e).toBeInstanceOf(SkinportRateLimitError);
      expect((e as SkinportRateLimitError).retryAfterSeconds).toBe(300);
    }
  });

  test("throws SkinportApiError on 500", async () => {
    globalThis.fetch = makeFetch(500, { error: "internal" });
    await expect(client.getItems()).rejects.toBeInstanceOf(SkinportApiError);
  });

  test("SkinportApiError carries status code", async () => {
    globalThis.fetch = makeFetch(503, {});
    try {
      await client.getItems();
    } catch (e) {
      expect(e).toBeInstanceOf(SkinportApiError);
      expect((e as SkinportApiError).status).toBe(503);
    }
  });

  test("throws on malformed item missing required field", async () => {
    const bad = { ...mockItem };
    // @ts-expect-error intentionally removing required field
    delete bad.market_hash_name;
    globalThis.fetch = makeFetch(200, [bad]);
    await expect(client.getItems()).rejects.toThrow();
  });
});

describe("SkinportClient.getSalesHistory", () => {
  let client: SkinportClient;

  beforeEach(() => {
    client = new SkinportClient("http://mock.skinport.test");
  });

  test("returns parsed sales history on 200", async () => {
    globalThis.fetch = makeFetch(200, [mockSalesHistory]);
    const result = await client.getSalesHistory("AK-47 | Redline (Field-Tested)");
    expect(result).toHaveLength(1);
    expect(result[0]?.market_hash_name).toBe("AK-47 | Redline (Field-Tested)");
    expect(result[0]?.last_24_hours.volume).toBe(3);
    expect(result[0]?.last_7_days.median).toBe(12.1);
  });

  test("accepts nullable price fields in LastXDays", async () => {
    const nullEntry = {
      ...mockSalesHistory,
      last_24_hours: { min: null, max: null, avg: null, median: null, volume: 0 },
    };
    globalThis.fetch = makeFetch(200, [nullEntry]);
    const result = await client.getSalesHistory("AK-47 | Redline");
    expect(result[0]?.last_24_hours.min).toBeNull();
  });

  test("throws SkinportRateLimitError on 429", async () => {
    globalThis.fetch = makeFetch(429, {}, { "Retry-After": "300" });
    await expect(
      client.getSalesHistory("AK-47 | Redline (Field-Tested)"),
    ).rejects.toBeInstanceOf(SkinportRateLimitError);
  });

  test("URL-encodes market_hash_name with special chars", async () => {
    let capturedUrl = "";
    globalThis.fetch = mock((url: string) => {
      capturedUrl = url;
      return Promise.resolve(new Response(JSON.stringify([mockSalesHistory]), { status: 200 }));
    }) as unknown as typeof globalThis.fetch;
    await client.getSalesHistory("AK-47 | Redline (Field-Tested)");
    expect(capturedUrl).toContain("AK-47%20%7C%20Redline%20(Field-Tested)");
  });
});
