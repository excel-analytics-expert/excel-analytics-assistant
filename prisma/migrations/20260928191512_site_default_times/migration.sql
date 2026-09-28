-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "requiredHeadcount" INTEGER NOT NULL DEFAULT 1,
    "defaultStartTime" TEXT NOT NULL DEFAULT '09:00',
    "defaultEndTime" TEXT NOT NULL DEFAULT '17:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Site" ("address", "createdAt", "id", "name", "requiredHeadcount") SELECT "address", "createdAt", "id", "name", "requiredHeadcount" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
