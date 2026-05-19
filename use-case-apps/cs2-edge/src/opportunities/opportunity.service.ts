import { PrismaClient, Marketplace, type OpportunityScore } from "@prisma/client";
import { PricingService } from "../pricing/pricing.service.ts";

export function computeScore(
  min: number,
  median: number,
  volume24h: number,
): { score: number; expectedProfitPct: number } {
  if (min <= 0) return { score: 0, expectedProfitPct: 0 };
  const netProfitPct = ((median * 0.88 - min) / min) * 100;
  const score =
    netProfitPct > 0
      ? Math.round(netProfitPct * Math.log(volume24h + 1) * 10000) / 10000
      : 0;
  return {
    score,
    expectedProfitPct: Math.round(netProfitPct * 100) / 100,
  };
}

export class OpportunityService {
  private readonly pricing: PricingService;

  constructor(private readonly prisma: PrismaClient) {
    this.pricing = new PricingService(prisma);
  }

  async scoreAll(marketplace: Marketplace = Marketplace.SKINPORT): Promise<void> {
    const summaries = await this.pricing.getAllPriceSummaries(marketplace);
    if (summaries.length === 0) return;

    const CHUNK_SIZE = 200;
    for (let i = 0; i < summaries.length; i += CHUNK_SIZE) {
      const chunk = summaries.slice(i, i + CHUNK_SIZE);
      await this.prisma.$transaction(
        chunk.map(s => {
          const { score, expectedProfitPct } = computeScore(s.minPrice, s.medianPrice, s.volume24h);
          return this.prisma.opportunityScore.upsert({
            where: {
              itemId_marketplace: { itemId: s.itemId, marketplace: s.marketplace },
            },
            create: {
              itemId: s.itemId,
              marketplace: s.marketplace,
              score,
              expectedProfitPct,
              listedPrice: s.minPrice,
              targetSellPrice: s.medianPrice,
              volume24h: s.volume24h,
            },
            update: {
              score,
              expectedProfitPct,
              listedPrice: s.minPrice,
              targetSellPrice: s.medianPrice,
              volume24h: s.volume24h,
            },
          });
        }),
      );
    }
  }

  async getRanked(_marketplace: Marketplace = Marketplace.SKINPORT): Promise<OpportunityScore[]> {
    throw new Error("not implemented");
  }
}
