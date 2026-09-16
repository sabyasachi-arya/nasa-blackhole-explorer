/** Pure filtering, sorting, statistics and export logic for the catalogue. */
import type { BlackHole, BlackHoleType, Filters, SortKey } from '../types/blackhole';

export const BLACK_HOLE_TYPES: BlackHoleType[] = [
  'stellar',
  'intermediate',
  'supermassive',
  'primordial',
];

export const TYPE_BLURBS: Record<BlackHoleType, string> = {
  stellar: 'Collapsed cores of massive stars, typically 3–50 solar masses.',
  intermediate: 'The rare middle class, roughly 100–100,000 solar masses.',
  supermassive: 'Millions to tens of billions of solar masses, anchoring galaxies.',
  primordial: 'Hypothetical relics of the early universe — none confirmed to date.',
};

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'distance-asc', label: 'Nearest first' },
  { key: 'distance-desc', label: 'Farthest first' },
  { key: 'mass-desc', label: 'Most massive' },
  { key: 'mass-asc', label: 'Least massive' },
  { key: 'discovered-desc', label: 'Newest discovery' },
  { key: 'discovered-asc', label: 'Oldest discovery' },
  { key: 'name-asc', label: 'Name (A–Z)' },
  { key: 'name-desc', label: 'Name (Z–A)' },
];

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

