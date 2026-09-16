import { Star } from 'lucide-react';
import { TYPE_ACCENTS, TYPE_ICONS } from './BlackHoleCard';
import { groupByDecade } from '../utils/catalogue';
import { formatDistance, formatMass, titleCase } from '../utils/format';
import type { BlackHole } from '../types/blackhole';

interface TimelineViewProps {
  blackHoles: BlackHole[];
  favourites: number[];
  onOpen: (bh: BlackHole) => void;
}

/**
 * Discovery-ordered view: one column of decades, newest first, each listing the
 * objects confirmed in that period. Useful for seeing how detection methods
 * (X-ray satellites, then Hubble spectroscopy, then LIGO and Gaia) opened up.
 */
export default function TimelineView({ blackHoles, favourites, onOpen }: TimelineViewProps) {
  const decades = groupByDecade(blackHoles);

  if (decades.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-ink-300">
        No objects match the current filters.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Spine */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-[15px] top-2 w-px bg-gradient-to-b from-cosmic-cyan/50 via-cosmic-purple/35 to-transparent md:left-[19px]"
      />

      <ol className="space-y-10">
        {decades.map(({ decade, items }, decadeIndex) => (
          <li
            key={decade}
            className="animate-fade-up relative pl-11 md:pl-14"
            style={{ animationDelay: `${Math.min(decadeIndex, 8) * 70}ms` }}
          >
            {/* Decade node */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full border border-cosmic-cyan/40 bg-space-900 md:h-10 md:w-10"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-cosmic-cyan to-cosmic-purple" />
            </span>

            <div className="mb-4 flex items-baseline gap-3">
              <h3 className="stat-number text-xl font-bold text-ink-100 md:text-2xl">
                {decade}s
              </h3>
              <span className="text-xs text-ink-500">
                {items.length} {items.length === 1 ? 'object' : 'objects'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((bh) => {
                const Icon = TYPE_ICONS[bh.type];
                return (
                  <button
                    key={bh.id}
                    type="button"
                    onClick={() => onOpen(bh)}
                    className="card-surface group flex items-start gap-3 p-3.5 text-left"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${TYPE_ACCENTS[bh.type]}`}
                    >
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-ink-100">
                          {bh.name}
                        </span>
                        {favourites.includes(bh.id) && (
                          <Star
                            size={11}
                            className="shrink-0 fill-amber-300 text-amber-300"
                            aria-label="Favourite"
                          />
                        )}
                      </span>
                      <span className="stat-number mt-0.5 block text-[11px] text-ink-500">
                        {bh.discovered} · {titleCase(bh.type)}
                      </span>
                      <span className="stat-number mt-1 block truncate text-[11px] text-ink-300">
                        {formatDistance(bh.distanceFromEarth)} · {formatMass(bh.mass)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
