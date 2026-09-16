import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Info,
  Rocket,
  Ruler,
  Scale,
  Sparkle,
  Star,
  Telescope,
  Users,
  X,
} from 'lucide-react';
import SmartImage from './SmartImage';
import { TYPE_ACCENTS, TYPE_ICONS } from './BlackHoleCard';
import { useBodyScrollLock } from '../hooks';
import { shareUrl } from '../utils/catalogue';
import {
  formatDistanceLong,
  formatMassLong,
  formatMeasurement,
  lightCrossingTime,
  titleCase,
} from '../utils/format';
import type { BlackHole } from '../types/blackhole';

interface DetailModalProps {
  blackHole: BlackHole;
  hasPrevious: boolean;
  hasNext: boolean;
  isFavourite: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleFavourite: (id: number) => void;
}

/** One label/value row in the key-stats block. */
function StatRow({
  Icon,
  label,
  value,
  hint,
}: {
  Icon: typeof Ruler;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="glass-soft rounded-xl p-3.5">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        <Icon size={12} aria-hidden="true" />
        {label}
      </dt>
      <dd className="stat-number mt-1 text-base font-semibold leading-tight text-ink-100 md:text-lg">
        {value}
      </dd>
      {hint && <dd className="mt-0.5 text-[11px] text-ink-500">{hint}</dd>}
    </div>
  );
}

