import type { Competitor, DemandRequest, SettlementWebInfo } from "@prisma/client";

export type DemandStats = {
  total: number;
  confirmed: number;
  withAddress: number;
  readyToPay: number;
  initiativeGroup: number;
};

export function getDemandStats(requests: DemandRequest[]): DemandStats {
  return {
    total: requests.filter((r) => !r.isDuplicate).length,
    confirmed: requests.filter((r) => r.isConfirmed && !r.isDuplicate).length,
    withAddress: requests.filter(
      (r) => !r.isDuplicate && r.street.trim() && r.house.trim()
    ).length,
    readyToPay: requests.filter((r) => r.readyToPayConnection && !r.isDuplicate).length,
    initiativeGroup: requests.filter((r) => r.isInitiativeGroup && !r.isDuplicate).length,
  };
}

export function scoreDemand(stats: DemandStats): number {
  const confirmed = stats.confirmed;
  let score = 0;
  if (confirmed === 0) score = stats.total > 0 ? 15 : 0;
  else if (confirmed <= 5) score = 25;
  else if (confirmed <= 20) score = 50;
  else if (confirmed <= 50) score = 75;
  else score = 100;

  if (stats.total > 0 && stats.confirmed / stats.total > 0.5) score = Math.min(100, score + 10);
  if (stats.initiativeGroup > 0) score = Math.min(100, score + 10);
  if (stats.readyToPay > 0) score = Math.min(100, score + 10);
  return Math.min(100, score);
}

export function scorePotential(webInfo: SettlementWebInfo | null): number {
  if (!webInfo) return 10;
  const households = webInfo.householdsCount ?? 0;
  const population = webInfo.population ?? 0;
  let score = 20;
  if (households >= 300 || population >= 1000) score = 100;
  else if (households >= 101 || population >= 500) score = 70;
  else if (households >= 30 || population >= 150) score = 40;
  if (webInfo.socialObjects?.trim()) score = Math.min(100, score + 5);
  if (webInfo.businessObjects?.trim()) score = Math.min(100, score + 5);
  if (webInfo.dataStatus !== "подтверждено") score = Math.max(0, score - 15);
  return score;
}

export function scoreCompetition(competitors: Competitor[]): number {
  if (competitors.length === 0) return 50;
  const confirmed = competitors.filter((c) => c.dataStatus === "подтверждено");
  const list = confirmed.length > 0 ? confirmed : competitors;
  const hasStrong = list.some(
    (c) =>
      c.technology === "ВОЛС" &&
      (c.tariff ?? 9999) < 600 &&
      !c.weaknesses?.trim()
  );
  const hasWeak = list.some((c) => Boolean(c.weaknesses?.trim()));
  if (hasStrong && !hasWeak) return 20;
  if (hasWeak) return 60;
  if (list.length <= 1) return 80;
  return 50;
}

export function scoreConfidence(input: {
  webInfo: SettlementWebInfo | null;
  requests: DemandRequest[];
  competitors: Competitor[];
}): { score: number; level: string; missing: string[] } {
  const missing: string[] = [];
  if (!input.webInfo?.population && !input.webInfo?.householdsCount) {
    missing.push("население или количество домов");
  }
  if (input.webInfo?.dataStatus !== "подтверждено") {
    missing.push("подтверждённая справка о населённом пункте");
  }
  if (input.requests.filter((r) => r.isConfirmed).length === 0) {
    missing.push("подтверждённые заявки");
  }
  if (input.competitors.length === 0) {
    missing.push("данные о конкурентах");
  } else if (!input.competitors.some((c) => c.dataStatus === "подтверждено")) {
    missing.push("подтверждённые данные о конкурентах");
  }

  let level = "низкая";
  if (missing.length <= 1) level = "высокая";
  else if (missing.length <= 3) level = "средняя";

  const score = level === "высокая" ? 100 : level === "средняя" ? 60 : 25;
  return { score, level, missing };
}

export function getRecommendation(totalScore: number, missing: string[]): {
  recommendation: string;
  nextAction: string;
} {
  let recommendation: string;
  let nextAction: string;

  if (totalScore >= 75) {
    recommendation = "Перспективно — передать на техобследование";
    nextAction = "Собрать подтверждённые заявки с адресами и передать техническому специалисту.";
  } else if (totalScore >= 50) {
    recommendation = "Есть потенциал — собрать больше заявок";
    nextAction = "Провести обзвон и уточнить готовность жителей оплатить подключение.";
  } else if (totalScore >= 25) {
    recommendation = "Слабый сигнал — наблюдать";
    nextAction = "Продолжить сбор заявок и уточнить данные о конкурентах.";
  } else {
    recommendation = "Нецелесообразно на текущих данных";
    nextAction = "Собрать недостающую информацию или отложить анализ.";
  }

  if (missing.length > 0) {
    nextAction = `Не хватает: ${missing.join(", ")}. ${nextAction}`;
  }

  return { recommendation, nextAction };
}

export function calculateAnalysis(input: {
  requests: DemandRequest[];
  webInfo: SettlementWebInfo | null;
  competitors: Competitor[];
}) {
  const demandStats = getDemandStats(input.requests);
  const demandScore = scoreDemand(demandStats);
  const potentialScore = scorePotential(input.webInfo);
  const competitionScore = scoreCompetition(input.competitors);
  const confidence = scoreConfidence(input);

  const totalScore = Math.round(
    demandScore * 0.45 +
      potentialScore * 0.25 +
      competitionScore * 0.2 +
      confidence.score * 0.1
  );

  const { recommendation, nextAction } = getRecommendation(
    totalScore,
    confidence.missing
  );

  return {
    demandScore,
    potentialScore,
    competitionScore,
    confidenceScore: confidence.score,
    totalScore,
    dataConfidenceLevel: confidence.level,
    recommendation,
    nextAction,
    missingData: confidence.missing,
    demandStats,
  };
}
