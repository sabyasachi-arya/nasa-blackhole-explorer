import { ArrowLeftRight, X } from 'lucide-react';
import SmartImage from './SmartImage';
import { TYPE_ICONS } from './BlackHoleCard';
import { useBodyScrollLock } from '../hooks';
import { horizonKm } from '../utils/catalogue';
import {
  formatCompact,
  formatDistanceLong,
  formatMassLong,
  formatMeasurement,
  lightCrossingTime,
  titleCase,
} from '../utils/format';
import type { BlackHole } from '../types/blackhole';

interface CompareModalProps {
  pair: [BlackHole, BlackHole];
  onClose: () => void;
}

type Row = {
  label: string;
  render: (bh: BlackHole) => string;
  /** Larger-is-"winner" scoring, used to highlight the standout value. */
  score?: (bh: BlackHole) => number | null;
};

const ROWS: Row[] = [
  { label: 'Classification', render: (bh) => titleCase(bh.type) },
  {
    label: 'Distance from Earth',
    render: (bh) => formatDistanceLong(bh.distanceFromEarth),
    score: (bh) => -bh.distanceFromEarth.value, // nearer wins
  },
  {
    label: 'Mass',
    render: (bh) => formatMassLong(bh.mass),
    score: (bh) => bh.mass.value,
  },
  {
    label: 'Event horizon',
    render: (bh) => formatMeasurement(bh.eventHorizonDiameter ?? bh.diameter),
    score: horizonKm,
  },
  {
    label: 'Light-crossing time',
    render: (bh) => lightCrossingTime(bh.eventHorizonDiameter ?? bh.diameter) ?? 'Unknown',
  },
  {
    label: 'Discovered',
    render: (bh) => String(bh.discovered),
    score: (bh) => bh.discovered,
  },
  { label: 'Discovered by', render: (bh) => bh.discoveredBy.join(', ') },
];

export default function CompareModal({ pair, onClose }: CompareModalProps) {
  useBodyScrollLock(true);
  const [left, right] = pair;

  const ratio = left.mass.value >= right.mass.value
    ? left.mass.value / right.mass.value
    : right.mass.value / left.mass.value;
  const heavier = left.mass.value >= right.mass.value ? left : right;
  const lighter = heavier === left ? right : left;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-space-950/80 backdrop-blur-md sm:items-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        className="card-surface animate-modal-in gpu w-full max-w-4xl !rounded-none sm:max-h-[92vh] sm:!rounded-2xl sm:overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-space-900/85 px-5 py-3.5 backdrop-blur-xl md:px-7">
          <h2 id="compare-title" className="flex items-center gap-2 text-sm font-bold text-ink-100">
            <ArrowLeftRight size={16} className="text-cosmic-cyan" aria-hidden="true" />
            Side-by-side comparison
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon !h-9 !w-9"
            aria-label="Close comparison"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Headline pair */}
        <div className="grid grid-cols-2 gap-4 p-5 md:gap-6 md:p-7">
          {[left, right].map((bh) => {
            const Icon = TYPE_ICONS[bh.type];
            return (
              <div key={bh.id} className="space-y-3">
                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
                  <SmartImage
                    src={bh.imageUrl}
                    localImage={bh.localImage}
                    alt={bh.name}
                    seed={bh.id}
                    type={bh.type}
                    sizes="(min-width: 896px) 420px, 50vw"
                    eager
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight text-ink-100 md:text-lg">
                    {bh.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                    <Icon size={11} aria-hidden="true" />
                    {titleCase(bh.type)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mass ratio callout */}
        <div className="mx-5 mb-5 rounded-xl border border-cosmic-purple/25 bg-cosmic-purple/10 p-4 text-center md:mx-7">
          <p className="text-sm text-ink-300">
            {ratio < 1.05 ? (
              <>These two objects are within a few per cent of the same mass.</>
            ) : (
              <>
                <span className="font-semibold text-ink-100">{heavier.name}</span> is{' '}
                <span className="stat-number font-bold text-cosmic-purple">
                  {formatCompact(ratio)}×
                </span>{' '}
                more massive than{' '}
                <span className="font-semibold text-ink-100">{lighter.name}</span>.
              </>
            )}
          </p>
        </div>

        {/* Property table */}
        <div className="overflow-x-auto px-5 pb-6 md:px-7 md:pb-8">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <caption className="sr-only">
              Property-by-property comparison of {left.name} and {right.name}
            </caption>
            <thead>
              <tr className="border-b border-white/10">
                <th scope="col" className="w-1/4 py-2.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                  Property
                </th>
                <th scope="col" className="py-2.5 px-3 text-left text-xs font-bold text-ink-100">
                  {left.name}
                </th>
                <th scope="col" className="py-2.5 px-3 text-left text-xs font-bold text-ink-100">
                  {right.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const leftScore = row.score?.(left) ?? null;
                const rightScore = row.score?.(right) ?? null;
                const leftWins =
                  leftScore !== null && rightScore !== null && leftScore > rightScore;
                const rightWins =
                  leftScore !== null && rightScore !== null && rightScore > leftScore;

                return (
                  <tr key={row.label} className="border-b border-white/5 last:border-0">
                    <th
                      scope="row"
                      className="py-3 pr-3 text-left align-top text-[11px] font-semibold uppercase tracking-wider text-ink-500"
                    >
                      {row.label}
                    </th>
                    <td
                      className={`stat-number py-3 px-3 align-top ${
                        leftWins ? 'font-semibold text-cosmic-cyan' : 'text-ink-300'
                      }`}
                    >
                      {row.render(left)}
                    </td>
                    <td
                      className={`stat-number py-3 px-3 align-top ${
                        rightWins ? 'font-semibold text-cosmic-cyan' : 'text-ink-300'
                      }`}
                    >
                      {row.render(right)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-ink-500">
            Highlighted values mark the nearer, more massive, larger or more recent of the pair.
          </p>
        </div>
      </div>
    </div>
  );
}
