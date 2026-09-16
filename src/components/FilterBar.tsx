import { useState } from 'react';
import { ArrowUpDown, ChevronDown, RotateCcw, SlidersHorizontal, Star, X } from 'lucide-react';
import { BLACK_HOLE_TYPES, SORT_OPTIONS, TYPE_BLURBS } from '../utils/catalogue';
import { TYPE_ICONS } from './BlackHoleCard';
import { formatCompact, titleCase } from '../utils/format';
import type { BlackHoleType, Filters, SortKey } from '../types/blackhole';

/* ------------------------------------------------------------------ */
/* Logarithmic slider mapping                                          */
/* ------------------------------------------------------------------ */
/* Distances span 1.5e3 to 1.8e10 ly and masses 3 to 6.6e10 M☉, so a
   linear slider would spend 99% of its travel on the largest handful of
   objects. Both sliders therefore operate on log10 of the value.        */

const STEPS = 1000;

function toSlider(value: number, min: number, max: number): number {
  const lo = Math.log10(min);
  const hi = Math.log10(max);
  return Math.round(((Math.log10(value) - lo) / (hi - lo)) * STEPS);
}

function fromSlider(position: number, min: number, max: number): number {
  const lo = Math.log10(min);
  const hi = Math.log10(max);
  return 10 ** (lo + (position / STEPS) * (hi - lo));
}

/* ------------------------------------------------------------------ */

interface FilterBarProps {
  filters: Filters;
  bounds: { maxDistance: number; minMass: number; maxMass: number };
  sort: SortKey;
  favouriteCount: number;
  typeCounts: Record<string, number>;
  onFiltersChange: (next: Partial<Filters>) => void;
  onSortChange: (sort: SortKey) => void;
  onReset: () => void;
}

/** A removable summary chip for one active filter. */
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="animate-fade-in inline-flex items-center gap-1.5 rounded-full border border-cosmic-blue/40 bg-cosmic-blue/12 px-2.5 py-1 text-[11px] font-semibold text-ink-100">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="grid h-4 w-4 place-items-center rounded-full transition-colors duration-fast hover:bg-cosmic-magenta/40"
      >
        <X size={10} aria-hidden="true" />
      </button>
    </span>
  );
}

