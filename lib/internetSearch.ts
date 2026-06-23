import {
  buildOfficialSourceLinks,
  type DataSourceLink,
  isOfficialStatisticsUrl,
  mergeSources,
  pickPrimarySourceUrl,
} from "./officialSources";

export type WebSearchResult = {
  name: string;
  district: string;
  settlementType: string;
  population: number | null;
  coordinates: string;
  sourceUrl: string;
  sources: DataSourceLink[];
  populationFromOfficialStats: boolean;
  sourcesNote: string;
};

/** Убирает «Станица», «Село», «Р.п.» и т.п. — иначе геопоиск не находит НП */
export function extractCoreSettlementName(fullName: string): string {
  let name = fullName.trim();
  const prefixes = [
    /^станица\s+/i,
    /^село\s+/i,
    /^рабочий\s+пос[её]лок\s+/i,
    /^р\.?\s*п\.?\s+/i,
    /^пос[её]лок\s+/i,
    /^хутор\s+/i,
    /^город\s+/i,
  ];
  for (const pattern of prefixes) {
    if (pattern.test(name)) {
      return name.replace(pattern, "").trim() || fullName.trim();
    }
  }
  return name;
}

function formatDistrictForSearch(district: string): string {
  const d = district.trim();
  if (!d) return "";
  if (/район/i.test(d)) return d;
  return `${d} район`;
}

function buildSearchQueries(coreName: string, district?: string): string[] {
  const queries: string[] = [];
  if (district) {
    queries.push(
      `${coreName}, ${formatDistrictForSearch(district)}, Волгоградская область, Россия`
    );
  }
  queries.push(`${coreName}, Волгоградская область, Россия`);
  queries.push(`${coreName}, Россия`);
  return queries;
}

export async function searchSettlementWeb(
  name: string,
  district?: string
): Promise<WebSearchResult> {
  const coreName = extractCoreSettlementName(name);
  const officialLinks = buildOfficialSourceLinks(coreName, district);

  const [nominatimData, wikiData] = await Promise.all([
    fetchNominatim(coreName, district),
    fetchWikipediaRu(coreName, district),
  ]);

  const referenceSources: DataSourceLink[] = [];
  if (wikiData.sourceUrl) {
    referenceSources.push({
      title: wikiData.populationFromOfficialStats
        ? "Википедия (население из официальной статистики)"
        : "Википедия",
      url: wikiData.sourceUrl,
      kind: "reference",
      note: wikiData.populationFromOfficialStats
        ? "Численность ссылается на перепись / Росстат"
        : "Справочная статья",
    });
  }
  if (nominatimData.sourceUrl) {
    referenceSources.push({
      title: "OpenStreetMap",
      url: nominatimData.sourceUrl,
      kind: "open_data",
      note: "Координаты и границы",
    });
  }
  if (wikiData.wikidataUrl) {
    referenceSources.push({
      title: "Wikidata",
      url: wikiData.wikidataUrl,
      kind: "reference",
      note: "Структурированные справочные данные",
    });
  }
  if (wikiData.officialStatsUrl) {
    referenceSources.push({
      title: "Официальная статистика (ссылка из Wikidata)",
      url: wikiData.officialStatsUrl,
      kind: "official",
      note: "Первичный государственный источник",
    });
  }

  const sources = mergeSources(officialLinks, referenceSources);
  const populationFromOfficialStats = Boolean(
    wikiData.populationFromOfficialStats || wikiData.officialStatsUrl
  );

  const sourcesNote = buildSourcesNote(sources, populationFromOfficialStats);

  return {
    name: nominatimData.name || wikiData.name || coreName,
    district: nominatimData.district || district || "",
    settlementType: nominatimData.settlementType || "",
    population: wikiData.population ?? null,
    coordinates: nominatimData.coordinates || "",
    sourceUrl: pickPrimarySourceUrl(sources) || wikiData.sourceUrl || nominatimData.sourceUrl || "",
    sources,
    populationFromOfficialStats,
    sourcesNote,
  };
}

function buildSourcesNote(sources: DataSourceLink[], populationOfficial: boolean): string {
  const officialCount = sources.filter((s) => s.kind === "official").length;
  const lines = [
    `Найдено источников: ${sources.length} (официальных: ${officialCount}).`,
    populationOfficial
      ? "Население: по данным, связанным с официальной статистикой (перепись / Росстат)."
      : "Население: справочное значение — сверьте с Росстатом (ЕМИСС) и подтвердите вручную.",
    "Рекомендуется сверить цифры с ФИАС и ЕМИСС перед подтверждением.",
  ];
  return lines.join(" ");
}

