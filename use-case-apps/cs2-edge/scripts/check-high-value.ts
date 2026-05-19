import { PrismaClient, Marketplace } from "@prisma/client";

const prisma = new PrismaClient();

async function checkHighValue() {
  console.log("💎 --- HIGH-VALUE MARKET SCAN ($20 - $500) ---");

  try {
    const deals = await prisma.opportunityScore.findMany({
      where: { 
        score: { gt: 0 },
        listedPrice: { 
          gte: 20.0,
          lte: 500.0
        }
      },
      orderBy: { score: "desc" },
      take: 15,
    });

    if (deals.length === 0) {
      console.log("⚠️ No profitable deals found in the $20 - $500 range.");
      return;
    }

    console.table(deals.map(d => ({
      Item: d.itemId.substring(0, 45),
      Score: d.score.toFixed(2),
      "Profit%": d.expectedProfitPct.toFixed(1) + "%",
      Volume: d.volume24h,
      "Buy Price": "$" + Number(d.listedPrice).toFixed(2),
      "Resell (Est)": "$" + Number(d.targetSellPrice).toFixed(2)
    })));

    const count = await prisma.opportunityScore.count({
      where: { 
        score: { gt: 0 },
        listedPrice: { gte: 20.0, lte: 500.0 }
      }
    });
    console.log(`\n✅ Found ${count} potential trades in your target price bracket.`);

  } catch (err) {
    console.error("❌ Failed to query live data:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkHighValue();
