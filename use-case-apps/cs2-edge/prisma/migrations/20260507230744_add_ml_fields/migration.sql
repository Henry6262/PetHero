-- AlterTable
ALTER TABLE "OpportunityScore" ADD COLUMN     "confidence" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "modelId" TEXT,
ADD COLUMN     "predictedValue" DECIMAL(12,2);
