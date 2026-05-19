import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function exportData() {
  console.log("📤 Exporting training data for ML...");

  try {
    // 1. Fetch Snapshots
    const snapshots = await prisma.priceSnapshot.findMany({
      orderBy: { snappedAt: "asc" },
      include: {
        item: {
          select: {
            type: true,
            rarity: true,
          }
        }
      }
    });

    if (snapshots.length === 0) {
      console.warn("⚠️ No snapshots found in DB. Export will be empty.");
    }

    // 2. Format as CSV
    const headers = ["itemId", "type", "rarity", "marketplace", "minPrice", "medianPrice", "volume24h", "snappedAt"];
    const rows = snapshots.map(s => [
      s.itemId,
      s.item.type,
      s.item.rarity,
      s.marketplace,
      Number(s.minPrice),
      Number(s.medianPrice),
      s.volume24h,
      s.snappedAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(",")),
    ].join("\n");

    // 3. Save to file
    const outputPath = join(process.cwd(), "training_data.csv");
    writeFileSync(outputPath, csvContent);

    console.log(`✅ Export complete! Saved ${snapshots.length} rows to ${outputPath}`);
    
    // 4. Quick Summary
    const uniqueItems = new Set(snapshots.map(s => s.itemId)).size;
    console.log(`📊 Stats: ${uniqueItems} unique items captured.`);

  } catch (err) {
    console.error("❌ Export failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
