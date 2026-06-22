import { prisma } from "@/lib/prisma";
import { calculateAnalysis } from "@/lib/scoring";

export async function recalculateSettlement(settlementId: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: {
      webInfo: true,
      demandRequests: true,
      competitors: true,
      analysisResult: true,
    },
  });

  if (!settlement) return null;

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
    where: { settlementId },
    create: {
      settlementId,
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
    where: { id: settlementId },
    data: {
      totalScore: analysis.totalScore,
      recommendation: analysis.recommendation,
      dataConfidenceLevel: analysis.dataConfidenceLevel,
      priorityStatus,
    },
  });

  return analysis;
}

export async function getSettlementsWithDetails() {
  return prisma.settlement.findMany({
    include: {
      webInfo: true,
      demandRequests: true,
      competitors: true,
      analysisResult: true,
    },
    orderBy: { totalScore: "desc" },
  });
}

export async function getSettlementWithDetails(id: string) {
  return prisma.settlement.findUnique({
    where: { id },
    include: {
      webInfo: true,
      demandRequests: { orderBy: { createdAt: "desc" } },
      competitors: true,
      analysisResult: true,
    },
  });
}
