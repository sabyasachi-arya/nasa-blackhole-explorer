import { ArrowLeftRight, X } from 'lucide-react';
import type { BlackHole } from '../types/blackhole';

interface CompareTrayProps {
  selected: BlackHole[];
  onRemove: (bh: BlackHole) => void;
  onClear: () => void;
  onCompare: () => void;
}

/**
 * Floating tray that appears once an object is selected for comparison.
 * Two slots maximum — a side-by-side view of more than two gets unreadable.
 */
export default function CompareTray({
  selected,
  onRemove,
  onClear,
  onCompare,
}: CompareTrayProps) {
  if (selected.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4">
      <div className="glass animate-fade-up pointer-events-auto flex w-full max-w-2xl flex-wrap items-center gap-3 rounded-2xl p-3 shadow-lg md:flex-nowrap">
        <ArrowLeftRight
          size={16}
          className="ml-1.5 hidden shrink-0 text-cosmic-cyan sm:block"
          aria-hidden="true"
        />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {selected.map((bh) => (
            <span
              key={bh.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-cosmic-cyan/40 bg-cosmic-cyan/12 px-2.5 py-1 text-[11px] font-semibold text-ink-100"
            >
              <span className="truncate">{bh.name}</span>
              <button
                type="button"
                onClick={() => onRemove(bh)}
                aria-label={`Remove ${bh.name} from comparison`}
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full transition-colors duration-fast hover:bg-cosmic-magenta/40"
              >
                <X size={10} aria-hidden="true" />
              </button>
            </span>
          ))}

          {selected.length === 1 && (
            <span className="text-[11px] text-ink-500">Pick one more to compare…</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onClear} className="btn-ghost !px-3 !py-2 text-xs">
            Clear
          </button>
          <button
            type="button"
            onClick={onCompare}
            disabled={selected.length < 2}
            className="btn-primary !px-4 !py-2 text-xs"
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}
