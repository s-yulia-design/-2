export type SourceKind = "official" | "reference" | "open_data";

export type DataSourceLink = {
  title: string;
  url: string;
  kind: SourceKind;
  note?: string;
};

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  official: "Официальный",
  reference: "Справочный",
  open_data: "Открытые данные",
};

/** Ссылки на государственные и официальные реестры для ручной проверки */
export function buildOfficialSourceLinks(
  coreName: string,
  district?: string
): DataSourceLink[] {
  const region = "Волгоградская область";
  const districtPart = district?.trim() ? ` ${formatDistrictLabel(district)}` : "";
  const searchPhrase = `${coreName}${districtPart} ${region}`.trim();

  return [
    {
      title: "Росстат (ЕМИСС)",
      url: `https://www.fedstat.ru/search?text=${encodeURIComponent(searchPhrase)}`,
      kind: "official",
      note: "Официальная государственная статистика",
    },
    {
      title: "ФИАС — адресный реестр",
      url: `https://fias.nalog.ru/ExtendedSearch/ExtendedSearchResult?searchString=${encodeURIComponent(searchPhrase)}`,
      kind: "official",
      note: "Федеральная информационная адресная система (ФНС)",
    },
    {
      title: "Портал открытых данных РФ",
      url: `https://data.gov.ru/search?search=${encodeURIComponent(searchPhrase)}`,
      kind: "open_data",
      note: "data.gov.ru",
    },
    {
      title: "Правительство Волгоградской области",
      url: "https://volgogradobl.ru/",
      kind: "official",
      note: "Региональный официальный портал",
    },
  ];
}

function formatDistrictLabel(district: string): string {
  const d = district.trim();
  if (!d) return "";
  if (/район/i.test(d)) return d;
  return `${d} район`;
}

export function isOfficialStatisticsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("rosstat") ||
    lower.includes("gks.ru") ||
    lower.includes("fedstat.ru") ||
    lower.includes("emiss") ||
    lower.includes("перспись") ||
    lower.includes("census")
  );
}

export function mergeSources(...groups: DataSourceLink[][]): DataSourceLink[] {
  const seen = new Set<string>();
  const result: DataSourceLink[] = [];
  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      result.push(item);
    }
  }
  return result;
}

export function sourcesToJson(sources: DataSourceLink[]): string {
  return JSON.stringify(sources);
}

export function sourcesFromJson(raw: string | null | undefined): DataSourceLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as DataSourceLink[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pickPrimarySourceUrl(sources: DataSourceLink[]): string {
  const official = sources.find((s) => s.kind === "official");
  if (official) return official.url;
  const reference = sources.find((s) => s.kind === "reference");
  if (reference) return reference.url;
  return sources[0]?.url ?? "";
}
