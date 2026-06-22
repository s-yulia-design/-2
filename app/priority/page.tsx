import { prisma } from "@/lib/prisma";
import { getDemandStats } from "@/lib/scoring";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PriorityPage() {
  const settlements = await prisma.settlement.findMany({
    include: {
      webInfo: true,
      demandRequests: true,
      competitors: true,
      analysisResult: true,
    },
    orderBy: [{ totalScore: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Сравнение населённых пунктов</h1>
        <p className="text-sm text-[var(--muted)]">
          Какие населённые пункты смотреть в первую очередь
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Населённый пункт</th>
              <th>Рейтинг</th>
              <th>Подтв. заявки</th>
              <th>Население</th>
              <th>Очередь</th>
              <th>Рекомендация</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s, index) => {
              const stats = getDemandStats(s.demandRequests);
              return (
                <tr key={s.id}>
                  <td>{index + 1}</td>
                  <td>
                    <Link
                      href={`/settlements/${s.id}`}
                      className="font-semibold text-[var(--primary)] hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td>{s.totalScore}</td>
                  <td>{stats.confirmed}</td>
                  <td>{s.webInfo?.population ?? "—"}</td>
                  <td>{s.priorityStatus || "—"}</td>
                  <td className="max-w-sm">{s.recommendation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
