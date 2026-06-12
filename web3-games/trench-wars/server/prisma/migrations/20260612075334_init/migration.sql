-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wallet" TEXT,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Starter',
    "cards" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deck_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "replaySeed" INTEGER NOT NULL,
    "replayCommands" JSONB NOT NULL,
    "winner" INTEGER NOT NULL,
    "attackerEloChange" INTEGER NOT NULL,
    "defenderEloChange" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Match_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_wallet_key" ON "Account"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "Deck_accountId_name_key" ON "Deck"("accountId", "name");
