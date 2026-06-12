-- CreateTable
CREATE TABLE "Loadout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT 'paper-scooter',
    "wheels" TEXT NOT NULL DEFAULT 'stock',
    "spoiler" TEXT,
    "paint" INTEGER NOT NULL DEFAULT 16432661,
    "trail" TEXT NOT NULL DEFAULT 'default',
    CONSTRAINT "Loadout_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Loadout_accountId_key" ON "Loadout"("accountId");
