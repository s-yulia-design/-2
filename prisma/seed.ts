import { PrismaClient } from "@prisma/client";
import { calculateAnalysis } from "../lib/scoring";

const prisma = new PrismaClient();

async function main() {
  await prisma.demandRequest.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.analysisResult.deleteMany();
  await prisma.settlementWebInfo.deleteMany();
  await prisma.settlement.deleteMany();

  const gorodishche = await prisma.settlement.create({
    data: {
      name: "Городище",
      district: "Городищенский",
      settlementType: "село",
      webInfo: {
        create: {
          population: 3200,
          householdsCount: 1100,
          socialObjects: "школа, ФАП, администрация",
          sourceUrl: "https://ru.wikipedia.org",
          dataStatus: "подтверждено",
        },
      },
      demandRequests: {
        create: [
          {
            street: "Центральная",
            house: "15",
            status: "готов оплатить подключение",
            source: "звонок",
            isConfirmed: true,
            readyToPayConnection: true,
          },
          {
            street: "Школьная",
            house: "8",
            status: "подтверждённый интерес",
            source: "сайт",
            isConfirmed: true,
          },
          {
            street: "Молодёжная",
            house: "3",
            status: "оставил заявку",
            source: "соцсети",
            isConfirmed: false,
          },
        ],
      },
      competitors: {
        create: [
          {
            name: "РадиоИнтернет",
            technology: "радиоканал",
            tariff: 800,
            speed: "до 50 Мбит/с",
            weaknesses: "жалобы на стабильность",
            sourceUrl: "https://example.com",
            dataStatus: "подтверждено",
          },
        ],
      },
      analysisResult: { create: {} },
    },
    include: {
      webInfo: true,
      demandRequests: true,
      competitors: true,
    },
  });

  const maly = await prisma.settlement.create({
    data: {
      name: "Романовка",
      district: "Ольховский",
      settlementType: "хутор",
      webInfo: {
        create: {
          population: 120,
          householdsCount: 45,
          dataStatus: "найдено_автоматически",
        },
      },
      demandRequests: {
        create: [
          {
            street: "Садовая",
            house: "2",
            status: "интересуется",
            source: "звонок",
            isConfirmed: false,
          },
        ],
      },
      competitors: {
        create: [
          {
            name: "МТС",
            technology: "мобильный интернет",
            tariff: 500,
            speed: "4G",
            dataStatus: "внесено_вручную",
          },
        ],
      },
      analysisResult: { create: {} },
    },
    include: {
      webInfo: true,
      demandRequests: true,
      competitors: true,
    },
  });

  const perspect = await prisma.settlement.create({
    data: {
      name: "Ерзовка",
      district: "Камышинский",
      settlementType: "село",
      webInfo: {
        create: {
          population: 890,
          householdsCount: 310,
          socialObjects: "школа, магазин",
          dataStatus: "подтверждено",
        },
      },
      demandRequests: {
        create: Array.from({ length: 12 }).map((_, i) => ({
          street: `Улица ${i + 1}`,
          house: String(i + 1),
          status: i < 8 ? "подтверждённый интерес" : "оставил заявку",
          source: "обход домов",
          isConfirmed: i < 8,
          readyToPayConnection: i < 4,
        })),
      },
      competitors: { create: [] },
      analysisResult: { create: {} },
    },
    include: {
      webInfo: true,
      demandRequests: true,
      competitors: true,
    },
  });

  for (const settlement of [gorodishche, maly, perspect]) {
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

    await prisma.analysisResult.update({
      where: { settlementId: settlement.id },
      data: {
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
