import { PrismaClient, Marketplace } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPulse() {
  console.log("📊 --- REAL-WORLD MARKET PULSE ---");

  try {
    const topDeals = await prisma.opportunityScore.findMany({
      where: { score: { gt: 0 } },
      orderBy: { score: "desc" },
      take: 10,
    });

    if (topDeals.length === 0) {
      console.log("⚠️ No profitable deals found in the current pool (0% - 10% margins).");
      return;
    }

    console.table(topDeals.map(d => ({
      Item: d.itemId.substring(0, 40),
      Score: d.score.toFixed(2),
      "Profit%": d.expectedProfitPct.toFixed(1) + "%",
      Volume: d.volume24h,
      "BuyAt": d.listedPrice
    })));

    const totalTracked = await prisma.item.count();
    console.log(`\n📈 Total Items Scanned: ${totalTracked}`);

  } catch (err) {
    console.error("❌ Failed to query live data:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPulse();
