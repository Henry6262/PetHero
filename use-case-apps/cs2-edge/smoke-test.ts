import { PrismaClient, Marketplace } from "@prisma/client";

const liveDatabaseUrl = process.env["DATABASE_URL"] ?? "";
const testDatabaseUrl = process.env["TEST_DATABASE_URL"] ?? "";

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required for smoke tests. Point it at a dedicated disposable database.",
  );
}

if (liveDatabaseUrl && liveDatabaseUrl === testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL must not match DATABASE_URL. Use a separate database before running smoke tests.",
  );
}

process.env["DATABASE_URL"] = testDatabaseUrl;

const prisma = new PrismaClient();

async function smokeTest() {
  console.log("🚀 Starting CS2 Edge Smoke Test...");
  console.log(`🧪 Target DB: ${testDatabaseUrl}`);

  try {
    // 1. Clean up old test data
    await prisma.opportunityScore.deleteMany({});
    await prisma.priceSnapshot.deleteMany({});
    await prisma.item.deleteMany({});

    // 2. Seed some "Real" Items
    console.log("📦 Seeding catalog...");
    const items = [
      { id: "AK-47 | Redline (Field-Tested)", name: "AK-47 | Redline (Field-Tested)", type: "Rifle", rarity: "Classified" },
      { id: "AWP | Asiimov (Battle-Scarred)", name: "AWP | Asiimov (Battle-Scarred)", type: "Sniper Rifle", rarity: "Covert" },
      { id: "Glock-18 | Candy Apple (Factory New)", name: "Glock-18 | Candy Apple (Factory New)", type: "Pistol", rarity: "Industrial Grade" },
    ];

    for (const item of items) {
      await prisma.item.create({ data: item });
    }

    // 3. Create Price Snapshots with clear margins
    console.log("📈 Injecting price snapshots...");
    const snapshots = [
      {
        itemId: "AK-47 | Redline (Field-Tested)",
        marketplace: Marketplace.SKINPORT,
        minPrice: 10.00,
        medianPrice: 13.50, // Profit: (13.5 * 0.88) - 10 = 11.88 - 10 = 1.88
        volume24h: 50,
      },
      {
        itemId: "AWP | Asiimov (Battle-Scarred)",
        marketplace: Marketplace.SKINPORT,
        minPrice: 50.00,
        medianPrice: 65.00, // Profit: (65 * 0.88) - 50 = 57.2 - 50 = 7.2
        volume24h: 15,
      },
      {
        itemId: "Glock-18 | Candy Apple (Factory New)",
        marketplace: Marketplace.SKINPORT,
        minPrice: 0.50,
        medianPrice: 0.55, // Negative/Thin Profit after fees
        volume24h: 200,
      }
    ];

    for (const s of snapshots) {
      await prisma.priceSnapshot.create({ data: s });
      // Add a slightly older snapshot for momentum
      await prisma.priceSnapshot.create({ 
        data: {
          ...s,
          minPrice: s.minPrice * 0.9, // Price was 10% lower 10 mins ago (upward momentum)
          snappedAt: new Date(Date.now() - 10 * 60 * 1000),
        }
      });
    }

    // 4. Trigger Scoring (The core logic we just built)
    console.log("🧠 Triggering Opportunity Engine...");
    // We import the logic directly for the test
    const { OpportunityService } = await import("./src/opportunities/opportunity.service.ts");
    const service = new OpportunityService(prisma);
    await service.scoreAll(Marketplace.SKINPORT);

    console.log("✅ Smoke test data prepared.");
    console.log("\n--- RESULTS PREVIEW ---");
    const results = await service.getRanked(Marketplace.SKINPORT);
    
    // 5. Trigger Execution (Phase 4)
    console.log("\n🤖 Triggering Execution Bot...");
    const { ExecutionService } = await import("./src/execution/execution.service.ts");
    const execution = new ExecutionService(prisma, {
      minScore: 30, // Lowered to pick up the test AK-47
      minProfitPct: 5,
      minConfidence: 0,
      minBuyPrice: 10,
      maxSpendPerTrade: 30,
    });
    await execution.runCycle();

    console.log("\n✅ Smoke test complete.");
  } catch (err) {
    console.error("❌ Smoke test failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

smokeTest();
