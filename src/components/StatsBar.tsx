import { Database, Ruler, Scale, Sparkle } from 'lucide-react';
import { useAnimatedCounter, useInView } from '../hooks';
import { formatCompact, formatDistance, formatHorizonCompact } from '../utils/format';
import type { CatalogueStats } from '../utils/catalogue';
import type { BlackHole } from '../types/blackhole';

interface StatCardProps {
  Icon: typeof Database;
  label: string;
  /** Numeric headline, animated up from zero when scrolled into view. */
  count?: number;
  /** Pre-formatted headline, used when the value isn't a plain number. */
  display?: string;
  caption: string;
  accent: string;
  active: boolean;
  onClick?: () => void;
}

function StatCard({
  Icon,
  label,
  count,
  display,
  caption,
  accent,
  active,
  onClick,
}: StatCardProps) {
  const animated = useAnimatedCounter(count ?? 0, active);
  const headline =
    count !== undefined ? Math.round(animated).toLocaleString('en-US') : (display ?? '—');

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`card-surface group flex items-start gap-3.5 p-4 text-left md:p-5 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${accent} transition-transform duration-normal group-hover:scale-110`}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          {label}
        </span>
        <span className="stat-number mt-0.5 block truncate text-xl font-semibold text-ink-100 md:text-2xl">
          {headline}
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-300">{caption}</span>
      </span>
    </Wrapper>
  );
}

interface StatsBarProps {
  stats: CatalogueStats;
  onSelect: (bh: BlackHole) => void;
}

/**
 * Dashboard of headline figures for the currently visible result set.
 * Counters animate the first time the bar scrolls into view.
 */
export default function StatsBar({ stats, onSelect }: StatsBarProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      <StatCard
        Icon={Database}
        label="Objects catalogued"
        count={stats.total}
        caption={
          stats.total > 0
            ? `Discoveries from ${stats.earliestYear} to ${stats.latestYear}`
            : 'No objects match'
        }
        accent="border-cosmic-blue/40 bg-cosmic-blue/10 text-cosmic-blue"
        active={inView}
      />
      <StatCard
        Icon={Ruler}
        label="Closest to Earth"
        display={stats.closest?.name}
        caption={
          stats.closest ? formatDistance(stats.closest.distanceFromEarth) : 'No objects match'
        }
        accent="border-cosmic-cyan/40 bg-cosmic-cyan/10 text-cosmic-cyan"
        active={inView}
        onClick={stats.closest ? () => onSelect(stats.closest!) : undefined}
      />
      <StatCard
        Icon={Scale}
        label="Most massive"
        display={stats.mostMassive?.name}
        caption={
          stats.mostMassive
            ? `${formatCompact(stats.mostMassive.mass.value)} solar masses`
            : 'No objects match'
        }
        accent="border-cosmic-purple/40 bg-cosmic-purple/10 text-cosmic-purple"
        active={inView}
        onClick={stats.mostMassive ? () => onSelect(stats.mostMassive!) : undefined}
      />
      <StatCard
        Icon={Sparkle}
        label="Largest event horizon"
        display={stats.largest?.name}
        caption={
          stats.largest
            ? `${formatHorizonCompact(stats.largest.eventHorizonDiameter ?? stats.largest.diameter)} across`
            : 'No objects match'
        }
        accent="border-cosmic-magenta/40 bg-cosmic-magenta/10 text-cosmic-magenta"
        active={inView}
        onClick={stats.largest ? () => onSelect(stats.largest!) : undefined}
      />
    </div>
  );
}
