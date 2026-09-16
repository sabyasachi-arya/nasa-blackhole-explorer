import { SearchX } from 'lucide-react';
import BlackHoleCard from './BlackHoleCard';
import type { BlackHole } from '../types/blackhole';

/** Matches the card's silhouette so the layout doesn't shift on load. */
export function SkeletonCard() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="skeleton aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
        </div>
        <div className="skeleton h-7 w-full rounded-lg" />
      </div>
    </div>
  );
}

const GRID_CLASSES =
  'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6';

interface BlackHoleGridProps {
  blackHoles: BlackHole[];
  loading: boolean;
  query: string;
  favourites: number[];
  compareIds: number[];
  onOpen: (bh: BlackHole) => void;
  onToggleFavourite: (id: number) => void;
  onToggleCompare: (bh: BlackHole) => void;
  onResetFilters: () => void;
}

export default function BlackHoleGrid({
  blackHoles,
  loading,
  query,
  favourites,
  compareIds,
  onOpen,
  onToggleFavourite,
  onToggleCompare,
  onResetFilters,
}: BlackHoleGridProps) {
  if (loading) {
    return (
      <div className={GRID_CLASSES} aria-busy="true" aria-label="Loading catalogue">
        {Array.from({ length: 8 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (blackHoles.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-5 py-20 text-center md:py-28">
        <div className="grid h-20 w-20 place-items-center rounded-full border border-ink-500/25 bg-ink-500/5">
          <SearchX size={34} className="text-ink-500" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-section font-bold text-ink-100">Nothing out here</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-300">
            No black holes in the catalogue match your current search and filters. Try widening the
            distance or mass range, or clearing the search term.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={onResetFilters}>
          Reset all filters
        </button>
      </div>
    );
  }

  return (
    <div className={GRID_CLASSES}>
      {blackHoles.map((blackHole, index) => (
        <BlackHoleCard
          // Keyed on id alone: remounting on every keystroke would restart the
          // stagger animation and re-request each image. Newly matched cards
          // still animate in, because those are genuine mounts.
          key={blackHole.id}
          blackHole={blackHole}
          index={index}
          query={query}
          isFavourite={favourites.includes(blackHole.id)}
          isSelectedForCompare={compareIds.includes(blackHole.id)}
          onOpen={onOpen}
          onToggleFavourite={onToggleFavourite}
          onToggleCompare={onToggleCompare}
        />
      ))}
    </div>
  );
}