async function fetchNominatim(
  coreName: string,
  district?: string
): Promise<Partial<WebSearchResult>> {
  const queries = buildSearchQueries(coreName, district);

  for (const query of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&accept-language=ru`;
      const res = await fetch(url, {
        headers: { "User-Agent": "ProviderDashboard/1.0 (manager-dashboard)" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = (await res.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
        address?: {
          county?: string;
          state_district?: string;
          village?: string;
          town?: string;
          city?: string;
          hamlet?: string;
        };
      }>;
      const item = data[0];
      if (!item) continue;

      const addr = item.address;
      const settlementType = addr?.village
        ? "село"
        : addr?.town
          ? "посёлок"
          : addr?.hamlet
            ? "хутор"
            : addr?.city
              ? "город"
              : "";

      const county = addr?.county || addr?.state_district || "";
      const districtName = county.replace(/\s*район\s*$/i, "").trim() || county;

      return {
        name: item.display_name.split(",")[0]?.trim() || coreName,
        district: districtName,
        settlementType,
        coordinates: `${item.lat}, ${item.lon}`,
        sourceUrl: `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lon}#map=14/${item.lat}/${item.lon}`,
      };
    } catch {
      continue;
    }
  }

  return {};
}

type WikiFetchResult = {
  name?: string;
  population?: number | null;
  sourceUrl?: string;
  wikidataUrl?: string;
  officialStatsUrl?: string;
  populationFromOfficialStats?: boolean;
};

async function fetchWikipediaRu(
  coreName: string,
  district?: string
): Promise<WikiFetchResult> {
  try {
    const searchQuery = district
      ? `${coreName} ${formatDistrictForSearch(district)}`
      : `${coreName} Волгоградская область`;
    const searchUrl = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=5&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { cache: "no-store" });
    if (!searchRes.ok) return {};

    const searchJson = (await searchRes.json()) as {
      query?: { search?: Array<{ title: string }> };
    };
    const results = searchJson.query?.search ?? [];
    const title =
      results.find((r) =>
        r.title.toLowerCase().includes(coreName.toLowerCase())
      )?.title ?? results[0]?.title;
    if (!title) return {};

    const propsUrl = `https://ru.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageprops&ppprop=wikibase_item&format=json&origin=*`;
    const propsRes = await fetch(propsUrl, { cache: "no-store" });
    if (!propsRes.ok) {
      return {
        name: title,
        sourceUrl: `https://ru.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      };
    }

    const propsJson = (await propsRes.json()) as {
      query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string } }> };
    };
    const pages = propsJson.query?.pages ?? {};
    const page = Object.values(pages)[0];
    const entityId = page?.pageprops?.wikibase_item;

    let population: number | null = null;
    let officialStatsUrl: string | undefined;
    let populationFromOfficialStats = false;

    if (entityId) {
      const wikidata = await fetchWikidataPopulation(entityId);
      population = wikidata.population;
      officialStatsUrl = wikidata.officialStatsUrl;
      populationFromOfficialStats = wikidata.populationFromOfficialStats;
    }

    return {
      name: title,
      population,
      sourceUrl: `https://ru.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      wikidataUrl: entityId ? `https://www.wikidata.org/wiki/${entityId}` : undefined,
      officialStatsUrl,
      populationFromOfficialStats,
    };
  } catch {
    return {};
  }
}

async function fetchWikidataPopulation(entityId: string): Promise<{
  population: number | null;
  officialStatsUrl?: string;
  populationFromOfficialStats: boolean;
}> {
  try {
    const entityRes = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`,
      { cache: "no-store" }
    );
    if (!entityRes.ok) {
      return { population: null, populationFromOfficialStats: false };
    }

    const entityJson = (await entityRes.json()) as {
      entities: Record<
        string,
        {
          claims?: Record<
            string,
            Array<{
              mainsnak?: { datavalue?: { value?: { amount?: string } } };
              references?: Array<{
                snaks?: Record<
                  string,
                  Array<{ datavalue?: { value?: string | { id?: string } } }>
                >;
              }>;
            }>
          >;
        }
      >;
    };

    const claims = entityJson.entities[entityId]?.claims?.P1082 ?? [];
    for (const claim of claims) {
      const amount = claim.mainsnak?.datavalue?.value?.amount;
      if (!amount) continue;

      const parsed = parseInt(amount.replace("+", ""), 10);
      if (!Number.isFinite(parsed)) continue;

      let officialStatsUrl: string | undefined;
      let populationFromOfficialStats = false;

      for (const ref of claim.references ?? []) {
        const snaks = ref.snaks ?? {};
        const urlSnak = snaks.P854?.[0]?.datavalue?.value;
        if (typeof urlSnak === "string") {
          if (isOfficialStatisticsUrl(urlSnak)) {
            officialStatsUrl = urlSnak;
            populationFromOfficialStats = true;
          }
        }
        const statedIn = snaks.P248?.[0]?.datavalue?.value;
        if (
          statedIn &&
          typeof statedIn === "object" &&
          "id" in statedIn &&
          typeof statedIn.id === "string"
        ) {
          const rosstatIds = new Set(["Q3853784", "Q239036", "Q478958"]);
          if (rosstatIds.has(statedIn.id)) {
            populationFromOfficialStats = true;
          }
        }
      }

      return { population: parsed, officialStatsUrl, populationFromOfficialStats };
    }

    return { population: null, populationFromOfficialStats: false };
  } catch {
    return { population: null, populationFromOfficialStats: false };
  }
}
