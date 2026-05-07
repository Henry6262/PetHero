import { PrismaClient, Marketplace } from "@prisma/client";

export interface PriceSummary {
  itemId: string;
  marketplace: Marketplace;
  minPrice: number;
  medianPrice: number;
  /** Percentage spread: (median - min) / median * 100. Null when median is 0. */
  spreadPct: number | null;
  volume24h: number;
  snappedAt: Date;
}

export class PricingService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Returns the most recent PriceSnapshot for an item, or null if none exists. */
  async getPriceSummary(
    itemId: string,
    marketplace: Marketplace = Marketplace.SKINPORT,
  ): Promise<PriceSummary | null> {
    const snapshot = await this.prisma.priceSnapshot.findFirst({
      where: { itemId, marketplace },
      orderBy: { snappedAt: "desc" },
    });

    if (!snapshot) return null;

    const min = Number(snapshot.minPrice);
    const median = Number(snapshot.medianPrice);
    const spreadPct = median > 0 ? ((median - min) / median) * 100 : null;

    return {
      itemId: snapshot.itemId,
      marketplace: snapshot.marketplace,
      minPrice: min,
      medianPrice: median,
      spreadPct: spreadPct !== null ? Math.round(spreadPct * 100) / 100 : null,
      volume24h: snapshot.volume24h,
      snappedAt: snapshot.snappedAt,
    };
  }

  /** Returns summaries for all tracked items, latest snapshot only. */
  async getAllPriceSummaries(
    marketplace: Marketplace = Marketplace.SKINPORT,
  ): Promise<PriceSummary[]> {
    // Use a subquery pattern: get the latest snapshot per item
    const latest = await this.prisma.$queryRaw<
      {
        itemId: string;
        marketplace: Marketplace;
        minPrice: string;
        medianPrice: string;
        volume24h: number;
        snappedAt: Date;
      }[]
    >`
      SELECT DISTINCT ON ("itemId") "itemId", marketplace, "minPrice", "medianPrice", "volume24h", "snappedAt"
      FROM "PriceSnapshot"
      WHERE marketplace = ${marketplace}::"Marketplace"
      ORDER BY "itemId", "snappedAt" DESC
    `;

    return latest.map(row => {
      const min = Number(row.minPrice);
      const median = Number(row.medianPrice);
      const spreadPct = median > 0 ? Math.round(((median - min) / median) * 10000) / 100 : null;
      return {
        itemId: row.itemId,
        marketplace: row.marketplace,
        minPrice: min,
        medianPrice: median,
        spreadPct,
        volume24h: row.volume24h,
        snappedAt: row.snappedAt,
      };
    });
  }
}
