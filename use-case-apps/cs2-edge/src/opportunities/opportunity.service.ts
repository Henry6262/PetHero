import { PrismaClient, Marketplace, type OpportunityScore } from "@prisma/client";
import { PricingService } from "../pricing/pricing.service.ts";
import { MLClient } from "./ml.client.ts";

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
  private readonly ml: MLClient;

  constructor(private readonly prisma: PrismaClient) {
    this.pricing = new PricingService(prisma);
    this.ml = new MLClient();
  }

  async scoreAll(marketplace: Marketplace = Marketplace.SKINPORT): Promise<void> {
    const summaries = await this.pricing.getAllPriceSummaries(marketplace);
    if (summaries.length === 0) return;

    // Fetch history for momentum calculation
    const historyMap = await this.pricing.getRecentHistory(marketplace, 6); // last 30 mins if polling every 5 min

    // Phase 3: Get predictions from ML service
    const predictions = await this.ml.predict(
      summaries.map(s => {
        const history = historyMap.get(s.itemId) ?? [];
        // Momentum = (current - oldest) / oldest
        let priceMomentum = 0;
        if (history.length > 1) {
          const oldest = history[history.length - 1]!.minPrice;
          if (oldest > 0) {
            priceMomentum = (s.minPrice - oldest) / oldest;
          }
        }

        return {
          itemId: s.itemId,
          minPrice: s.minPrice,
          medianPrice: s.medianPrice,
          volume24h: s.volume24h,
          priceMomentum,
        };
      }),
    );

    const predictionMap = new Map(predictions.map(p => [p.itemId, p]));

    const CHUNK_SIZE = 200;
    for (let i = 0; i < summaries.length; i += CHUNK_SIZE) {
      const chunk = summaries.slice(i, i + CHUNK_SIZE);
      await this.prisma.$transaction(
        chunk.map(s => {
          const { score, expectedProfitPct } = computeScore(s.minPrice, s.medianPrice, s.volume24h);
          const pred = predictionMap.get(s.itemId);

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
              predictedValue: pred?.predictedValue,
              confidence: pred?.confidence ?? 0,
            },
            update: {
              score,
              expectedProfitPct,
              listedPrice: s.minPrice,
              targetSellPrice: s.medianPrice,
              volume24h: s.volume24h,
              predictedValue: pred?.predictedValue,
              confidence: pred?.confidence ?? 0,
            },
          });
        }),
      );
    }
  }

  async getRanked(marketplace: Marketplace = Marketplace.SKINPORT): Promise<OpportunityScore[]> {
    return this.prisma.opportunityScore.findMany({
      where: { marketplace, score: { gt: 0 } },
      orderBy: { score: "desc" },
    });
  }
}
