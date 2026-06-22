import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    population?: number | null;
    householdsCount?: number | null;
    coordinates?: string;
    socialObjects?: string;
    businessObjects?: string;
    buildingType?: string;
    sourceUrl?: string;
    dataStatus?: string;
    comment?: string;
    confirm?: boolean;
  };

  const webInfo = await prisma.settlementWebInfo.upsert({
    where: { settlementId: id },
    create: {
      settlementId: id,
      population: body.population ?? null,
      householdsCount: body.householdsCount ?? null,
      coordinates: body.coordinates ?? "",
      socialObjects: body.socialObjects ?? "",
      businessObjects: body.businessObjects ?? "",
      buildingType: body.buildingType ?? "",
      sourceUrl: body.sourceUrl ?? "",
      dataStatus: body.confirm ? "подтверждено" : body.dataStatus ?? "внесено_вручную",
      comment: body.comment ?? "",
    },
    update: {
      population: body.population ?? undefined,
      householdsCount: body.householdsCount ?? undefined,
      coordinates: body.coordinates,
      socialObjects: body.socialObjects,
      businessObjects: body.businessObjects,
      buildingType: body.buildingType,
      sourceUrl: body.sourceUrl,
      dataStatus: body.confirm ? "подтверждено" : body.dataStatus,
      comment: body.comment,
    },
  });

  await recalculateSettlement(id);
  return NextResponse.json(webInfo);
}
