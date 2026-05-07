-- CreateTable
CREATE TABLE "OpportunityScore" (
    "itemId" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "expectedProfitPct" DOUBLE PRECISION NOT NULL,
    "listedPrice" DECIMAL(12,2) NOT NULL,
    "targetSellPrice" DECIMAL(12,2) NOT NULL,
    "volume24h" INTEGER NOT NULL,
    "scoredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityScore_pkey" PRIMARY KEY ("itemId","marketplace")
);

-- CreateIndex
CREATE INDEX "OpportunityScore_marketplace_score_idx" ON "OpportunityScore"("marketplace", "score");

-- AddForeignKey
ALTER TABLE "OpportunityScore" ADD CONSTRAINT "OpportunityScore_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
