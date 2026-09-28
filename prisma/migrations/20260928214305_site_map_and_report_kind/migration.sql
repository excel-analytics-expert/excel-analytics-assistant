-- AlterTable
ALTER TABLE "Site" ADD COLUMN "mapUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IncidentReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shiftId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'TROUBLE',
    "message" TEXT NOT NULL,
    "photoPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncidentReport_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IncidentReport_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IncidentReport" ("createdAt", "id", "message", "photoPath", "shiftId", "staffId") SELECT "createdAt", "id", "message", "photoPath", "shiftId", "staffId" FROM "IncidentReport";
DROP TABLE "IncidentReport";
ALTER TABLE "new_IncidentReport" RENAME TO "IncidentReport";
CREATE INDEX "IncidentReport_shiftId_idx" ON "IncidentReport"("shiftId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
