import { useCallback, useEffect, useMemo, useState } from 'react';
import rawData from './data/blackholes.json';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsBar from './components/StatsBar';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import BlackHoleGrid from './components/BlackHoleGrid';
import TimelineView from './components/TimelineView';
import DetailModal from './components/DetailModal';
import CompareModal from './components/CompareModal';
import CompareTray from './components/CompareTray';
import SpaceBackground from './components/SpaceBackground';
import Footer from './components/Footer';

import { useDebounce, useFavourites } from './hooks';
import {
  applyFilters,
  computeBounds,
  computeStats,
  downloadCsv,
  sortCatalogue,
} from './utils/catalogue';
import type { BlackHole, Filters, SortKey, ViewMode } from './types/blackhole';

const CATALOGUE = rawData as BlackHole[];
const BOUNDS = computeBounds(CATALOGUE);

const INITIAL_FILTERS: Filters = {
  query: '',
  types: [],
  maxDistance: BOUNDS.maxDistance,
  minMass: BOUNDS.minMass,
  maxMass: BOUNDS.maxMass,
  favouritesOnly: false,
};

/** Counts per classification across the whole catalogue, for the filter pills. */
const TYPE_COUNTS = CATALOGUE.reduce<Record<string, number>>((counts, bh) => {
  counts[bh.type] = (counts[bh.type] ?? 0) + 1;
  return counts;
}, {});

export default function App() {
  /* ---------------- state ---------------- */
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [sort, setSort] = useState<SortKey>('distance-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<BlackHole | null>(null);
  const [compare, setCompare] = useState<BlackHole[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const { favourites, toggle: toggleFavourite } = useFavourites();

  // Debounced so each keystroke doesn't re-filter and re-render the grid.
  const debouncedQuery = useDebounce(filters.query, 180);

  /* ---------------- data pipeline ---------------- */
  const results = useMemo(
    () =>
      sortCatalogue(
        applyFilters(CATALOGUE, { ...filters, query: debouncedQuery }, favourites),
        sort,
      ),
    [filters, debouncedQuery, favourites, sort],
  );

  const stats = useMemo(() => computeStats(results), [results]);

  /* ---------------- effects ---------------- */

  // Brief skeleton pass so loading states are exercised rather than theoretical.
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 550);
    return () => window.clearTimeout(timer);
  }, []);

  // Deep links of the form #object=M87* open that record directly.
  useEffect(() => {
    const openFromHash = () => {
      const match = /^#object=(.+)$/.exec(window.location.hash);
      if (!match) return;
      const name = decodeURIComponent(match[1]);
      const found = CATALOGUE.find((bh) => bh.name === name);
      if (found) setSelected(found);
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  /* ---------------- handlers ---------------- */

  const updateFilters = useCallback((next: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...next }));
  }, []);

  const resetFilters = useCallback(() => setFilters(INITIAL_FILTERS), []);

  const closeDetail = useCallback(() => {
    setSelected(null);
    // Drop the deep-link fragment so reopening feels clean.
    if (window.location.hash.startsWith('#object=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Paging inside the modal walks the current, filtered result order.
  const selectedIndex = selected ? results.findIndex((bh) => bh.id === selected.id) : -1;
  const step = useCallback(
    (delta: number) => {
      if (selectedIndex === -1) return;
      const next = results[selectedIndex + delta];
      if (next) setSelected(next);
    },
    [results, selectedIndex],
  );

  const toggleCompare = useCallback((bh: BlackHole) => {
    setCompare((current) => {
      if (current.some((item) => item.id === bh.id)) {
        return current.filter((item) => item.id !== bh.id);
      }
      // Keep the two most recent picks.
      return current.length >= 2 ? [current[1], bh] : [...current, bh];
    });
  }, []);

  const compareIds = useMemo(() => compare.map((bh) => bh.id), [compare]);

  /* ---------------- render ---------------- */
  return (
    <>
      <SpaceBackground />

      <Navbar
        total={CATALOGUE.length}
        showing={results.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={() => downloadCsv(results, 'black-holes-filtered.csv')}
      />

      <main>
        <Hero total={CATALOGUE.length} />

        <div className="page-container space-y-6 md:space-y-8">
          <StatsBar stats={stats} onSelect={setSelected} />

          <section id="catalogue" className="scroll-mt-24 space-y-5 md:space-y-6">
            <SearchBar
              value={filters.query}
              resultCount={results.length}
              onChange={(query) => updateFilters({ query })}
            />

            <FilterBar
              filters={filters}
              bounds={BOUNDS}
              sort={sort}
              favouriteCount={favourites.length}
              typeCounts={TYPE_COUNTS}
              onFiltersChange={updateFilters}
              onSortChange={setSort}
              onReset={resetFilters}
            />

            {/* Result count + live region for assistive tech */}
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink-500">
                {viewMode === 'grid' ? 'Catalogue' : 'Discovery timeline'}
              </h2>
              <p aria-live="polite" className="stat-number text-xs text-ink-500">
                {loading
                  ? 'Loading…'
                  : `${results.length} of ${CATALOGUE.length} objects shown`}
              </p>
            </div>

            {viewMode === 'grid' ? (
              <BlackHoleGrid
                blackHoles={results}
                loading={loading}
                query={debouncedQuery}
                favourites={favourites}
                compareIds={compareIds}
                onOpen={setSelected}
                onToggleFavourite={toggleFavourite}
                onToggleCompare={toggleCompare}
                onResetFilters={resetFilters}
              />
            ) : (
              <TimelineView
                blackHoles={results}
                favourites={favourites}
                onOpen={setSelected}
              />
            )}
          </section>
        </div>

        <Footer />
      </main>

      <CompareTray
        selected={compare}
        onRemove={toggleCompare}
        onClear={() => setCompare([])}
        onCompare={() => setShowCompare(true)}
      />

      {selected && (
        <DetailModal
          // Remount per record so entrance animation and scroll reset both fire.
          key={selected.id}
          blackHole={selected}
          hasPrevious={selectedIndex > 0}
          hasNext={selectedIndex > -1 && selectedIndex < results.length - 1}
          isFavourite={favourites.includes(selected.id)}
          onClose={closeDetail}
          onPrevious={() => step(-1)}
          onNext={() => step(1)}
          onToggleFavourite={toggleFavourite}
        />
      )}

      {showCompare && compare.length === 2 && (
        <CompareModal
          pair={[compare[0], compare[1]]}
          onClose={() => setShowCompare(false)}
        />
      )}
    </>
  );
}
