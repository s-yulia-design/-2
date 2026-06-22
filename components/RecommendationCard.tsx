import type { AnalysisResult } from "@prisma/client";
import { getDemandStats } from "@/lib/scoring";
import type { DemandRequest } from "@prisma/client";

type Props = {
  analysis: AnalysisResult | null;
  requests: DemandRequest[];
};

export function RecommendationCard({ analysis, requests }: Props) {
  const stats = getDemandStats(requests);
  const missing: string[] = analysis?.missingData
    ? (JSON.parse(analysis.missingData) as string[])
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Итоговая оценка</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="text-sm text-[var(--muted)]">Рейтинг</p>
          <p className="text-3xl font-bold text-[var(--primary)]">
            {analysis?.totalScore ?? 0} / 100
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--muted)]">Достоверность</p>
          <p className="text-xl font-semibold">
            {analysis?.dataConfidenceLevel ?? "низкая"}
          </p>
        </div>
      </div>

      <div className="card">
        <p className="text-sm text-[var(--muted)]">Рекомендация</p>
        <p className="mt-1 text-lg font-semibold">
          {analysis?.recommendation || "Недостаточно данных"}
        </p>
        <p className="mt-3 text-sm">{analysis?.nextAction}</p>
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold">Детализация баллов</h3>
        <ul className="space-y-1 text-sm">
          <li>Спрос (заявки): {analysis?.demandScore ?? 0}</li>
          <li>Потенциал НП: {analysis?.potentialScore ?? 0}</li>
          <li>Конкуренция: {analysis?.competitionScore ?? 0}</li>
          <li>Достоверность: {analysis?.confidenceScore ?? 0}</li>
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Заявок: {stats.total}, подтверждённых: {stats.confirmed}, с адресом:{" "}
          {stats.withAddress}, готовы оплатить: {stats.readyToPay}
        </p>
      </div>

      {missing.length > 0 && (
        <div className="card border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-900">Не хватает данных</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-900">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
