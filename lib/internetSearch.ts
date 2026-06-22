export type WebSearchResult = {
  name: string;
  district: string;
  settlementType: string;
  population: number | null;
  coordinates: string;
  sourceUrl: string;
};

export async function searchSettlementWeb(
  name: string,
  district?: string
): Promise<WebSearchResult> {
  const searchName = district ? `${name}, ${district}, Волгоградская область` : `${name}, Волгоградская область`;

  const [wikiData, nominatimData] = await Promise.all([
    fetchWikidata(name, district),
    fetchNominatim(searchName),
  ]);

  return {
    name: wikiData.name || nominatimData.name || name,
    district: nominatimData.district || district || "",
    settlementType: wikiData.settlementType || nominatimData.settlementType || "",
    population: wikiData.population ?? null,
    coordinates: nominatimData.coordinates || wikiData.coordinates || "",
    sourceUrl: wikiData.sourceUrl || nominatimData.sourceUrl || "https://www.openstreetmap.org",
  };
}

async function fetchWikidata(name: string, district?: string): Promise<Partial<WebSearchResult>> {
  try {
    const query = district
      ? `${name} ${district} Волгоградская область`
      : `${name} Волгоградская область`;
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=ru&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { next: { revalidate: 3600 } });
    if (!searchRes.ok) return {};
    const searchJson = (await searchRes.json()) as {
      search?: Array<{ id: string; label: string }>;
    };
    const entityId = searchJson.search?.[0]?.id;
    if (!entityId) return {};

    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
    const entityRes = await fetch(entityUrl, { next: { revalidate: 3600 } });
    if (!entityRes.ok) return { name: searchJson.search?.[0]?.label };
    const entityJson = (await entityRes.json()) as {
      entities: Record<string, { claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: { amount?: string } } } }>> }>;
    };
    const entity = entityJson.entities[entityId];
    const populationClaim = entity?.claims?.P1082?.[0]?.mainsnak?.datavalue?.value?.amount;
    const population = populationClaim ? parseInt(populationClaim.replace("+", ""), 10) : null;

    return {
      name: searchJson.search?.[0]?.label || name,
      population: Number.isFinite(population) ? population : null,
      sourceUrl: `https://www.wikidata.org/wiki/${entityId}`,
      settlementType: "",
      coordinates: "",
    };
  } catch {
    return {};
  }
}

async function fetchNominatim(query: string): Promise<Partial<WebSearchResult>> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&accept-language=ru`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ProviderDashboard/1.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      address?: { county?: string; state_district?: string; village?: string; town?: string; city?: string };
    }>;
    const item = data[0];
    if (!item) return {};

    const addr = item.address;
    const settlementType = addr?.village
      ? "село"
      : addr?.town
        ? "посёлок"
        : addr?.city
          ? "город"
          : "";
    const district = addr?.county || addr?.state_district || "";

    return {
      name: item.display_name.split(",")[0],
      district,
      settlementType,
      coordinates: `${item.lat}, ${item.lon}`,
      sourceUrl: `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lon}`,
    };
  } catch {
    return {};
  }
}
