import { searchSettlementWeb } from "@/lib/internetSearch";
import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const settlement = await prisma.settlement.findUnique({ where: { id } });
  if (!settlement) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const result = await searchSettlementWeb(settlement.name, settlement.district);

  const webInfo = await prisma.settlementWebInfo.upsert({
    where: { settlementId: id },
    create: {
      settlementId: id,
      population: result.population,
      coordinates: result.coordinates,
      sourceUrl: result.sourceUrl,
      dataStatus: "найдено_автоматически",
    },
    update: {
      population: result.population ?? undefined,
      coordinates: result.coordinates || undefined,
      sourceUrl: result.sourceUrl,
      dataStatus: "найдено_автоматически",
    },
  });

  if (result.district) {
    await prisma.settlement.update({
      where: { id },
      data: {
        district: result.district || settlement.district,
        settlementType: result.settlementType || settlement.settlementType,
      },
    });
  }

  await recalculateSettlement(id);
  return NextResponse.json(webInfo);
}
