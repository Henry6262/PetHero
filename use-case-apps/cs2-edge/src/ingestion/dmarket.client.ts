import nacl from "tweetnacl";
import { decodeUTF8 } from "tweetnacl-util";
import { z } from "zod";
import type { SkinportItem } from "./types.ts";

const BASE_URL = "https://api.dmarket.com";
const CS2_GAME_ID = "a8db";

export interface DmarketConfig {
  publicKey: string;
  privateKey: string;
  baseUrl?: string;
}

export const DmarketBalanceSchema = z.object({
  usd: z.string(), // cents
  dmc: z.string(),
});

export const DmarketMarketItemSchema = z.object({
  itemId: z.string(),
  title: z.string(),
  price: z.object({
    USD: z.string(), // cents
  }),
  image: z.string(),
  extra: z.object({
    tradeLockDuration: z.number().optional(),
  }).optional(),
});

export const DmarketMarketItemsResponseSchema = z.object({
  objects: z.array(DmarketMarketItemSchema),
  cursor: z.string().optional(),
});

export class DmarketClient {
  private readonly publicKey: string;
  private readonly privateKey: Uint8Array;
  private readonly baseUrl: string;
constructor(config: DmarketConfig) {
  this.publicKey = config.publicKey.toLowerCase();
  // DMarket private key is a 64-byte hex string (32-byte seed + 32-byte public key)
  // tweetnacl sign.detached expects the 64-byte secretKey.
  this.privateKey = new Uint8Array(Buffer.from(config.privateKey, "hex"));
  this.baseUrl = config.baseUrl ?? BASE_URL;
}
private generateSignature(method: string, path: string, body: string, timestamp: string): string {
  const message = method + path + body + timestamp;
  const messageUint8 = decodeUTF8(message);

  // DMarket private key string is usually 128 hex chars (64 bytes)
  // Formula: 32-byte Seed + 32-byte Public Key
  // tweetnacl needs the 32-byte seed to reconstruct the keypair
  const seed = this.privateKey.subarray(0, 32);
  const keyPair = nacl.sign.keyPair.fromSeed(seed);
  const signature = nacl.sign.detached(messageUint8, keyPair.secretKey);

  return Buffer.from(signature).toString("hex");
}

private getHeaders(method: string, path: string, body: string = ""): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = this.generateSignature(method, path, body, timestamp);

  const headers: Record<string, string> = {
    "X-Api-Key": this.publicKey,
    "X-Sign-Date": timestamp,
    "X-Request-Sign": `dmar ed25519 ${signature}`,
  };

  if (body || method === "POST" || method === "PATCH") {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}


  async getBalance(): Promise<{ usdCents: number }> {
    const path = "/account/v1/balance";
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: this.getHeaders("GET", path),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`DMarket Balance API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const parsed = DmarketBalanceSchema.parse(data);
    return { usdCents: parseInt(parsed.usd, 10) };
  }

  /**
   * Discovery endpoint: List items available for purchase.
   */
  async getMarketItems(limit = 100, cursor?: string): Promise<{ items: SkinportItem[]; cursor?: string }> {
    let path = `/exchange/v1/market/items?gameId=${CS2_GAME_ID}&limit=${limit}&currency=USD`;
    if (cursor) {
      path += `&cursor=${encodeURIComponent(cursor)}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: this.getHeaders("GET", path),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`DMarket Market Items API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const parsed = DmarketMarketItemsResponseSchema.parse(data);

    const aggregated = new Map<string, SkinportItem>();

    for (const obj of parsed.objects) {
      const priceUsd = parseFloat(obj.price.USD) / 100;
      const existing = aggregated.get(obj.title);
      
      if (existing) {
        existing.quantity += 1;
        if (priceUsd < (existing.min_price ?? Infinity)) {
          existing.min_price = priceUsd;
        }
      } else {
        aggregated.set(obj.title, {
          market_hash_name: obj.title,
          currency: "USD",
          suggested_price: priceUsd,
          item_page: `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(obj.title)}`,
          market_page: `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(obj.title)}`,
          min_price: priceUsd,
          max_price: null,
          mean_price: null,
          median_price: null,
          quantity: 1,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        });
      }
    }

    return { items: Array.from(aggregated.values()), cursor: parsed.cursor };
  }
}
