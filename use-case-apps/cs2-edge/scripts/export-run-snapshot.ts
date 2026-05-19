import { mkdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getExportDir(): string {
  return process.env["EXPORT_DIR"]?.trim() || "./artifacts/runs";
}

function timestampSlug(date: Date): string {
  return date.toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function toCsvRow(values: Array<string | number | null>): string {
  return values
    .map(value => {
      if (value === null) return "";
      const str = String(value);
      if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return `"${str.replaceAll("\"", "\"\"")}"`;
      }
      return str;
    })
    .join(",");
}

async function main() {
  const exportedAt = new Date();
  const runDir = join(process.cwd(), getExportDir(), timestampSlug(exportedAt));
  mkdirSync(runDir, { recursive: true });

  const [snapshots, opportunities, attempts] = await Promise.all([
    prisma.priceSnapshot.findMany({
      orderBy: { snappedAt: "asc" },
      select: {
        itemId: true,
        marketplace: true,
        minPrice: true,
        medianPrice: true,
        volume24h: true,
        snappedAt: true,
      },
    }),
    prisma.opportunityScore.findMany({
      orderBy: { score: "desc" },
      select: {
        itemId: true,
        marketplace: true,
        score: true,
        expectedProfitPct: true,
        listedPrice: true,
        targetSellPrice: true,
        volume24h: true,
        predictedValue: true,
        confidence: true,
        scoredAt: true,
      },
    }),
    prisma.tradeAttempt.findMany({
      orderBy: { attemptedAt: "asc" },
      select: {
        itemId: true,
        marketplace: true,
        buyPrice: true,
        resellPrice: true,
        expectedProfitPct: true,
        score: true,
        status: true,
        error: true,
        orderId: true,
        attemptedAt: true,
      },
    }),
  ]);

  const summary = {
    exportedAt: exportedAt.toISOString(),
    databaseUrl: process.env["DATABASE_URL"] ?? null,
    counts: {
      snapshots: snapshots.length,
      opportunities: opportunities.length,
      tradeAttempts: attempts.length,
    },
    snapshotWindow: {
      first: snapshots[0]?.snappedAt.toISOString() ?? null,
      last: snapshots.at(-1)?.snappedAt.toISOString() ?? null,
    },
  };

  await Promise.all([
    Bun.write(join(runDir, "summary.json"), JSON.stringify(summary, null, 2)),
    Bun.write(join(runDir, "price-snapshots.json"), JSON.stringify(snapshots, null, 2)),
    Bun.write(join(runDir, "opportunities.json"), JSON.stringify(opportunities, null, 2)),
    Bun.write(join(runDir, "trade-attempts.json"), JSON.stringify(attempts, null, 2)),
    Bun.write(
      join(runDir, "price-snapshots.csv"),
      [
        "itemId,marketplace,minPrice,medianPrice,volume24h,snappedAt",
        ...snapshots.map(snapshot =>
          toCsvRow([
            snapshot.itemId,
            snapshot.marketplace,
            Number(snapshot.minPrice),
            Number(snapshot.medianPrice),
            snapshot.volume24h,
            snapshot.snappedAt.toISOString(),
          ]),
        ),
      ].join("\n"),
    ),
    Bun.write(
      join(runDir, "opportunities.csv"),
      [
        "itemId,marketplace,score,expectedProfitPct,listedPrice,targetSellPrice,volume24h,predictedValue,confidence,scoredAt",
        ...opportunities.map(opportunity =>
          toCsvRow([
            opportunity.itemId,
            opportunity.marketplace,
            opportunity.score,
            opportunity.expectedProfitPct,
            Number(opportunity.listedPrice),
            Number(opportunity.targetSellPrice),
            opportunity.volume24h,
            opportunity.predictedValue === null ? null : Number(opportunity.predictedValue),
            opportunity.confidence,
            opportunity.scoredAt.toISOString(),
          ]),
        ),
      ].join("\n"),
    ),
    Bun.write(
      join(runDir, "trade-attempts.csv"),
      [
        "itemId,marketplace,buyPrice,resellPrice,expectedProfitPct,score,status,error,orderId,attemptedAt",
        ...attempts.map(attempt =>
          toCsvRow([
            attempt.itemId,
            attempt.marketplace,
            Number(attempt.buyPrice),
            Number(attempt.resellPrice),
            attempt.expectedProfitPct,
            attempt.score,
            attempt.status,
            attempt.error,
            attempt.orderId,
            attempt.attemptedAt.toISOString(),
          ]),
        ),
      ].join("\n"),
    ),
  ]);

  console.log(`📦 Run snapshot exported to ${runDir}`);
  console.log(
    `   snapshots=${summary.counts.snapshots} opportunities=${summary.counts.opportunities} tradeAttempts=${summary.counts.tradeAttempts}`,
  );
}

main()
  .catch(err => {
    console.error("❌ Export failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
