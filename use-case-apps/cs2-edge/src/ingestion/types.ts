import { z } from "zod";

// ─── REST /v1/items ─────────────────────────────────────────────────────────

export const SkinportItemSchema = z.object({
  market_hash_name: z.string(),
  currency: z.string(),
  suggested_price: z.number().nullable(),
  item_page: z.string().url(),
  market_page: z.string().url(),
  min_price: z.number().nullable(),
  max_price: z.number().nullable(),
  mean_price: z.number().nullable(),
  median_price: z.number().nullable(),
  quantity: z.number().int().nonnegative(),
  created_at: z.number().int(),
  updated_at: z.number().int(),
  version: z.string().nullable().optional(),
});

export type SkinportItem = z.infer<typeof SkinportItemSchema>;

// ─── REST /v1/sales/history ──────────────────────────────────────────────────

const LastXDaysSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  avg: z.number().nullable(),
  median: z.number().nullable(),
  volume: z.number().int().nonnegative(),
});

export const SkinportSalesHistorySchema = z.object({
  market_hash_name: z.string(),
  version: z.string().nullable().optional(),
  currency: z.string(),
  item_page: z.string().url(),
  market_page: z.string().url(),
  last_24_hours: LastXDaysSchema,
  last_7_days: LastXDaysSchema,
  last_30_days: LastXDaysSchema,
  last_90_days: LastXDaysSchema,
});

export type SkinportSalesHistory = z.infer<typeof SkinportSalesHistorySchema>;
export type LastXDays = z.infer<typeof LastXDaysSchema>;

// ─── WebSocket sale feed (Socket.IO + msgpack) ────────────────────────────────
// Note: prices in WS events are INTEGER CENTS, not floats like REST endpoints.
// Divide by 100 to get currency unit value.

const StickerSchema = z.object({
  sticker_id: z.string().nullable(),
  wear: z.number().nullable(),
  img: z.string(),
  name: z.string(),
  name_localized: z.string(),
  type: z.string().nullable(),
  type_localized: z.string().nullable(),
  slot: z.number().int(),
  color: z.string().nullable(),
  value: z.string().nullable(),
  slug: z.string().nullable(),
  scale: z.number().nullable(),
  rotation: z.number().nullable(),
  offset_x: z.number().nullable(),
  offset_y: z.number().nullable(),
});

const CharmSchema = z.object({
  name: z.string(),
  name_localized: z.string(),
  img: z.string(),
  pattern: z.number().int(),
  slug: z.string().nullable(),
  value: z.string().nullable(),
});

const TagSchema = z.object({
  name: z.string(),
  name_localized: z.string(),
});

export const SaleFeedSaleSchema = z.object({
  id: z.number().int(),
  saleId: z.number().int(),
  shortId: z.string(),
  appid: z.number().int(),
  marketHashName: z.string(),
  marketName: z.string(),
  // cents — divide by 100 for currency unit value
  salePrice: z.number().int(),
  suggestedPrice: z.number().int(),
  referencePrice: z.number().int(),
  currency: z.string(),
  wear: z.number().nullable(),
  pattern: z.number().int().nullable(),
  lock: z.string().nullable(),
  stattrak: z.boolean(),
  souvenir: z.boolean(),
  rarity: z.string(),
  rarityColor: z.string(),
  exterior: z.string().nullable(),
  type: z.string(),
  stickers: z.array(StickerSchema),
  charms: z.array(CharmSchema),
  tags: z.array(TagSchema),
  fade: z.number().nullable(),
  blue: z.number().nullable(),
  image: z.string(),
  url: z.string(),
});

export const SaleFeedEventSchema = z.object({
  eventType: z.enum(["listed", "sold"]),
  sales: z.array(SaleFeedSaleSchema),
});

export type SaleFeedSale = z.infer<typeof SaleFeedSaleSchema>;
export type SaleFeedEvent = z.infer<typeof SaleFeedEventSchema>;
