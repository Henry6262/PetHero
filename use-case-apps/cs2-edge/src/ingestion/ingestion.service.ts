import { PrismaClient, Marketplace } from "@prisma/client";
import { SkinportClient } from "./skinport.client.ts";
import { SkinportWsHandler } from "./skinport.ws.ts";
import { CatalogService } from "../catalog/catalog.service.ts";
import type { SaleFeedEvent } from "./types.ts";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes — matches Skinport cache TTL

export interface IngestionServiceOptions {
  currency?: string;
  appId?: number;
}

export class IngestionService {
  private pollTimer: Timer | null = null;
  private readonly currency: string;
  private readonly appId: number;
  private readonly catalog: CatalogService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly skinportClient: SkinportClient,
    private readonly wsHandler: SkinportWsHandler,
    opts: IngestionServiceOptions = {},
  ) {
    this.currency = opts.currency ?? "USD";
    this.appId = opts.appId ?? 730;
    this.catalog = new CatalogService(prisma);
  }

  start(): void {
    // Kick off first poll immediately, then every 5 minutes
    void this.poll();
    this.pollTimer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);

    this.wsHandler
      .onEvent(event => void this.handleSaleFeedEvent(event))
      .onError(err => console.error("[ingestion] ws error:", err.message));

    this.wsHandler.connect();
    console.log("[ingestion] started — polling every 5 min, ws connected");
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.wsHandler.disconnect();
    console.log("[ingestion] stopped");
  }

  async poll(): Promise<void> {
    console.log("[ingestion] polling /v1/items ...");
    try {
      const items = await this.skinportClient.getItems(this.currency, this.appId);
      const upserted = await this.catalog.upsertMany(items);

      // Write a PriceSnapshot for each item in this poll
      await this.prisma.priceSnapshot.createMany({
        data: items.map(item => ({
          itemId: item.market_hash_name,
          marketplace: Marketplace.SKINPORT,
          minPrice: item.min_price ?? 0,
          medianPrice: item.median_price ?? 0,
          volume24h: item.quantity,
        })),
        skipDuplicates: true,
      });

      console.log(`[ingestion] poll complete — ${upserted} items, ${items.length} snapshots`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ingestion] poll error: ${msg}`);
    }
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
}
