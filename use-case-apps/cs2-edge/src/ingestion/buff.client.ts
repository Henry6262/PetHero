import { z } from "zod";
import type { SkinportItem } from "./types.ts";

const BASE_URL = "https://buff.163.com";

export interface BuffConfig {
  session: string;
  ntesYdSess: string;
  deviceId: string;
  userAgent?: string;
}

export const BuffMarketGoodsSchema = z.object({
  code: z.string(),
  data: z.object({
    items: z.array(z.object({
      id: z.number(),
      market_hash_name: z.string(),
      sell_min_price: z.string(),
      sell_num: z.number(),
    })),
    total_count: z.number(),
  }),
});

export class BuffClient {
  private readonly config: BuffConfig;
  private readonly userAgent: string;

  constructor(config: BuffConfig) {
    this.config = config;
    this.userAgent = config.userAgent ?? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  }

  private getHeaders(): Record<string, string> {
    // Note: In 2026, JA4 fingerprinting is active. Standard fetch might be blocked
    // unless using a proxy with TLS impersonation.
    return {
      "User-Agent": this.userAgent,
      "Cookie": `session=${this.config.session}; NTES_YD_SESS=${this.config.ntesYdSess}; Device-Id=${this.config.deviceId}`,
      "Referer": "https://buff.163.com/market/csgo",
      "Accept": "application/json, text/javascript, */*; q=0.01",
    };
  }

  async getMarketGoods(game = "csgo", pageNum = 1): Promise<SkinportItem[]> {
    const url = `${BASE_URL}/api/market/goods?game=${game}&page_num=${pageNum}`;
    
    // Warning: Standard Bun/Node fetch may trigger Cloudflare 403 due to JA4 fingerprint mismatch.
    // Spec recommends curl-impersonate or curl_cffi.
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Buff API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const parsed = BuffMarketGoodsSchema.parse(data);

    return parsed.data.items.map((item) => ({
      market_hash_name: item.market_hash_name,
      currency: "CNY", // Buff uses CNY
      suggested_price: parseFloat(item.sell_min_price),
      item_page: `https://buff.163.com/market/goods?goods_id=${item.id}`,
      market_page: `https://buff.163.com/market/goods?goods_id=${item.id}`,
      min_price: parseFloat(item.sell_min_price),
      max_price: null,
      mean_price: null,
      median_price: null,
      quantity: item.sell_num,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    }));
  }
}
