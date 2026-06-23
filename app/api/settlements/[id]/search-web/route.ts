import { sourcesToJson } from "@/lib/officialSources";
import { searchSettlementWeb } from "@/lib/internetSearch";
import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const settlement = await prisma.settlement.findUnique({ where: { id } });
    if (!settlement) {
      return NextResponse.json({ error: "Населённый пункт не найден" }, { status: 404 });
    }

    const result = await searchSettlementWeb(settlement.name, settlement.district);

    const webInfo = await prisma.settlementWebInfo.upsert({
      where: { settlementId: id },
      create: {
        settlementId: id,
        population: result.population,
        coordinates: result.coordinates,
        sourceUrl: result.sourceUrl,
        sourcesJson: sourcesToJson(result.sources),
        buildingType: result.settlementType || undefined,
        dataStatus: result.populationFromOfficialStats
          ? "найдено_автоматически"
          : "требует_проверки",
        comment: result.sourcesNote,
      },
      update: {
        population: result.population ?? undefined,
        coordinates: result.coordinates || undefined,
        sourceUrl: result.sourceUrl,
        sourcesJson: sourcesToJson(result.sources),
        buildingType: result.settlementType || undefined,
        dataStatus: result.populationFromOfficialStats
          ? "найдено_автоматически"
          : "требует_проверки",
        comment: result.sourcesNote,
      },
    });

    await prisma.settlement.update({
      where: { id },
      data: {
        district: result.district || settlement.district,
        settlementType: result.settlementType || settlement.settlementType,
      },
    });

    await recalculateSettlement(id);
    return NextResponse.json(webInfo);
  } catch (error) {
    console.error("search-web error:", error);
    const message =
      error instanceof Error ? error.message : "Не удалось собрать данные из источников";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
