import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const requests = await prisma.demandRequest.findMany({
    where: { settlementId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    street?: string;
    house?: string;
    source?: string;
    status?: string;
    isConfirmed?: boolean;
    readyToPayConnection?: boolean;
    readyToSignContract?: boolean;
    isInitiativeGroup?: boolean;
    comment?: string;
  };

  const requestRow = await prisma.demandRequest.create({
    data: {
      settlementId: id,
      street: body.street ?? "",
      house: body.house ?? "",
      source: body.source ?? "ручной ввод",
      status: body.status ?? "оставил заявку",
      isConfirmed: Boolean(body.isConfirmed),
      readyToPayConnection: Boolean(body.readyToPayConnection),
      readyToSignContract: Boolean(body.readyToSignContract),
      isInitiativeGroup: Boolean(body.isInitiativeGroup),
      comment: body.comment ?? "",
    },
  });

  await recalculateSettlement(id);
  return NextResponse.json(requestRow, { status: 201 });
}
