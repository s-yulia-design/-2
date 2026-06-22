import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const competitors = await prisma.competitor.findMany({
    where: { settlementId: id },
  });
  return NextResponse.json(competitors);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    technology?: string;
    tariff?: number | null;
    speed?: string;
    coverageNotes?: string;
    weaknesses?: string;
    qualityNotes?: string;
    sourceUrl?: string;
    dataStatus?: string;
    comment?: string;
    confirm?: boolean;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  const competitor = await prisma.competitor.create({
    data: {
      settlementId: id,
      name: body.name.trim(),
      technology: body.technology ?? "неизвестно",
      tariff: body.tariff ?? null,
      speed: body.speed ?? "",
      coverageNotes: body.coverageNotes ?? "",
      weaknesses: body.weaknesses ?? "",
      qualityNotes: body.qualityNotes ?? "",
      sourceUrl: body.sourceUrl ?? "",
      dataStatus: body.confirm ? "подтверждено" : body.dataStatus ?? "внесено_вручную",
      comment: body.comment ?? "",
    },
  });

  await recalculateSettlement(id);
  return NextResponse.json(competitor, { status: 201 });
}
