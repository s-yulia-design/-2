import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; competitorId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, competitorId } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const updated = await prisma.competitor.update({
    where: { id: competitorId },
    data: {
      name: body.name as string | undefined,
      technology: body.technology as string | undefined,
      tariff: body.tariff as number | null | undefined,
      speed: body.speed as string | undefined,
      coverageNotes: body.coverageNotes as string | undefined,
      weaknesses: body.weaknesses as string | undefined,
      qualityNotes: body.qualityNotes as string | undefined,
      sourceUrl: body.sourceUrl as string | undefined,
      dataStatus: body.confirm ? "подтверждено" : (body.dataStatus as string | undefined),
      comment: body.comment as string | undefined,
    },
  });

  await recalculateSettlement(id);
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, competitorId } = await params;
  await prisma.competitor.delete({ where: { id: competitorId } });
  await recalculateSettlement(id);
  return NextResponse.json({ ok: true });
}
