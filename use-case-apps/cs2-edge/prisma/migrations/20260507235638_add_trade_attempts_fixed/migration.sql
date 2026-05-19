-- CreateTable
CREATE TABLE "TradeAttempt" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "buyPrice" DECIMAL(12,2) NOT NULL,
    "resellPrice" DECIMAL(12,2) NOT NULL,
    "expectedProfitPct" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "orderId" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TradeAttempt" ADD CONSTRAINT "TradeAttempt_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
