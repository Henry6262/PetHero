-- CreateEnum
CREATE TYPE "Marketplace" AS ENUM ('SKINPORT', 'CSFLOAT', 'DMARKET');

-- CreateEnum
CREATE TYPE "ListingState" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "floatValue" DOUBLE PRECISION,
    "paintSeed" INTEGER,
    "state" "ListingState" NOT NULL DEFAULT 'ACTIVE',
    "listedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "minPrice" DECIMAL(12,2) NOT NULL,
    "medianPrice" DECIMAL(12,2) NOT NULL,
    "volume24h" INTEGER NOT NULL,
    "snappedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleEvent" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "floatValue" DOUBLE PRECISION,
    "paintSeed" INTEGER,
    "soldAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Listing_itemId_state_idx" ON "Listing"("itemId", "state");

-- CreateIndex
CREATE INDEX "Listing_marketplace_state_idx" ON "Listing"("marketplace", "state");

-- CreateIndex
CREATE INDEX "PriceSnapshot_itemId_snappedAt_idx" ON "PriceSnapshot"("itemId", "snappedAt");

-- CreateIndex
CREATE INDEX "PriceSnapshot_marketplace_snappedAt_idx" ON "PriceSnapshot"("marketplace", "snappedAt");

-- CreateIndex
CREATE INDEX "SaleEvent_itemId_soldAt_idx" ON "SaleEvent"("itemId", "soldAt");

-- CreateIndex
CREATE INDEX "SaleEvent_marketplace_soldAt_idx" ON "SaleEvent"("marketplace", "soldAt");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleEvent" ADD CONSTRAINT "SaleEvent_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
