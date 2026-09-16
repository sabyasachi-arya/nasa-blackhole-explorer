import { memo } from 'react';
import { CircleDot, Orbit, Ruler, Scale, Sparkles, Star, Telescope } from 'lucide-react';
import SmartImage from './SmartImage';
import { formatDistance, formatMass, splitOnMatch, titleCase } from '../utils/format';
import type { BlackHole, BlackHoleType } from '../types/blackhole';

export const TYPE_ICONS: Record<BlackHoleType, typeof Star> = {
  stellar: Star,
  intermediate: CircleDot,
  supermassive: Orbit,
  primordial: Sparkles,
};

/** Accent colour per classification, echoed by the procedural visual. */
export const TYPE_ACCENTS: Record<BlackHoleType, string> = {
  stellar: 'text-cosmic-cyan border-cosmic-cyan/40 bg-cosmic-cyan/10',
  intermediate: 'text-violet-300 border-violet-400/40 bg-violet-500/10',
  supermassive: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
  primordial: 'text-ink-100 border-ink-500/40 bg-ink-500/10',
};

interface BlackHoleCardProps {
  blackHole: BlackHole;
  /** Index within the visible grid, used to stagger the entrance animation. */
  index: number;
  query: string;
  isFavourite: boolean;
  isSelectedForCompare: boolean;
  onOpen: (bh: BlackHole) => void;
  onToggleFavourite: (id: number) => void;
  onToggleCompare: (bh: BlackHole) => void;
}

/** Highlights the matching substring so search results are self-explaining. */
function HighlightedName({ name, query }: { name: string; query: string }) {
  const parts = splitOnMatch(name, query);
  if (!parts) return <>{name}</>;
  const [before, match, after] = parts;
  return (
    <>
      {before}
      <mark className="rounded bg-cosmic-cyan/25 px-0.5 text-cosmic-cyan">{match}</mark>
      {after}
    </>
  );
}

function BlackHoleCard({
  blackHole,
  index,
  query,
  isFavourite,
  isSelectedForCompare,
  onOpen,
  onToggleFavourite,
  onToggleCompare,
}: BlackHoleCardProps) {
  const TypeIcon = TYPE_ICONS[blackHole.type];
  const accent = TYPE_ACCENTS[blackHole.type];

  return (
    <article
      className="group animate-fade-up gpu"
      // Cap the stagger so late cards in a long list don't feel sluggish.
      style={{ animationDelay: `${Math.min(index, 11) * 55}ms` }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`View details for ${blackHole.name}`}
        onClick={() => onOpen(blackHole)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(blackHole);
          }
        }}
        className={`card-surface relative flex h-full cursor-pointer flex-col overflow-hidden outline-none transition-transform duration-normal hover:-translate-y-1 focus-visible:-translate-y-1 ${
          isSelectedForCompare ? 'ring-2 ring-cosmic-cyan/70' : ''
        }`}
      >
        {/* Animated gradient border, revealed on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-normal group-hover:opacity-100"
          style={{
            background:
              'linear-gradient(130deg, rgba(34,211,238,0.5), rgba(147,51,234,0.5), rgba(219,39,119,0.45)) border-box',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '1px',
          }}
        />

        {/* ---------- Image ---------- */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]">
            <SmartImage
              src={blackHole.imageUrl}
              localImage={blackHole.localImage}
              alt={blackHole.name}
              sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, calc(100vw - 32px)"
              seed={blackHole.id}
              type={blackHole.type}
            />
          </div>

          {/* Legibility scrim */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/45 to-transparent"
          />

          {/* Type badge */}
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${accent}`}
          >
            <TypeIcon size={12} aria-hidden="true" />
            {titleCase(blackHole.type)}
          </span>

          {/* Favourite toggle */}
          <button
            type="button"
            aria-pressed={isFavourite}
            aria-label={isFavourite ? `Remove ${blackHole.name} from favourites` : `Add ${blackHole.name} to favourites`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavourite(blackHole.id);
            }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-space-950/60 backdrop-blur-sm transition-all duration-fast hover:scale-110 hover:border-amber-300/60 hover:bg-amber-400/20"
          >
            <Star
              size={16}
              className={isFavourite ? 'fill-amber-300 text-amber-300' : 'text-ink-300'}
              aria-hidden="true"
            />
          </button>

          {/* Discovery year, bottom-left over the scrim */}
          <span className="stat-number absolute bottom-3 left-3 text-[11px] uppercase tracking-widest text-ink-300">
            Discovered {blackHole.discovered}
          </span>
        </div>

        {/* ---------- Body ---------- */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <h3 className="text-lg font-bold leading-tight text-ink-100 transition-colors duration-fast group-hover:text-white">
              <HighlightedName name={blackHole.name} query={query} />
            </h3>
            {blackHole.alternateNames?.[0] && (
              <p className="mt-0.5 truncate text-xs text-ink-500">
                also known as {blackHole.alternateNames[0]}
              </p>
            )}
          </div>

          {blackHole.notable && (
            <p className="line-clamp-2 text-xs font-medium leading-relaxed text-cosmic-cyan/90">
              {blackHole.notable}
            </p>
          )}

          {/* Quick stats */}
          <dl className="mt-auto grid grid-cols-2 gap-2 pt-1">
            <div className="glass-soft rounded-xl px-3 py-2">
              <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-500">
                <Ruler size={11} aria-hidden="true" /> Distance
              </dt>
              <dd className="stat-number mt-0.5 truncate text-sm text-ink-100">
                {formatDistance(blackHole.distanceFromEarth)}
              </dd>
            </div>
            <div className="glass-soft rounded-xl px-3 py-2">
              <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-500">
                <Scale size={11} aria-hidden="true" /> Mass
              </dt>
              <dd className="stat-number mt-0.5 truncate text-sm text-ink-100">
                {formatMass(blackHole.mass)}
              </dd>
            </div>
          </dl>

          {/* Compare toggle */}
          <button
            type="button"
            aria-pressed={isSelectedForCompare}
            onClick={(event) => {
              event.stopPropagation();
              onToggleCompare(blackHole);
            }}
            className={`mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all duration-fast ${
              isSelectedForCompare
                ? 'border-cosmic-cyan/60 bg-cosmic-cyan/15 text-cosmic-cyan'
                : 'border-ink-500/25 text-ink-300 hover:border-cosmic-blue/50 hover:bg-cosmic-blue/10 hover:text-ink-100'
            }`}
          >
            <Telescope size={12} aria-hidden="true" />
            {isSelectedForCompare ? 'Selected to compare' : 'Compare'}
          </button>
        </div>
      </div>
    </article>
  );
}

// The grid re-renders on every keystroke; cards only change when their own
// props do, so memoising keeps filtering smooth across 35 records.
export default memo(BlackHoleCard);
