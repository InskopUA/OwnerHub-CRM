import zipcodes from "zipcodes";

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

let cityIndex;

function getCityIndex() {
  if (cityIndex) return cityIndex;

  const byKey = new Map();
  Object.values(zipcodes.codes).forEach((item) => {
    if (!item?.city || !item?.state || item.country !== "US") return;

    const city = String(item.city).trim();
    const state = String(item.state).trim();
    const key = `${normalize(city)}|${state}`;
    const existing = byKey.get(key);

    if (existing) {
      existing.count += 1;
      if (!existing.zip && item.zip) existing.zip = item.zip;
      return;
    }

    byKey.set(key, {
      city,
      state,
      zip: item.zip || "",
      count: 1,
      search: normalize(city)
    });
  });

  cityIndex = Array.from(byKey.values()).sort((a, b) => {
    const cityCompare = a.city.localeCompare(b.city);
    return cityCompare || a.state.localeCompare(b.state);
  });

  return cityIndex;
}

export function lookupZip(zip) {
  const cleanZip = String(zip || "").replace(/\D/g, "").slice(0, 5);
  if (cleanZip.length !== 5) return null;

  const item = zipcodes.lookup(cleanZip);
  if (!item?.city || !item?.state || item.country !== "US") return null;

  return {
    zip: cleanZip,
    city: item.city,
    state: item.state
  };
}

export function searchCities(query, limit = 10) {
  const cleanQuery = normalize(query);
  if (cleanQuery.length < 2) return [];

  const max = Math.min(Math.max(Number(limit) || 10, 1), 20);
  const index = getCityIndex();
  const startsWith = [];
  const includes = [];

  for (const item of index) {
    if (item.search.startsWith(cleanQuery)) startsWith.push(item);
    else if (item.search.includes(cleanQuery)) includes.push(item);
  }

  const rank = (items) =>
    items.sort((a, b) => {
      const countCompare = b.count - a.count;
      const cityCompare = a.city.localeCompare(b.city);
      return countCompare || cityCompare || a.state.localeCompare(b.state);
    });

  const result = rank(startsWith).concat(rank(includes)).slice(0, max);

  return result.map(({ city, state, zip }) => ({ city, state, zip }));
}
