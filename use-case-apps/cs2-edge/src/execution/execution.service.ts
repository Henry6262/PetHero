import { PrismaClient, Marketplace, type OpportunityScore } from "@prisma/client";
import { OpportunityService } from "../opportunities/opportunity.service.ts";
import { SkinportBuyClient } from "./skinport.buy.client.ts";
import { SteamService } from "./steam.service.ts";

export interface ExecutionOptions {
  minScore?: number;
  minProfitPct?: number;
  minConfidence?: number;
  maxSpendPerTrade?: number;
  minBuyPrice?: number;
  minVolume24h?: number;
  maxExpectedProfitPct?: number;
  cooldownMinutes?: number;
  buyClient?: SkinportBuyClient;
  steamService?: SteamService;
}

export class ExecutionService {
  private readonly opportunityService: OpportunityService;
  private readonly buyClient: SkinportBuyClient;
  private readonly steamService?: SteamService;
  private readonly minScore: number;
  private readonly minProfitPct: number;
  private readonly minConfidence: number;
  private readonly maxSpendPerTrade: number;
  private readonly minBuyPrice: number;
  private readonly minVolume24h: number;
  private readonly maxExpectedProfitPct: number;
  private readonly cooldownMinutes: number;

  constructor(
    private readonly prisma: PrismaClient,
    opts: ExecutionOptions = {}
  ) {
    this.opportunityService = new OpportunityService(prisma);
    this.buyClient = opts.buyClient ?? new SkinportBuyClient();
    this.steamService = opts.steamService;
    this.minScore = opts.minScore ?? 50.0;
    this.minProfitPct = opts.minProfitPct ?? 10.0;
    this.minConfidence = opts.minConfidence ?? (process.env["ML_SERVICE_URL"] ? 0.4 : 0.0);
    this.maxSpendPerTrade = opts.maxSpendPerTrade ?? 500.0;
    this.minBuyPrice = opts.minBuyPrice ?? 20.0;
    this.minVolume24h = opts.minVolume24h ?? 10;
    this.maxExpectedProfitPct = opts.maxExpectedProfitPct ?? 150.0;
    this.cooldownMinutes = opts.cooldownMinutes ?? 180;
  }

  async runCycle(): Promise<void> {
    console.log("[execution] Starting multi-marketplace buy cycle...");

    try {
      // API Guarding: Check for unauthorized Steam API Keys
      if (this.steamService) {
        await this.guardSteamAccount();
      }

      // Aggregate opportunities from all active marketplaces
      const marketplaces = [Marketplace.SKINPORT, Marketplace.CSFLOAT, Marketplace.DMARKET];
      const allOpportunities: OpportunityScore[] = [];
      for (const m of marketplaces) {
        allOpportunities.push(...(await this.opportunityService.getRanked(m)));
      }

      const cooldownBlocked = await this.getCooldownBlockedItems();
      const candidateDeals = allOpportunities.filter(
        o =>
          Number(o.listedPrice) >= this.minBuyPrice &&
          Number(o.listedPrice) <= this.maxSpendPerTrade,
      );
      
      const topDeals = candidateDeals.filter(o => 
        o.score >= this.minScore &&
        o.expectedProfitPct >= this.minProfitPct &&
        o.expectedProfitPct <= this.maxExpectedProfitPct &&
        o.volume24h >= this.minVolume24h &&
        this.meetsConfidenceThreshold(o) &&
        !cooldownBlocked.has(o.itemId)
      ).sort((a, b) => b.score - a.score);

      const mode = this.hasApiKey() ? "LIVE" : "PAPER";

      if (topDeals.length === 0) {
        console.log("[execution] No deals meet the criteria right now.");
        return;
      }

      const pick = topDeals[0]!;
      // Only execute live on Skinport for now as per v1 scope
      if (pick.marketplace !== Marketplace.SKINPORT || mode === "PAPER") {
        await this.recordPaperTrade(pick, candidateDeals.length, topDeals.length);
        return;
      }

      await this.executeLiveTrade(pick, candidateDeals.length, topDeals.length);

    } catch (err) {
      console.error("[execution] Error in execution cycle:", err);
    }
  }

  /**
   * Prevents API hijacking by verifying the Steam API key matches our signature.
   * If a foreign key is found, it should be revoked immediately.
   */
  private async guardSteamAccount(): Promise<void> {
    const activeKey = await this.steamService?.getRegisteredApiKey();
    const expectedKey = process.env["STEAM_API_KEY"];

    if (activeKey && expectedKey && activeKey !== expectedKey) {
      console.warn("🚨 [security] UNRECOGNIZED STEAM API KEY DETECTED! Revoking immediately...");
      await this.steamService?.revokeApiKey();
      await this.steamService?.registerApiKey(expectedKey);
      console.log("✅ [security] API Guarding restored expected key.");
    }
  }

