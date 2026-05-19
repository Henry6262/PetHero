import { Hono } from "hono";
import { PrismaClient, Marketplace } from "@prisma/client";
import { OpportunityService } from "../../opportunities/opportunity.service.ts";

export function opportunitiesRouter(prisma: PrismaClient) {
  const app = new Hono();
  const opportunities = new OpportunityService(prisma);

  app.get("/", async c => {
    const marketplaceParam = (c.req.query("marketplace") ?? "SKINPORT").toUpperCase();
    const marketplace = Object.values(Marketplace).includes(marketplaceParam as Marketplace)
      ? (marketplaceParam as Marketplace)
      : Marketplace.SKINPORT;

    const ranked = await opportunities.getRanked(marketplace);

    return c.json({
      opportunities: ranked.map(r => ({
        itemId: r.itemId,
        marketplace: r.marketplace,
        score: r.score,
        expectedProfitPct: r.expectedProfitPct,
        listedPrice: Number(r.listedPrice),
        targetSellPrice: Number(r.targetSellPrice),
        expectedNetProfit: Math.round((Number(r.targetSellPrice) * 0.88 - Number(r.listedPrice)) * 100) / 100,
        volume24h: r.volume24h,
        confidence: r.confidence ?? 0,
        scoredAt: r.scoredAt,
      })),
      total: ranked.length,
      scoredAt: ranked[0]?.scoredAt ?? null,
    });
  });

  return app;
}
