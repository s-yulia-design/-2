-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SettlementWebInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "population" INTEGER,
    "householdsCount" INTEGER,
    "coordinates" TEXT,
    "socialObjects" TEXT,
    "businessObjects" TEXT,
    "buildingType" TEXT,
    "sourceUrl" TEXT,
    "sourcesJson" TEXT NOT NULL DEFAULT '[]',
    "dataStatus" TEXT NOT NULL DEFAULT 'внесено_вручную',
    "comment" TEXT,
    CONSTRAINT "SettlementWebInfo_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SettlementWebInfo" ("buildingType", "businessObjects", "comment", "coordinates", "dataStatus", "householdsCount", "id", "population", "settlementId", "socialObjects", "sourceUrl") SELECT "buildingType", "businessObjects", "comment", "coordinates", "dataStatus", "householdsCount", "id", "population", "settlementId", "socialObjects", "sourceUrl" FROM "SettlementWebInfo";
DROP TABLE "SettlementWebInfo";
ALTER TABLE "new_SettlementWebInfo" RENAME TO "SettlementWebInfo";
CREATE UNIQUE INDEX "SettlementWebInfo_settlementId_key" ON "SettlementWebInfo"("settlementId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
