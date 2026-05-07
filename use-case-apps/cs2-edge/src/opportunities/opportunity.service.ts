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

  async scoreAll(_marketplace: Marketplace = Marketplace.SKINPORT): Promise<void> {
    throw new Error("not implemented");
  }

  async getRanked(_marketplace: Marketplace = Marketplace.SKINPORT): Promise<OpportunityScore[]> {
    throw new Error("not implemented");
  }
}
