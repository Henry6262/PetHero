-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anonId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Replay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "inputsJson" TEXT NOT NULL,
    "finalTime" REAL NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Replay_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ghost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "replayId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "mmr" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ghost_replayId_fkey" FOREIGN KEY ("replayId") REFERENCES "Replay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LadderEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "bestTime" REAL NOT NULL,
    "mmr" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LadderEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrandPrix" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "prizePool" TEXT NOT NULL DEFAULT '0',
    "state" TEXT NOT NULL DEFAULT 'qualifying',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GrandPrixEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gpId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "qualifyingTime" REAL,
    "finalTime" REAL,
    "rank" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrandPrixEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GrandPrixEntry_gpId_fkey" FOREIGN KEY ("gpId") REFERENCES "GrandPrix" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_anonId_key" ON "Account"("anonId");

-- CreateIndex
CREATE UNIQUE INDEX "Ghost_replayId_key" ON "Ghost"("replayId");

-- CreateIndex
CREATE UNIQUE INDEX "LadderEntry_accountId_trackId_key" ON "LadderEntry"("accountId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "GrandPrixEntry_gpId_accountId_key" ON "GrandPrixEntry"("gpId", "accountId");
