-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL DEFAULT '',
    "settlementType" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'новый',
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "recommendation" TEXT NOT NULL DEFAULT '',
    "dataConfidenceLevel" TEXT NOT NULL DEFAULT 'низкая',
    "priorityStatus" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SettlementWebInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "population" INTEGER,
    "householdsCount" INTEGER,
    "coordinates" TEXT,
    "socialObjects" TEXT,
    "businessObjects" TEXT,
    "buildingType" TEXT,
    "sourceUrl" TEXT,
    "dataStatus" TEXT NOT NULL DEFAULT 'внесено_вручную',
    "comment" TEXT,
    CONSTRAINT "SettlementWebInfo_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DemandRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "street" TEXT NOT NULL DEFAULT '',
    "house" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'ручной ввод',
    "serviceType" TEXT NOT NULL DEFAULT 'Интернет',
    "status" TEXT NOT NULL DEFAULT 'оставил заявку',
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "readyToPayConnection" BOOLEAN NOT NULL DEFAULT false,
    "readyToSignContract" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "isInitiativeGroup" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandRequest_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "technology" TEXT NOT NULL DEFAULT 'неизвестно',
    "tariff" REAL,
    "speed" TEXT,
    "coverageNotes" TEXT,
    "weaknesses" TEXT,
    "qualityNotes" TEXT,
    "sourceUrl" TEXT,
    "dataStatus" TEXT NOT NULL DEFAULT 'внесено_вручную',
    "comment" TEXT,
    CONSTRAINT "Competitor_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "demandScore" INTEGER NOT NULL DEFAULT 0,
    "potentialScore" INTEGER NOT NULL DEFAULT 0,
    "competitionScore" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "dataConfidenceLevel" TEXT NOT NULL DEFAULT 'низкая',
    "recommendation" TEXT NOT NULL DEFAULT '',
    "nextAction" TEXT NOT NULL DEFAULT '',
    "missingData" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnalysisResult_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SettlementWebInfo_settlementId_key" ON "SettlementWebInfo"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisResult_settlementId_key" ON "AnalysisResult"("settlementId");
