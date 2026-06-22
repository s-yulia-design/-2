import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: {
      webInfo: true,
      demandRequests: { orderBy: { createdAt: "desc" } },
      competitors: true,
      analysisResult: true,
    },
  });
  if (!settlement) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  return NextResponse.json(settlement);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    district?: string;
    settlementType?: string;
    status?: string;
  };

  const settlement = await prisma.settlement.update({
    where: { id },
    data: {
      name: body.name,
      district: body.district,
      settlementType: body.settlementType,
      status: body.status,
    },
  });

  await recalculateSettlement(id);
  return NextResponse.json(settlement);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await prisma.settlement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
