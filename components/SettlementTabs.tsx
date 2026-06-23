"use client";

import { useState } from "react";
import { SettlementWebInfoBlock } from "@/components/SettlementWebInfoBlock";
import { DemandBlock } from "@/components/DemandBlock";
import { CompetitorsBlock } from "@/components/CompetitorsBlock";
import { RecommendationCard } from "@/components/RecommendationCard";
import { InactiveBlockPlaceholder } from "@/components/InactiveBlockPlaceholder";
import type {
  AnalysisResult,
  Competitor,
  DemandRequest,
  Settlement,
  SettlementWebInfo,
} from "@prisma/client";

type SettlementFull = Settlement & {
  webInfo: SettlementWebInfo | null;
  demandRequests: DemandRequest[];
  competitors: Competitor[];
  analysisResult: AnalysisResult | null;
};

const TABS = [
  {
    id: "web",
    label: "Справка",
    hint: "Данные из интернета и ручной ввод о населённом пункте",
  },
  {
    id: "requests",
    label: "Заявки",
    hint: "Спрос жителей — вручную или импорт из CSV",
  },
  {
    id: "competitors",
    label: "Конкуренты",
    hint: "Провайдеры, которые уже работают в НП",
  },
  { id: "technical", label: "Техника", hint: "Пока недоступно" },
  { id: "economics", label: "Экономика", hint: "Пока недоступно" },
  { id: "summary", label: "Итог", hint: "Рейтинг и рекомендация" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettlementTabs({ settlement }: { settlement: SettlementFull }) {
  const [tab, setTab] = useState<TabId>("web");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab(t.id)}
            title={t.hint}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-[var(--muted)]">
        {TABS.find((t) => t.id === tab)?.hint}
      </p>

      <div className="card">
        {tab === "web" && (
          <SettlementWebInfoBlock
            settlementId={settlement.id}
            webInfo={settlement.webInfo}
          />
        )}
        {tab === "requests" && (
          <DemandBlock settlementId={settlement.id} requests={settlement.demandRequests} />
        )}
        {tab === "competitors" && (
          <CompetitorsBlock
            settlementId={settlement.id}
            competitors={settlement.competitors}
          />
        )}
        {tab === "technical" && (
          <InactiveBlockPlaceholder title="Техническая оценка" />
        )}
        {tab === "economics" && (
          <InactiveBlockPlaceholder title="Экономика и окупаемость" />
        )}
        {tab === "summary" && (
          <RecommendationCard
            analysis={settlement.analysisResult}
            requests={settlement.demandRequests}
          />
        )}
      </div>
    </div>
  );
}
