import { PrismaClient } from "@prisma/client";
import { calculateAnalysis } from "../lib/scoring";

const prisma = new PrismaClient();

const OLD_DEMO_NAMES = ["Городище", "Романовка", "Ерзовка"];

const VOLGOGRAD_SETTLEMENTS = [
  {
    name: "Станица Клетская",
    district: "Клетский",
    settlementType: "станица",
  },
  {
    name: "Рабочий посёлок Рудня",
    district: "Руднянский",
    settlementType: "посёлок",
  },
  {
    name: "Р.п. Чернышковский",
    district: "Чернышковский",
    settlementType: "посёлок",
  },
  {
    name: "Станица Кумылженская",
    district: "Кумылженский",
    settlementType: "станица",
  },
  {
    name: "Село Старая Полтавка",
    district: "Старополтавский",
    settlementType: "село",
  },
  {
    name: "Станица Нехаевская",
    district: "Нехаевский",
    settlementType: "станица",
  },
] as const;

async function recalculateSettlement(settlementId: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: {
      webInfo: true,
      demandRequests: true,
      competitors: true,
      analysisResult: true,
    },
  });
  if (!settlement) return;

  const analysis = calculateAnalysis({
    requests: settlement.demandRequests,
    webInfo: settlement.webInfo,
    competitors: settlement.competitors,
  });
  const priorityStatus =
    analysis.totalScore >= 75
      ? "1 очередь"
      : analysis.totalScore >= 50
        ? "2 очередь"
        : analysis.totalScore >= 25
          ? "наблюдать"
          : "отложить";

  await prisma.analysisResult.upsert({
    where: { settlementId: settlement.id },
    create: {
      settlementId: settlement.id,
      demandScore: analysis.demandScore,
      potentialScore: analysis.potentialScore,
      competitionScore: analysis.competitionScore,
      confidenceScore: analysis.confidenceScore,
      totalScore: analysis.totalScore,
      dataConfidenceLevel: analysis.dataConfidenceLevel,
      recommendation: analysis.recommendation,
      nextAction: analysis.nextAction,
      missingData: JSON.stringify(analysis.missingData),
    },
    update: {
      demandScore: analysis.demandScore,
      potentialScore: analysis.potentialScore,
      competitionScore: analysis.competitionScore,
      confidenceScore: analysis.confidenceScore,
      totalScore: analysis.totalScore,
      dataConfidenceLevel: analysis.dataConfidenceLevel,
      recommendation: analysis.recommendation,
      nextAction: analysis.nextAction,
      missingData: JSON.stringify(analysis.missingData),
    },
  });

  await prisma.settlement.update({
    where: { id: settlement.id },
    data: {
      totalScore: analysis.totalScore,
      recommendation: analysis.recommendation,
      dataConfidenceLevel: analysis.dataConfidenceLevel,
      priorityStatus,
    },
  });
}

async function main() {
  await prisma.settlement.deleteMany({
    where: { name: { in: [...OLD_DEMO_NAMES] } },
  });

  const settlementCount = await prisma.settlement.count();
  const isFreshDatabase = settlementCount === 0;

  if (isFreshDatabase) {
    await prisma.demandRequest.deleteMany();
    await prisma.competitor.deleteMany();
    await prisma.analysisResult.deleteMany();
    await prisma.settlementWebInfo.deleteMany();
    await prisma.settlement.deleteMany();
  }

  for (const item of VOLGOGRAD_SETTLEMENTS) {
    const existing = await prisma.settlement.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      await prisma.settlement.create({
        data: {
          name: item.name,
          district: item.district,
          settlementType: item.settlementType,
          analysisResult: { create: {} },
        },
      });
    } else {
      await prisma.settlement.update({
        where: { id: existing.id },
        data: {
          district: item.district,
          settlementType: item.settlementType,
        },
      });
    }
  }

  const settlements = await prisma.settlement.findMany({
    where: { name: { in: VOLGOGRAD_SETTLEMENTS.map((s) => s.name) } },
    select: { id: true },
  });

  for (const settlement of settlements) {
    await recalculateSettlement(settlement.id);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
