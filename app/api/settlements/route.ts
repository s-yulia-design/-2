import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";

export async function GET() {
  const settlements = await prisma.settlement.findMany({
    include: {
      webInfo: true,
      demandRequests: true,
      competitors: true,
      analysisResult: true,
    },
    orderBy: { totalScore: "desc" },
  });
  return NextResponse.json(settlements);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; district?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  const settlement = await prisma.settlement.create({
    data: {
      name: body.name.trim(),
      district: body.district?.trim() || "",
      webInfo: { create: {} },
      analysisResult: { create: {} },
    },
  });

  await recalculateSettlement(settlement.id);
  return NextResponse.json(settlement, { status: 201 });
}
