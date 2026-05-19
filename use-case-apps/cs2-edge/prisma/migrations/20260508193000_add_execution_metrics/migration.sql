ALTER TABLE "TradeAttempt"
ADD COLUMN "expectedNetProfit" DECIMAL(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN "confidence" DOUBLE PRECISION,
ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'PAPER',
ADD COLUMN "cycleId" TEXT;

CREATE TABLE "ExecutionCycle" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "candidateCount" INTEGER NOT NULL,
    "qualifiedCount" INTEGER NOT NULL,
    "affordableCount" INTEGER NOT NULL DEFAULT 0,
    "selectedItemId" TEXT,
    "selectedBuyPrice" DECIMAL(12, 2),
    "selectedTargetSellPrice" DECIMAL(12, 2),
    "selectedExpectedProfitPct" DOUBLE PRECISION,
    "selectedExpectedNetProfit" DECIMAL(12, 2),
    "selectedScore" DOUBLE PRECISION,
    "selectedConfidence" DOUBLE PRECISION,
    "reason" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionCycle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TradeAttempt_attemptedAt_idx" ON "TradeAttempt"("attemptedAt");
CREATE INDEX "TradeAttempt_status_attemptedAt_idx" ON "TradeAttempt"("status", "attemptedAt");
CREATE INDEX "ExecutionCycle_executedAt_idx" ON "ExecutionCycle"("executedAt");

ALTER TABLE "TradeAttempt"
ADD CONSTRAINT "TradeAttempt_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ExecutionCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExecutionCycle"
ADD CONSTRAINT "ExecutionCycle_selectedItemId_fkey" FOREIGN KEY ("selectedItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