export default function FilterBar({
  filters,
  bounds,
  sort,
  favouriteCount,
  typeCounts,
  onFiltersChange,
  onSortChange,
  onReset,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const distanceFloor = 1000;
  const distanceActive = filters.maxDistance < bounds.maxDistance;
  const massActive = filters.minMass > bounds.minMass || filters.maxMass < bounds.maxMass;
  const activeCount =
    filters.types.length +
    (distanceActive ? 1 : 0) +
    (massActive ? 1 : 0) +
    (filters.favouritesOnly ? 1 : 0);

  const toggleType = (type: BlackHoleType) => {
    onFiltersChange({
      types: filters.types.includes(type)
        ? filters.types.filter((item) => item !== type)
        : [...filters.types, type],
    });
  };

  return (
    <section className="card-surface p-4 md:p-5" aria-label="Filters and sorting">
      {/* ---------- Header row ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal size={16} className="text-cosmic-cyan" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink-100">Refine</h2>
          {activeCount > 0 && (
            <span className="stat-number rounded-full bg-cosmic-blue/25 px-2 py-0.5 text-[11px] font-semibold text-cosmic-cyan">
              {activeCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <label className="relative flex items-center">
            <ArrowUpDown
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 text-ink-500"
            />
            <span className="sr-only">Sort results by</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortKey)}
              className="input-glass cursor-pointer appearance-none py-2 pl-9 pr-9 text-xs font-semibold"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key} className="bg-space-800">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute right-3 text-ink-500"
            />
          </label>

          <button
            type="button"
            onClick={onReset}
            disabled={activeCount === 0 && !filters.query}
            className="btn-ghost !px-3 !py-2 text-xs"
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span className="hidden sm:inline">Reset all</span>
          </button>

          {/* Mobile collapse toggle */}
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls="filter-body"
            className="btn-ghost !px-3 !py-2 text-xs md:hidden"
          >
            {expanded ? 'Hide' : 'Filters'}
            <ChevronDown
              size={13}
              aria-hidden="true"
              className={`transition-transform duration-normal ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ---------- Active filter chips ---------- */}
      {activeCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {filters.types.map((type) => (
            <ActiveChip key={type} label={titleCase(type)} onRemove={() => toggleType(type)} />
          ))}
          {distanceActive && (
            <ActiveChip
              label={`≤ ${formatCompact(filters.maxDistance)} ly`}
              onRemove={() => onFiltersChange({ maxDistance: bounds.maxDistance })}
            />
          )}
          {massActive && (
            <ActiveChip
              label={`${formatCompact(filters.minMass)} – ${formatCompact(filters.maxMass)} M☉`}
              onRemove={() =>
                onFiltersChange({ minMass: bounds.minMass, maxMass: bounds.maxMass })
              }
            />
          )}
          {filters.favouritesOnly && (
            <ActiveChip
              label="Favourites only"
              onRemove={() => onFiltersChange({ favouritesOnly: false })}
            />
          )}
        </div>
      )}

      {/* ---------- Body ---------- */}
      <div
        id="filter-body"
        className={`${expanded ? 'block' : 'hidden'} md:block`}
      >
        <div className="rule-glow my-4" />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Type pills */}
          <fieldset className="min-w-0">
            <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Classification
            </legend>
            <div className="flex flex-wrap gap-2">
              {BLACK_HOLE_TYPES.map((type) => {
                const Icon = TYPE_ICONS[type];
                const count = typeCounts[type] ?? 0;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={filters.types.includes(type)}
                    onClick={() => toggleType(type)}
                    disabled={count === 0 && !filters.types.includes(type)}
                    title={TYPE_BLURBS[type]}
                    className="pill disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon size={12} aria-hidden="true" />
                    {titleCase(type)}
                    <span className="stat-number opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              aria-pressed={filters.favouritesOnly}
              onClick={() => onFiltersChange({ favouritesOnly: !filters.favouritesOnly })}
              disabled={favouriteCount === 0}
              className="pill mt-2.5 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                favouriteCount === 0
                  ? 'Star an object to build a favourites list'
                  : 'Show only starred objects'
              }
            >
              <Star
                size={12}
                aria-hidden="true"
                className={filters.favouritesOnly ? 'fill-current' : ''}
              />
              Favourites
              <span className="stat-number opacity-60">{favouriteCount}</span>
            </button>
          </fieldset>

          {/* Distance */}
          <div className="min-w-0">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <label
                htmlFor="distance-range"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500"
              >
                Max distance
              </label>
              <span className="stat-number text-xs text-cosmic-cyan">
                {formatCompact(filters.maxDistance)} ly
              </span>
            </div>
            <input
              id="distance-range"
              type="range"
              className="slider"
              min={0}
              max={STEPS}
              value={toSlider(
                Math.max(filters.maxDistance, distanceFloor),
                distanceFloor,
                bounds.maxDistance,
              )}
              onChange={(event) =>
                onFiltersChange({
                  maxDistance: fromSlider(
                    Number(event.target.value),
                    distanceFloor,
                    bounds.maxDistance,
                  ),
                })
              }
            />
            <div className="mt-1.5 flex justify-between text-[10px] text-ink-500">
              <span>1 thousand ly</span>
              <span>{formatCompact(bounds.maxDistance)} ly</span>
            </div>
          </div>

          {/* Mass */}
          <div className="min-w-0">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                Mass range (M☉)
              </span>
              <span className="stat-number text-xs text-cosmic-purple">
                {formatCompact(filters.minMass)} – {formatCompact(filters.maxMass)}
              </span>
            </div>

            <div className="space-y-2.5">
              <label className="block">
                <span className="sr-only">Minimum mass in solar masses</span>
                <input
                  type="range"
                  className="slider"
                  min={0}
                  max={STEPS}
                  value={toSlider(filters.minMass, bounds.minMass, bounds.maxMass)}
                  onChange={(event) => {
                    const next = fromSlider(
                      Number(event.target.value),
                      bounds.minMass,
                      bounds.maxMass,
                    );
                    // Keep the handles from crossing over.
                    onFiltersChange({ minMass: Math.min(next, filters.maxMass) });
                  }}
                />
              </label>
              <label className="block">
                <span className="sr-only">Maximum mass in solar masses</span>
                <input
                  type="range"
                  className="slider"
                  min={0}
                  max={STEPS}
                  value={toSlider(filters.maxMass, bounds.minMass, bounds.maxMass)}
                  onChange={(event) => {
                    const next = fromSlider(
                      Number(event.target.value),
                      bounds.minMass,
                      bounds.maxMass,
                    );
                    onFiltersChange({ maxMass: Math.max(next, filters.minMass) });
                  }}
                />
              </label>
            </div>

            <div className="mt-1.5 flex justify-between text-[10px] text-ink-500">
              <span>{formatCompact(bounds.minMass)}</span>
              <span>{formatCompact(bounds.maxMass)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