export default function DetailModal({
  blackHole,
  hasPrevious,
  hasNext,
  isFavourite,
  onClose,
  onPrevious,
  onNext,
  onToggleFavourite,
}: DetailModalProps) {
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useBodyScrollLock(true);

  // Play the exit animation before unmounting.
  const requestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 200);
  }, [onClose]);

  // Keyboard: Escape closes, arrows page between records.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      }
      if (event.key === 'ArrowLeft' && hasPrevious) onPrevious();
      if (event.key === 'ArrowRight' && hasNext) onNext();

      // Simple focus trap so tabbing can't escape the dialog.
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasNext, hasPrevious, onNext, onPrevious, requestClose]);

  // Move focus into the dialog on open, and reset paging state per record.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);
  useEffect(() => {
    setCopied(false);
    panelRef.current?.scrollTo({ top: 0 });
  }, [blackHole.id]);

  const TypeIcon = TYPE_ICONS[blackHole.type];
  const crossing = lightCrossingTime(blackHole.eventHorizonDiameter ?? blackHole.diameter);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(blackHole));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable (insecure context or denied permission) */
    }
  };

  const externalLinks = [
    blackHole.links.nasa && {
      href: blackHole.links.nasa,
      label: 'NASA Science',
      caption: 'Official mission and topic pages',
      Icon: Rocket,
    },
    {
      href: blackHole.links.wikipedia,
      label: 'Wikipedia',
      caption: 'Encyclopaedia article and citations',
      Icon: BookOpen,
    },
    blackHole.links.documentation && {
      href: blackHole.links.documentation,
      label: 'Research data',
      caption: 'NED / ADS catalogue record',
      Icon: FileText,
    },
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    caption: string;
    Icon: typeof Rocket;
  }>;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-space-950/80 p-0 backdrop-blur-md sm:items-center sm:p-6 ${
        closing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        className={`card-surface gpu relative my-0 max-h-none w-full max-w-5xl !rounded-none sm:my-auto sm:max-h-[92vh] sm:!rounded-2xl sm:overflow-y-auto ${
          closing ? 'animate-modal-out' : 'animate-modal-in'
        }`}
      >
        {/* ---------- Sticky control strip ---------- */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-white/5 bg-space-900/85 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="btn-icon !h-9 !w-9"
              aria-label="Previous black hole"
              title="Previous (←)"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className="btn-icon !h-9 !w-9"
              aria-label="Next black hole"
              title="Next (→)"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyShareLink}
              className="btn-ghost !px-3 !py-1.5 text-[11px]"
              aria-label="Copy a shareable link to this object"
            >
              {copied ? (
                <Check size={13} className="text-emerald-400" aria-hidden="true" />
              ) : (
                <Copy size={13} aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{copied ? 'Link copied' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavourite(blackHole.id)}
              aria-pressed={isFavourite}
              className="btn-ghost !px-3 !py-1.5 text-[11px]"
              aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Star
                size={13}
                aria-hidden="true"
                className={isFavourite ? 'fill-amber-300 text-amber-300' : ''}
              />
              <span className="hidden sm:inline">{isFavourite ? 'Starred' : 'Star'}</span>
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={requestClose}
              className="btn-icon !h-9 !w-9"
              aria-label="Close details"
              title="Close (Esc)"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ---------- Header ---------- */}
        <div className="px-5 pb-1 pt-6 md:px-8 md:pt-8">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TYPE_ACCENTS[blackHole.type]}`}
          >
            <TypeIcon size={12} aria-hidden="true" />
            {titleCase(blackHole.type)} black hole
          </span>

          <h2
            id="detail-title"
            className="mt-3 text-section font-extrabold tracking-tight text-ink-100"
          >
            {blackHole.name}
          </h2>

          {blackHole.alternateNames && blackHole.alternateNames.length > 0 && (
            <p className="mt-1.5 text-sm text-ink-500">
              Also catalogued as {blackHole.alternateNames.join(' · ')}
            </p>
          )}

          {blackHole.notable && (
            <p className="mt-3 inline-flex items-start gap-2 rounded-xl border border-cosmic-cyan/25 bg-cosmic-cyan/8 px-3 py-2 text-sm font-medium text-cosmic-cyan">
              <Sparkle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {blackHole.notable}
            </p>
          )}
        </div>

        {/* ---------- Two-column body ---------- */}
        <div className="grid gap-6 p-5 md:grid-cols-2 md:gap-8 md:p-8">
          {/* Left: imagery */}
          <div className="space-y-3">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10"
              style={{ boxShadow: '0 0 45px rgba(59, 130, 246, 0.22)' }}
            >
              <SmartImage
                src={blackHole.imageUrl}
                localImage={blackHole.localImage}
                sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, calc(100vw - 40px)"
                alt={`${blackHole.name} — observational image`}
                seed={blackHole.id}
                type={blackHole.type}
                eager
              />
            </div>
            {blackHole.imageCredit && (
              <p className="text-[11px] leading-relaxed text-ink-500">
                Image: {blackHole.imageCredit}
              </p>
            )}

            {/* Discovery block */}
            <div className="glass-soft space-y-2.5 rounded-xl p-4">
              <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                <Telescope size={12} aria-hidden="true" /> Discovery
              </h3>
              <p className="flex items-baseline gap-2 text-sm text-ink-300">
                <Clock3 size={13} className="shrink-0 text-ink-500" aria-hidden="true" />
                <span>
                  Identified in{' '}
                  <span className="stat-number font-semibold text-ink-100">
                    {blackHole.discovered}
                  </span>
                </span>
              </p>
              <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-300">
                <Users size={13} className="mt-1 shrink-0 text-ink-500" aria-hidden="true" />
                <span>{blackHole.discoveredBy.join(' · ')}</span>
              </p>
            </div>
          </div>

          {/* Right: numbers and prose */}
          <div className="space-y-5">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatRow
                Icon={Ruler}
                label="Distance from Earth"
                value={formatDistanceLong(blackHole.distanceFromEarth)}
              />
              <StatRow Icon={Scale} label="Mass" value={formatMassLong(blackHole.mass)} />
              <StatRow
                Icon={Sparkle}
                label="Event horizon diameter"
                value={formatMeasurement(blackHole.eventHorizonDiameter ?? blackHole.diameter)}
                hint={crossing ? `Light crosses it in ~${crossing}` : undefined}
              />
              <StatRow
                Icon={TypeIcon}
                label="Classification"
                value={titleCase(blackHole.type)}
                hint={`Discovered ${blackHole.discovered}`}
              />
            </dl>

            <div>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                Significance
              </h3>
              <p className="whitespace-pre-line text-sm leading-[1.75] text-ink-300">
                {blackHole.description}
              </p>
            </div>

            {blackHole.facts && blackHole.facts.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                  <Info size={12} aria-hidden="true" /> Points of interest
                </h3>
                <ul className="space-y-2">
                  {blackHole.facts.map((fact) => (
                    <li
                      key={fact}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-300"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-cosmic-cyan to-cosmic-purple"
                      />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ---------- External links ---------- */}
        <div className="border-t border-white/5 p-5 md:p-8">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Sources &amp; further reading
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {externalLinks.map(({ href, label, caption, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-fast hover:border-cosmic-blue/50 hover:bg-cosmic-blue/12"
              >
                <Icon size={17} className="shrink-0 text-cosmic-cyan" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-100">{label}</span>
                  <span className="block truncate text-[11px] text-ink-500">{caption}</span>
                </span>
                <ExternalLink
                  size={13}
                  aria-hidden="true"
                  className="shrink-0 text-ink-500 transition-transform duration-fast group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cosmic-cyan"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
