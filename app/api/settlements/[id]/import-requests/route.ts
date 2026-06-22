import { prisma } from "@/lib/prisma";
import { recalculateSettlement } from "@/lib/settlementService";
import { NextResponse } from "next/server";
import Papa from "papaparse";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: parsed.errors[0].message }, { status: 400 });
  }

  const rows = parsed.data.filter((row) => Object.values(row).some(Boolean));
  let imported = 0;

  for (const row of rows) {
    const street = row["Улица"] || row.street || "";
    const house = row["Дом"] || row.house || "";
    const status = row["Статус"] || row.status || "оставил заявку";
    const source = row["Источник"] || row.source || "импорт из таблицы";
    const ready =
      (row["Готов оплатить"] || row.readyToPay || "").toLowerCase() === "да" ||
      (row["Готов оплатить подключение"] || "").toLowerCase() === "да";
    const confirmed =
      status.toLowerCase().includes("подтверж") ||
      (row["Подтверждена"] || row.confirmed || "").toLowerCase() === "да";

    await prisma.demandRequest.create({
      data: {
        settlementId: id,
        street,
        house,
        status,
        source,
        isConfirmed: confirmed,
        readyToPayConnection: ready,
        comment: row["Комментарий"] || row.comment || "",
      },
    });
    imported += 1;
  }

  await recalculateSettlement(id);
  return NextResponse.json({ imported });
}
