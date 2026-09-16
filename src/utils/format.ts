/** Number, unit and text formatting helpers shared across the UI. */

const SCALES: Array<[number, string]> = [
  [1e12, 'trillion'],
  [1e9, 'billion'],
  [1e6, 'million'],
  [1e3, 'thousand'],
];

/** Trim trailing zeros so 1.50 -> "1.5" and 2.00 -> "2". */
function trim(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Human-readable large number: 4297000 -> "4.3 million".
 * Values below 1,000 keep up to two decimals (stellar masses are small).
 */
export function formatCompact(value: number): string {
  for (const [threshold, label] of SCALES) {
    if (value >= threshold) {
      const scaled = value / threshold;
      return `${trim(scaled, scaled < 10 ? 2 : 1)} ${label}`;
    }
  }
  return trim(value, 2);
}

/** Thousands-separated integer, e.g. 26996 -> "26,996". */
export function formatWithCommas(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** "4.3 million M☉" */
export function formatMass(mass: { value: number; unit: string }): string {
  return `${formatCompact(mass.value)} M☉`;
}

/** Long form for the detail view: "4,297,000 solar masses". */
export function formatMassLong(mass: { value: number; unit: string }): string {
  return `${formatWithCommas(mass.value)} ${mass.unit}`;
}

/** Distances switch to compact wording above a million light-years. */
export function formatDistance(distance: { value: number; unit: string }): string {
  const { value, unit } = distance;
  const short = unit === 'light-years' ? 'ly' : unit;
  return value >= 1e6 ? `${formatCompact(value)} ${short}` : `${formatWithCommas(value)} ${short}`;
}

export function formatDistanceLong(distance: { value: number; unit: string }): string {
  return `${formatWithCommas(distance.value)} ${distance.unit}`;
}

export function formatMeasurement(m?: { value: number; unit: string }): string {
  if (!m) return 'Not determined';
  return `${formatWithCommas(m.value)} ${m.unit}`;
}

/**
 * Compact event-horizon size, normalised to kilometres first.
 * Compacting the stored value directly would produce nonsense like
 * "389.4 thousand million kilometers" for a value held in millions of km.
 */
export function formatHorizonCompact(m?: { value: number; unit: string }): string {
  if (!m) return 'Not determined';
  const km = m.unit.startsWith('million') ? m.value * 1e6 : m.value;
  return `${formatCompact(km)} km`;
}

/** Approximate light-crossing time of an event horizon, as a readable phrase. */
export function lightCrossingTime(m?: { value: number; unit: string }): string | null {
  if (!m) return null;
  const km = m.unit.startsWith('million') ? m.value * 1e6 : m.value;
  const seconds = km / 299792.458;
  if (seconds < 1) return `${trim(seconds * 1000, 1)} milliseconds`;
  if (seconds < 90) return `${trim(seconds, 1)} seconds`;
  if (seconds < 5400) return `${trim(seconds / 60, 1)} minutes`;
  if (seconds < 172800) return `${trim(seconds / 3600, 1)} hours`;
  return `${trim(seconds / 86400, 1)} days`;
}

/** Sentence-case a type key: "supermassive" -> "Supermassive". */
export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Wrap the matched part of `text` so the UI can highlight search hits. */
export function splitOnMatch(text: string, query: string): [string, string, string] | null {
  if (!query.trim()) return null;
  const index = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (index === -1) return null;
  return [
    text.slice(0, index),
    text.slice(index, index + query.trim().length),
    text.slice(index + query.trim().length),
  ];
}
