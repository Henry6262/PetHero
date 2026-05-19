import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

export function executionRouter(prisma: PrismaClient) {
  const app = new Hono();

  app.get("/metrics", async c => {
    const [attempts, cycles, latestCycle] = await Promise.all([
      prisma.tradeAttempt.findMany({
        orderBy: { attemptedAt: "desc" },
        take: 20,
      }),
      prisma.executionCycle.findMany({
        orderBy: { executedAt: "desc" },
        take: 20,
      }),
      prisma.executionCycle.findFirst({
        orderBy: { executedAt: "desc" },
      }),
    ]);

    const totals = attempts.reduce(
      (acc, attempt) => {
        acc.attempts += 1;
        if (attempt.mode === "PAPER") acc.paperAttempts += 1;
        if (attempt.status === "SUCCESS") acc.successes += 1;
        if (attempt.status === "FAILED") acc.failures += 1;
        acc.expectedNetProfit += Number(attempt.expectedNetProfit);
        return acc;
      },
      {
        attempts: 0,
        paperAttempts: 0,
        successes: 0,
        failures: 0,
        expectedNetProfit: 0,
      },
    );

    return c.json({
      totals: {
        ...totals,
        expectedNetProfit: Math.round(totals.expectedNetProfit * 100) / 100,
      },
      latestCycle: latestCycle
        ? {
            ...latestCycle,
            selectedBuyPrice:
              latestCycle.selectedBuyPrice === null ? null : Number(latestCycle.selectedBuyPrice),
            selectedTargetSellPrice:
              latestCycle.selectedTargetSellPrice === null
                ? null
                : Number(latestCycle.selectedTargetSellPrice),
            selectedExpectedNetProfit:
              latestCycle.selectedExpectedNetProfit === null
                ? null
                : Number(latestCycle.selectedExpectedNetProfit),
          }
        : null,
      recentAttempts: attempts.map(attempt => ({
        ...attempt,
        buyPrice: Number(attempt.buyPrice),
        resellPrice: Number(attempt.resellPrice),
        expectedNetProfit: Number(attempt.expectedNetProfit),
      })),
      recentCycles: cycles.map(cycle => ({
        ...cycle,
        selectedBuyPrice: cycle.selectedBuyPrice === null ? null : Number(cycle.selectedBuyPrice),
        selectedTargetSellPrice:
          cycle.selectedTargetSellPrice === null ? null : Number(cycle.selectedTargetSellPrice),
        selectedExpectedNetProfit:
          cycle.selectedExpectedNetProfit === null
            ? null
            : Number(cycle.selectedExpectedNetProfit),
      })),
    });
  });

  return app;
}