  private async executeLiveTrade(pick: OpportunityScore, candidates: number, qualified: number): Promise<void> {
    const balance = await this.buyClient.getBalance();
    if (balance < Number(pick.listedPrice)) {
      console.log(`[execution] Skipping ${pick.itemId} - insufficient balance ($${balance})`);
      return;
    }

    const result = await this.buyClient.buyItem(pick.itemId, Number(pick.listedPrice));
    const cycle = await this.recordCycle({
      mode: "LIVE",
      status: result.success ? "SUCCESS" : "FAILED",
      candidateCount: candidates,
      qualifiedCount: qualified,
      affordableCount: qualified, // simplification
      selected: pick,
      reason: result.success ? "ORDER_SUBMITTED" : (result.error || "API_ERROR"),
    });

    await this.recordAttempt(
      pick,
      result.success ? "SUCCESS" : "FAILED",
      result.success ? null : (result.error || "API_ERROR"),
      result.orderId,
      cycle.id,
      "LIVE",
    );
  }

  private async recordPaperTrade(pick: OpportunityScore, candidates: number, qualified: number): Promise<void> {
    const cycle = await this.recordCycle({
      mode: "PAPER",
      status: "PAPER",
      candidateCount: candidates,
      qualifiedCount: qualified,
      affordableCount: qualified,
      selected: pick,
      reason: "PAPER_TRADE_OR_NON_SKINPORT_MARKET",
    });
    await this.recordAttempt(pick, "PAPER", null, undefined, cycle.id, "PAPER");
    console.log(`[execution] Paper trade recorded: ${pick.itemId} (${pick.marketplace}) at $${Number(pick.listedPrice).toFixed(2)}`);
  }

  private hasApiKey(): boolean {
    return Boolean(process.env.SKINPORT_API_KEY);
  }

  private async getCooldownBlockedItems(): Promise<Set<string>> {
    if (this.cooldownMinutes <= 0) {
      return new Set();
    }

    const since = new Date(Date.now() - this.cooldownMinutes * 60 * 1000);
    const recentAttempts = await this.prisma.tradeAttempt.findMany({
      where: {
        attemptedAt: { gte: since },
      },
      select: { itemId: true },
    });

    return new Set(recentAttempts.map(attempt => attempt.itemId));
  }

  private meetsConfidenceThreshold(opportunity: Pick<OpportunityScore, "confidence">): boolean {
    if (this.minConfidence <= 0) return true;
    return (opportunity.confidence ?? 0) >= this.minConfidence;
  }

  private computeExpectedNetProfit(
    pick: Pick<OpportunityScore, "listedPrice" | "targetSellPrice">,
  ): number {
    return Math.round((Number(pick.targetSellPrice) * 0.88 - Number(pick.listedPrice)) * 100) / 100;
  }

  private async recordCycle(params: {
    mode: string;
    status: string;
    candidateCount: number;
    qualifiedCount: number;
    affordableCount: number;
    selected?: Pick<
      OpportunityScore,
      "itemId" | "listedPrice" | "targetSellPrice" | "expectedProfitPct" | "score" | "confidence"
    >;
    reason: string;
  }) {
    const selected = params.selected;
    return this.prisma.executionCycle.create({
      data: {
        mode: params.mode,
        status: params.status,
        candidateCount: params.candidateCount,
        qualifiedCount: params.qualifiedCount,
        affordableCount: params.affordableCount,
        selectedItemId: selected?.itemId,
        selectedBuyPrice: selected?.listedPrice,
        selectedTargetSellPrice: selected?.targetSellPrice,
        selectedExpectedProfitPct: selected?.expectedProfitPct,
        selectedExpectedNetProfit:
          selected ? this.computeExpectedNetProfit(selected) : undefined,
        selectedScore: selected?.score,
        selectedConfidence: selected?.confidence,
        reason: params.reason,
      },
    });
  }

  private async recordAttempt(
    pick: Pick<
      OpportunityScore,
      "itemId" | "marketplace" | "listedPrice" | "targetSellPrice" | "expectedProfitPct" | "score" | "confidence"
    >,
    status: string,
    error: string | null,
    orderId?: string,
    cycleId?: string,
    mode = "PAPER",
  ): Promise<void> {
    await this.prisma.tradeAttempt.create({
      data: {
        itemId: pick.itemId,
        marketplace: pick.marketplace,
        buyPrice: pick.listedPrice,
        resellPrice: pick.targetSellPrice,
        expectedProfitPct: pick.expectedProfitPct,
        expectedNetProfit: this.computeExpectedNetProfit(pick),
        score: pick.score,
        confidence: pick.confidence,
        mode,
        status,
        error,
        orderId,
        cycleId,
      },
    });
  }
}
