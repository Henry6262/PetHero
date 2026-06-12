-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Loadout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT 'toyota-supra',
    "wheels" TEXT NOT NULL DEFAULT 'stock',
    "spoiler" TEXT,
    "paint" INTEGER NOT NULL DEFAULT 16737792,
    "trail" TEXT NOT NULL DEFAULT 'default',
    CONSTRAINT "Loadout_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Loadout" ("accountId", "body", "id", "paint", "spoiler", "trail", "wheels") SELECT "accountId", "body", "id", "paint", "spoiler", "trail", "wheels" FROM "Loadout";
DROP TABLE "Loadout";
ALTER TABLE "new_Loadout" RENAME TO "Loadout";
CREATE UNIQUE INDEX "Loadout_accountId_key" ON "Loadout"("accountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
