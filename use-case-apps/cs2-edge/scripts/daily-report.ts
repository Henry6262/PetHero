import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseHours(): number {
  const raw = Bun.argv[2] ?? process.env["REPORT_HOURS"] ?? "12";
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
}

async function runReport() {
  const hours = parseHours();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  console.log(`📅 --- CS2 EDGE AUDIT REPORT (${hours}h window) ---`);

  try {
    const attempts = await prisma.tradeAttempt.findMany({
      where: { attemptedAt: { gte: since } },
      orderBy: { attemptedAt: "desc" },
      take: 50,
    });
    const recentSnapshots = await prisma.priceSnapshot.count({
      where: { snappedAt: { gte: since } },
    });
    const totalSnapshots = await prisma.priceSnapshot.count();
    const itemCount = await prisma.item.count();

    const statusCounts = attempts.reduce<Record<string, number>>((acc, attempt) => {
      acc[attempt.status] = (acc[attempt.status] ?? 0) + 1;
      return acc;
    }, {});

    const paperByItem = new Map<
      string,
      {
        count: number;
        bestScore: number;
        bestProfit: number;
        firstSeen: Date;
        lastSeen: Date;
        bestBuyPrice: number;
        bestTargetSell: number;
      }
    >();

    for (const attempt of attempts.filter(attempt => attempt.status === "PAPER")) {
      const existing = paperByItem.get(attempt.itemId);
      const buyPrice = Number(attempt.buyPrice);
      const targetSell = Number(attempt.resellPrice);

      if (!existing) {
        paperByItem.set(attempt.itemId, {
          count: 1,
          bestScore: attempt.score,
          bestProfit: attempt.expectedProfitPct,
          firstSeen: attempt.attemptedAt,
          lastSeen: attempt.attemptedAt,
          bestBuyPrice: buyPrice,
          bestTargetSell: targetSell,
        });
        continue;
      }

      existing.count += 1;
      existing.firstSeen = existing.firstSeen < attempt.attemptedAt ? existing.firstSeen : attempt.attemptedAt;
      existing.lastSeen = existing.lastSeen > attempt.attemptedAt ? existing.lastSeen : attempt.attemptedAt;

      if (attempt.score > existing.bestScore) {
        existing.bestScore = attempt.score;
        existing.bestProfit = attempt.expectedProfitPct;
        existing.bestBuyPrice = buyPrice;
        existing.bestTargetSell = targetSell;
      }
    }

    const topPaperTrades = [...paperByItem.entries()]
      .map(([itemId, data]) => ({ itemId, ...data }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 10);

    console.log(`\n📊 DATA STATS:`);
    console.log(`   - Total Items in Catalog: ${itemCount}`);
    console.log(`   - Price Snapshots in Window: ${recentSnapshots}`);
    console.log(`   - Price Snapshots Total: ${totalSnapshots}`);
    console.log(`   - Paper Trades in Window: ${statusCounts["PAPER"] ?? 0}`);
    console.log(`   - Real Buy Attempts in Window: ${(statusCounts["SUCCESS"] ?? 0) + (statusCounts["FAILED"] ?? 0)}`);

    console.log("\n🤖 PAPER TRADE ACTIVITY (Last 50 records):");
    if (attempts.length === 0) {
      console.log("   (No trade attempts recorded in this window)");
    } else {
      console.table(attempts.map(a => ({
        Time: a.attemptedAt.toLocaleString(),
        Item: a.itemId.substring(0, 30),
        Price: "$" + Number(a.buyPrice).toFixed(2),
        Profit: a.expectedProfitPct.toFixed(1) + "%",
        Score: a.score.toFixed(2),
        Status: a.status,
        Details: a.error || "N/A"
      })));
    }

    console.log('\n🎯 BEST PAPER TRADES WE WOULD HAVE TAKEN:');
    if (topPaperTrades.length === 0) {
      console.log("   (No paper trades recorded in this window)");
    } else {
      console.table(topPaperTrades.map(trade => ({
        Item: trade.itemId.substring(0, 35),
        Seen: trade.count,
        "Best Score": trade.bestScore.toFixed(2),
        "Best Profit": trade.bestProfit.toFixed(1) + "%",
        "Best Buy": "$" + trade.bestBuyPrice.toFixed(2),
        "Best Sell": "$" + trade.bestTargetSell.toFixed(2),
        "First Seen": trade.firstSeen.toLocaleTimeString(),
        "Last Seen": trade.lastSeen.toLocaleTimeString(),
      })));
    }

    const topOpps = await prisma.opportunityScore.findMany({
      where: { score: { gt: 100 } },
      orderBy: { score: "desc" },
      take: 10,
    });

    console.log('\n🔥 CURRENT LIVE OPPORTUNITIES:');
    console.table(topOpps.map(o => ({
      Item: o.itemId.substring(0, 35),
      Score: o.score.toFixed(2),
      Profit: o.expectedProfitPct.toFixed(1) + "%",
      Buy: "$" + Number(o.listedPrice).toFixed(2),
      Resell: "$" + Number(o.targetSellPrice).toFixed(2)
    })));

  } catch (err) {
    console.error("❌ Failed to generate report:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runReport();
