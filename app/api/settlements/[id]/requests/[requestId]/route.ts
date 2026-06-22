import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; requestId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id, requestId } = await params;
  await prisma.demandRequest.delete({ where: { id: requestId } });
  await recalculateSettlement(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, requestId } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const updated = await prisma.demandRequest.update({
    where: { id: requestId },
    data: {
      street: body.street as string | undefined,
      house: body.house as string | undefined,
      source: body.source as string | undefined,
      status: body.status as string | undefined,
      isConfirmed: body.isConfirmed as boolean | undefined,
      readyToPayConnection: body.readyToPayConnection as boolean | undefined,
      readyToSignContract: body.readyToSignContract as boolean | undefined,
      isInitiativeGroup: body.isInitiativeGroup as boolean | undefined,
      isDuplicate: body.isDuplicate as boolean | undefined,
      comment: body.comment as string | undefined,
    },
  });

  await recalculateSettlement(id);
  return NextResponse.json(updated);
}
