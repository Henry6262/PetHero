import { z } from "zod";
import {
  SkinportItemSchema,
  SkinportSalesHistorySchema,
  type SkinportItem,
  type SkinportSalesHistory,
} from "./types.ts";

const BASE_URL = "https://api.skinport.com";
// Skinport requires brotli encoding or returns 406
const DEFAULT_HEADERS = { "Accept-Encoding": "br" };

export class SkinportRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Skinport rate limited. Retry after ${retryAfterSeconds}s`);
    this.name = "SkinportRateLimitError";
  }
}

export class SkinportApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`Skinport API ${status}: ${message}`);
    this.name = "SkinportApiError";
  }
}

async function parseRateLimitRetryAfter(res: Response): Promise<number> {
  const raw = res.headers.get("Retry-After");
  return raw ? parseInt(raw, 10) : 300; // default 5 min if header missing
}

async function handleResponse(res: Response): Promise<unknown> {
  if (res.status === 429) {
    throw new SkinportRateLimitError(await parseRateLimitRetryAfter(res));
  }
  if (!res.ok) {
    throw new SkinportApiError(res.status, res.statusText);
  }
  return res.json();
}

export class SkinportClient {
  private readonly baseUrl: string;

  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getItems(currency = "USD", appId = 730): Promise<SkinportItem[]> {
    const url = `${this.baseUrl}/v1/items?app_id=${appId}&currency=${encodeURIComponent(currency)}&tradable=1`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    const data = await handleResponse(res);
    return z.array(SkinportItemSchema).parse(data);
  }

  async getSalesHistory(
    marketHashName: string,
    currency = "USD",
    appId = 730,
  ): Promise<SkinportSalesHistory[]> {
    const url =
      `${this.baseUrl}/v1/sales/history` +
      `?app_id=${appId}` +
      `&currency=${encodeURIComponent(currency)}` +
      `&market_hash_name=${encodeURIComponent(marketHashName)}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    const data = await handleResponse(res);
    return z.array(SkinportSalesHistorySchema).parse(data);
  }
}
