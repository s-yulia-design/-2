import { prisma } from "@/lib/prisma";
import { getDemandStats } from "@/lib/scoring";
import Link from "next/link";
import { AddSettlementForm } from "@/components/AddSettlementForm";

export const dynamic = "force-dynamic";

function scoreBadge(score: number) {
  if (score >= 75) return "badge badge-green";
  if (score >= 50) return "badge badge-yellow";
  return "badge badge-red";
}

export default async function HomePage() {
  const settlements = await prisma.settlement.findMany({
    include: {
      webInfo: true,
      demandRequests: true,
      competitors: true,
      analysisResult: true,
    },
    orderBy: { totalScore: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Населённые пункты</h1>
          <p className="text-sm text-[var(--muted)]">
            Спрос, справка из интернета и конкуренты — для первичной оценки
          </p>
        </div>
        <AddSettlementForm />
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Населённый пункт</th>
              <th>Район</th>
              <th>Заявки</th>
              <th>Подтв.</th>
              <th>Население</th>
              <th>Конкуренты</th>
              <th>Рейтинг</th>
              <th>Достоверность</th>
              <th>Рекомендация</th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[var(--muted)]">
                  Нет населённых пунктов. Добавьте первый.
                </td>
              </tr>
            ) : (
              settlements.map((s) => {
                const stats = getDemandStats(s.demandRequests);
                const competitorLabel =
                  s.competitors.length === 0
                    ? "неизвестно"
                    : s.competitors.length === 1
                      ? "1 провайдер"
                      : `${s.competitors.length} провайдера`;
                return (
                  <tr key={s.id}>
                    <td>
                      <Link
                        href={`/settlements/${s.id}`}
                        className="font-semibold text-[var(--primary)] hover:underline"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td>{s.district || "—"}</td>
                    <td>{stats.total}</td>
                    <td>{stats.confirmed}</td>
                    <td>{s.webInfo?.population ?? "—"}</td>
                    <td>{competitorLabel}</td>
                    <td>
                      <span className={scoreBadge(s.totalScore)}>{s.totalScore}</span>
                    </td>
                    <td>{s.dataConfidenceLevel}</td>
                    <td className="max-w-xs">{s.recommendation || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
