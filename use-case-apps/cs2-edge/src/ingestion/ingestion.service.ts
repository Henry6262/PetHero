import { PrismaClient, Marketplace } from "@prisma/client";
import { SkinportClient } from "./skinport.client.ts";
import { CsfloatClient } from "./csfloat.client.ts";
import { DmarketClient } from "./dmarket.client.ts";
import { BuffClient } from "./buff.client.ts";
import { SkinportWsHandler } from "./skinport.ws.ts";
import { BitskinsWsHandler, type BitskinsListedEvent } from "./bitskins.ws.ts";
import { CatalogService } from "../catalog/catalog.service.ts";
import { OpportunityService } from "../opportunities/opportunity.service.ts";
import type { SaleFeedEvent, SkinportItem } from "./types.ts";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes — matches Skinport cache TTL

export interface IngestionServiceOptions {
  currency?: string;
  appId?: number;
  opportunityService?: OpportunityService;
  csfloatClient?: CsfloatClient;
  dmarketClient?: DmarketClient;
  buffClient?: BuffClient;
  bitskinsWs?: BitskinsWsHandler;
}

export class IngestionService {
  private pollTimer: Timer | null = null;
  private readonly currency: string;
  private readonly appId: number;
  private readonly catalog: CatalogService;
  private readonly opportunityService?: OpportunityService;
  private readonly csfloatClient?: CsfloatClient;
  private readonly dmarketClient?: DmarketClient;
  private readonly buffClient?: BuffClient;
  private readonly bitskinsWs?: BitskinsWsHandler;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly skinportClient: SkinportClient,
    private readonly wsHandler: SkinportWsHandler,
    opts: IngestionServiceOptions = {},
  ) {
    this.currency = opts.currency ?? "USD";
    this.appId = opts.appId ?? 730;
    this.catalog = new CatalogService(prisma);
    this.opportunityService = opts.opportunityService;
    this.csfloatClient = opts.csfloatClient;
    this.dmarketClient = opts.dmarketClient;
    this.buffClient = opts.buffClient;
    this.bitskinsWs = opts.bitskinsWs;
  }

  start(): void {
    // Kick off first poll immediately, then every 5 minutes
    void this.poll();
    this.pollTimer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);

    this.wsHandler
      .onEvent(event => void this.handleSaleFeedEvent(event))
      .onError(err => console.error("[ingestion] ws error:", err.message));

    this.wsHandler.connect();

    if (this.bitskinsWs) {
      this.bitskinsWs
        .onListed(event => void this.handleBitskinsListed(event))
        .connect();
    }

    console.log("[ingestion] started — polling every 5 min, ws connected");
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.wsHandler.disconnect();
    this.bitskinsWs?.disconnect();
    console.log("[ingestion] stopped");
  }

  async poll(): Promise<void> {
    console.log("[ingestion] starting multi-marketplace poll ...");
    
    // Poll all enabled marketplaces in parallel
    await Promise.allSettled([
      this.pollMarketplace(Marketplace.SKINPORT, () => this.skinportClient.getItems(this.currency, this.appId)),
      this.csfloatClient ? this.pollMarketplace(Marketplace.CSFLOAT, () => this.csfloatClient!.getItems()) : Promise.resolve(),
      this.dmarketClient ? this.pollMarketplace(Marketplace.DMARKET, () => this.dmarketClient!.getAggregatedPrices().then(res => res.items)) : Promise.resolve(),
      this.buffClient ? this.pollMarketplace(Marketplace.BUFF, () => this.buffClient!.getMarketGoods()) : Promise.resolve(),
    ]);
  }

  private async pollMarketplace(marketplace: Marketplace, fetchItems: () => Promise<SkinportItem[]>): Promise<void> {
    try {
      const items = await fetchItems();
      const upserted = await this.catalog.upsertMany(items);
      const latestSnapshots = await this.getLatestSnapshotMap(marketplace);
      
      const changedItems = items.filter(item => {
        const latest = latestSnapshots.get(item.market_hash_name);
        if (!latest) return true;

        return (
          latest.minPrice !== (item.min_price ?? 0) ||
          latest.medianPrice !== (item.median_price ?? 0) ||
          latest.volume24h !== item.quantity
        );
      });

      if (changedItems.length > 0) {
        await this.prisma.priceSnapshot.createMany({
          data: changedItems.map(item => ({
            itemId: item.market_hash_name,
            marketplace,
            minPrice: item.min_price ?? 0,
            medianPrice: item.median_price ?? 0,
            volume24h: item.quantity,
          })),
        });
      }

      if (this.opportunityService) {
        try {
          await this.opportunityService.scoreAll(marketplace);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[ingestion] opportunity scoring error (${marketplace}): ${msg}`);
        }
      }

      console.log(
        `[ingestion] ${marketplace} poll complete — ${upserted} items, ${changedItems.length}/${items.length} snapshots changed`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ingestion] ${marketplace} poll error: ${msg}`);
    }
  }

  private async getLatestSnapshotMap(marketplace: Marketplace): Promise<Map<string, { minPrice: number; medianPrice: number; volume24h: number }>> {
    const latest = await this.prisma.$queryRaw<
      {
        itemId: string;
        minPrice: string;
        medianPrice: string;
        volume24h: number;
      }[]
    >`
      SELECT DISTINCT ON ("itemId") "itemId", "minPrice", "medianPrice", "volume24h"
      FROM "PriceSnapshot"
      WHERE marketplace = ${marketplace}::"Marketplace"
      ORDER BY "itemId", "snappedAt" DESC
    `;

    return new Map(
      latest.map(row => [
        row.itemId,
        {
          minPrice: Number(row.minPrice),
          medianPrice: Number(row.medianPrice),
          volume24h: row.volume24h,
        },
      ]),
    );
  }

  private async handleSaleFeedEvent(event: SaleFeedEvent): Promise<void> {
    try {
      for (const sale of event.sales) {
        if (sale.appid !== this.appId) continue;

        // Ensure item exists in catalog (minimal record if not yet polled)
        await this.prisma.item.upsert({
          where: { id: sale.marketHashName },
          create: {
            id: sale.marketHashName,
            name: sale.marketHashName,
            type: sale.type,
            rarity: sale.rarity,
          },
          update: {},
        });

        // Cents → currency unit
        const price = sale.salePrice / 100;

        if (event.eventType === "listed") {
          await this.prisma.listing.upsert({
            where: { id: String(sale.saleId) },
            create: {
              id: String(sale.saleId),
              itemId: sale.marketHashName,
              marketplace: Marketplace.SKINPORT,
              price,
              currency: sale.currency,
              floatValue: sale.wear,
              paintSeed: sale.pattern,
              listedAt: new Date(),
            },
            update: { price, floatValue: sale.wear, paintSeed: sale.pattern },
          });
        } else {
          // sold — record sale event + mark listing as sold
          await this.prisma.saleEvent.upsert({
            where: { id: String(sale.saleId) },
            create: {
              id: String(sale.saleId),
              itemId: sale.marketHashName,
              marketplace: Marketplace.SKINPORT,
              price,
              floatValue: sale.wear,
              paintSeed: sale.pattern,
              soldAt: new Date(),
            },
            update: {},
          });

          await this.prisma.listing.updateMany({
            where: { id: String(sale.saleId) },
            data: { state: "SOLD" },
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ingestion] saleFeed handler error: ${msg}`);
    }
  }

  private async handleBitskinsListed(event: BitskinsListedEvent): Promise<void> {
    try {
      const price = parseFloat(event.price);
      console.log(`[ingestion] bitskins realtime: ${event.name} listed at ${price}`);
    } catch (err) {
      console.error("[ingestion] bitskins realtime error:", err);
    }
  }
}