/** Every field a free-text query should match against. */
function searchCorpus(bh: BlackHole): string {
  return [
    bh.name,
    ...(bh.alternateNames ?? []),
    bh.type,
    bh.notable ?? '',
    ...bh.discoveredBy,
    String(bh.discovered),
    bh.description,
  ]
    .join(' ')
    .toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Filtering + sorting                                                 */
/* ------------------------------------------------------------------ */

export function applyFilters(
  data: BlackHole[],
  filters: Filters,
  favourites: number[],
): BlackHole[] {
  const query = filters.query.trim().toLowerCase();

  return data.filter((bh) => {
    if (query && !searchCorpus(bh).includes(query)) return false;
    if (filters.types.length > 0 && !filters.types.includes(bh.type)) return false;
    if (bh.distanceFromEarth.value > filters.maxDistance) return false;
    if (bh.mass.value < filters.minMass || bh.mass.value > filters.maxMass) return false;
    if (filters.favouritesOnly && !favourites.includes(bh.id)) return false;
    return true;
  });
}

export function sortCatalogue(data: BlackHole[], sort: SortKey): BlackHole[] {
  const sorted = [...data];
  const byName = (a: BlackHole, b: BlackHole) =>
    a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' });

  switch (sort) {
    case 'name-asc':
      return sorted.sort(byName);
    case 'name-desc':
      return sorted.sort((a, b) => byName(b, a));
    case 'distance-asc':
      return sorted.sort((a, b) => a.distanceFromEarth.value - b.distanceFromEarth.value);
    case 'distance-desc':
      return sorted.sort((a, b) => b.distanceFromEarth.value - a.distanceFromEarth.value);
    case 'mass-asc':
      return sorted.sort((a, b) => a.mass.value - b.mass.value);
    case 'mass-desc':
      return sorted.sort((a, b) => b.mass.value - a.mass.value);
    case 'discovered-asc':
      return sorted.sort((a, b) => a.discovered - b.discovered || byName(a, b));
    case 'discovered-desc':
      return sorted.sort((a, b) => b.discovered - a.discovered || byName(a, b));
    default:
      return sorted;
  }
}

/* ------------------------------------------------------------------ */
/* Statistics                                                          */
/* ------------------------------------------------------------------ */

export interface CatalogueStats {
  total: number;
  closest: BlackHole | null;
  farthest: BlackHole | null;
  mostMassive: BlackHole | null;
  leastMassive: BlackHole | null;
  /** Largest by event-horizon diameter, normalised to kilometres. */
  largest: BlackHole | null;
  earliestYear: number;
  latestYear: number;
}

/** Event-horizon diameter in kilometres, or null when not recorded. */
export function horizonKm(bh: BlackHole): number | null {
  const eh = bh.eventHorizonDiameter ?? bh.diameter;
  if (!eh) return null;
  return eh.unit.startsWith('million') ? eh.value * 1e6 : eh.value;
}

function extreme<T>(items: T[], score: (item: T) => number | null, wantMax: boolean): T | null {
  let best: T | null = null;
  let bestScore = wantMax ? -Infinity : Infinity;
  for (const item of items) {
    const value = score(item);
    if (value === null) continue;
    if (wantMax ? value > bestScore : value < bestScore) {
      best = item;
      bestScore = value;
    }
  }
  return best;
}

export function computeStats(data: BlackHole[]): CatalogueStats {
  const years = data.map((bh) => bh.discovered);
  return {
    total: data.length,
    closest: extreme(data, (bh) => bh.distanceFromEarth.value, false),
    farthest: extreme(data, (bh) => bh.distanceFromEarth.value, true),
    mostMassive: extreme(data, (bh) => bh.mass.value, true),
    leastMassive: extreme(data, (bh) => bh.mass.value, false),
    largest: extreme(data, horizonKm, true),
    earliestYear: years.length ? Math.min(...years) : 0,
    latestYear: years.length ? Math.max(...years) : 0,
  };
}

/** Bounds used to initialise and reset the range filters. */
export function computeBounds(data: BlackHole[]) {
  return {
    maxDistance: Math.max(...data.map((bh) => bh.distanceFromEarth.value)),
    minMass: Math.min(...data.map((bh) => bh.mass.value)),
    maxMass: Math.max(...data.map((bh) => bh.mass.value)),
  };
}

/* ------------------------------------------------------------------ */
/* CSV export                                                          */
/* ------------------------------------------------------------------ */

const CSV_COLUMNS = [
  'id',
  'name',
  'alternate_names',
  'type',
  'distance_light_years',
  'mass_solar_masses',
  'event_horizon_diameter',
  'discovered',
  'discovered_by',
  'wikipedia',
  'nasa',
  'documentation',
] as const;

/** RFC 4180: wrap in quotes and double any embedded quotes. */
function csvCell(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(data: BlackHole[]): string {
  const rows = data.map((bh) =>
    [
      bh.id,
      bh.name,
      (bh.alternateNames ?? []).join('; '),
      bh.type,
      bh.distanceFromEarth.value,
      bh.mass.value,
      bh.eventHorizonDiameter
        ? `${bh.eventHorizonDiameter.value} ${bh.eventHorizonDiameter.unit}`
        : '',
      bh.discovered,
      bh.discoveredBy.join('; '),
      bh.links.wikipedia,
      bh.links.nasa ?? '',
      bh.links.documentation ?? '',
    ]
      .map(csvCell)
      .join(','),
  );
  return [CSV_COLUMNS.join(','), ...rows].join('\r\n');
}

export function downloadCsv(data: BlackHole[], filename = 'black-holes.csv'): void {
  const blob = new Blob([`﻿${toCsv(data)}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Comparison + timeline helpers                                       */
/* ------------------------------------------------------------------ */

/** Group records into discovery decades, newest decade first. */
export function groupByDecade(data: BlackHole[]): Array<{ decade: number; items: BlackHole[] }> {
  const buckets = new Map<number, BlackHole[]>();
  for (const bh of data) {
    const decade = Math.floor(bh.discovered / 10) * 10;
    const bucket = buckets.get(decade);
    if (bucket) bucket.push(bh);
    else buckets.set(decade, [bh]);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([decade, items]) => ({
      decade,
      items: items.sort((a, b) => b.discovered - a.discovered),
    }));
}

/** Build a shareable deep link for a single record. */
export function shareUrl(bh: BlackHole): string {
  const url = new URL(window.location.href);
  url.hash = `object=${encodeURIComponent(bh.name)}`;
  return url.toString();
}
