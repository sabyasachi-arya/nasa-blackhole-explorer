import { Clock3, Download, ExternalLink, LayoutGrid, Orbit } from 'lucide-react';
import type { ViewMode } from '../types/blackhole';

interface NavbarProps {
  total: number;
  showing: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExport: () => void;
}

export default function Navbar({
  total,
  showing,
  viewMode,
  onViewModeChange,
  onExport,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-space-950/70 backdrop-blur-xl">
      <div className="page-container flex h-16 items-center justify-between gap-4 md:h-[68px]">
        {/* Branding */}
        <a href="#catalogue" className="group flex items-center gap-3 outline-none">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-cosmic-blue/30 to-cosmic-purple/30">
            <Orbit
              size={20}
              className="text-cosmic-cyan transition-transform duration-700 group-hover:rotate-180"
              aria-hidden="true"
            />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight text-ink-100">
              Black Hole <span className="text-gradient">Explorer</span>
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-ink-500 sm:block">
              NASA &amp; ESA source catalogue
            </span>
          </span>
        </a>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Live count — doubles as the breadcrumb for the current filter state */}
          <p className="hidden items-center gap-1.5 text-xs text-ink-300 lg:flex">
            <span className="stat-number text-sm font-semibold text-ink-100">{showing}</span>
            <span className="text-ink-500">of</span>
            <span className="stat-number text-sm text-ink-300">{total}</span>
            <span className="text-ink-500">objects</span>
          </p>

          {/* View switcher */}
          <div
            role="group"
            aria-label="View mode"
            className="glass flex items-center gap-0.5 rounded-xl p-1"
          >
            {(
              [
                { mode: 'grid' as ViewMode, label: 'Grid', Icon: LayoutGrid },
                { mode: 'timeline' as ViewMode, label: 'Timeline', Icon: Clock3 },
              ]
            ).map(({ mode, label, Icon }) => (
              <button
                key={mode}
                type="button"
                aria-pressed={viewMode === mode}
                aria-label={`${label} view`}
                onClick={() => onViewModeChange(mode)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-fast ${
                  viewMode === mode
                    ? 'bg-cosmic-blue/25 text-ink-100 shadow-glow'
                    : 'text-ink-500 hover:text-ink-100'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onExport}
            className="btn-ghost !px-3 !py-2 text-xs"
            title="Download the current results as CSV"
          >
            <Download size={14} aria-hidden="true" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <a
            href="https://science.nasa.gov/universe/black-holes/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-icon hidden sm:inline-flex"
            title="NASA — Black Holes"
            aria-label="Open NASA's black hole science pages in a new tab"
          >
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}
