import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettlementWithDetails } from "@/lib/settlementService";
import { SettlementTabs } from "@/components/SettlementTabs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function SettlementPage({ params }: Props) {
  const { id } = await params;
  const settlement = await getSettlementWithDetails(id);
  if (!settlement) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-[var(--primary)] hover:underline">
          ← К списку
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{settlement.name}</h1>
        <p className="text-sm text-[var(--muted)]">
          {settlement.district || "Район не указан"} · рейтинг {settlement.totalScore}
        </p>
      </div>
      <SettlementTabs settlement={settlement} />
    </div>
  );
}
