import { z } from "zod";
import {
  CSFloatListingsResponseSchema,
  type SkinportItem,
} from "./types.ts";

const BASE_URL = "https://csfloat.com/api/v1";

export class CsfloatClient {
  private readonly baseUrl: string;

  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches latest listings from CSFloat and aggregates them into a SkinportItem-like 
   * format for the ingestion service.
   */
  async getItems(): Promise<SkinportItem[]> {
    const url = `${this.baseUrl}/listings?limit=100&type=buy_now&sort_by=lowest_price`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`CSFloat API error: ${res.status} ${res.statusText}`);
    }

    const rawData = await res.json();
    const parsed = CSFloatListingsResponseSchema.parse(rawData);

    // Aggregate individual listings into per-item summaries
    const aggregated = new Map<string, SkinportItem>();

    for (const listing of parsed.data) {
      const name = listing.item.market_hash_name;
      const price = listing.price / 100; // cents to dollars

      const existing = aggregated.get(name);
      if (existing) {
        existing.quantity += 1;
        if (price < (existing.min_price ?? Infinity)) {
          existing.min_price = price;
        }
      } else {
        aggregated.set(name, {
          market_hash_name: name,
          currency: "USD",
          suggested_price: price, // CSFloat doesn't give "suggested" in this view, use price
          item_page: `https://csfloat.com/item/${listing.id}`,
          market_page: `https://csfloat.com/db?name=${encodeURIComponent(name)}`,
          min_price: price,
          max_price: price,
          mean_price: price,
          median_price: price,
          quantity: 1,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }

    return Array.from(aggregated.values());
  }
}
