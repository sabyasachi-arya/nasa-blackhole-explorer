import { useId } from 'react';
import type { BlackHoleType } from '../types/blackhole';

interface BlackHoleVisualProps {
  /** Seeds the tilt and ring thickness so each object looks individual. */
  seed: number;
  type: BlackHoleType;
  className?: string;
}

/** Accretion discs run hotter (bluer) for compact objects, cooler for giants. */
const PALETTES: Record<BlackHoleType, [string, string, string]> = {
  stellar: ['#22d3ee', '#3b82f6', '#a855f7'],
  intermediate: ['#a78bfa', '#7c3aed', '#db2777'],
  supermassive: ['#fbbf24', '#f97316', '#db2777'],
  primordial: ['#f1f5f9', '#93c5fd', '#6366f1'],
};

/**
 * A procedurally drawn black hole: photon ring, lensed accretion disc and
 * shadow. Used as the fallback whenever a record has no photograph or its
 * image fails to load, so the grid never shows a broken tile.
 */
export default function BlackHoleVisual({ seed, type, className = '' }: BlackHoleVisualProps) {
  // useId keeps gradient ids unique when several instances share a page.
  const uid = useId().replace(/:/g, '');
  const [hot, mid, cool] = PALETTES[type] ?? PALETTES.stellar;

  // Deterministic per-record variation.
  const tilt = -32 + (seed * 37) % 26;
  const discWidth = 128 + ((seed * 17) % 34);
  const ringWidth = 3 + ((seed * 7) % 3);

  return (
    <svg
      viewBox="0 0 320 220"
      className={`h-full w-full ${className}`}
      role="img"
      aria-label={`Stylised illustration of a ${type} black hole`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="rgb(19, 30, 58)" />
          <stop offset="60%" stopColor="rgb(9, 15, 34)" />
          <stop offset="100%" stopColor="rgb(3, 7, 18)" />
        </radialGradient>

        {/* Disc brightness peaks at the edges where the material is beamed toward us. */}
        <linearGradient id={`disc-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={cool} stopOpacity="0.15" />
          <stop offset="18%" stopColor={mid} stopOpacity="0.95" />
          <stop offset="50%" stopColor={hot} stopOpacity="1" />
          <stop offset="82%" stopColor={mid} stopOpacity="0.95" />
          <stop offset="100%" stopColor={cool} stopOpacity="0.15" />
        </linearGradient>

        <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor={hot} stopOpacity="0.55" />
          <stop offset="80%" stopColor={mid} stopOpacity="0.18" />
          <stop offset="100%" stopColor={mid} stopOpacity="0" />
        </radialGradient>

        <filter id={`blur-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`soft-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      <rect width="320" height="220" fill={`url(#bg-${uid})`} />

      <g transform={`translate(160 110) rotate(${tilt})`}>
        {/* Outer glow */}
        <circle r="86" fill={`url(#halo-${uid})`} opacity="0.5" />

        {/* Far side of the disc, gravitationally lensed up and over the shadow */}
        <ellipse
          rx={discWidth}
          ry="14"
          fill="none"
          stroke={`url(#disc-${uid})`}
          strokeWidth="11"
          filter={`url(#blur-${uid})`}
          opacity="0.85"
        />

        {/* The shadow itself */}
        <circle r="40" fill="rgb(2, 4, 12)" />

        {/* Photon ring hugging the shadow */}
        <circle
          r="41"
          fill="none"
          stroke={hot}
          strokeWidth={ringWidth}
          opacity="0.9"
          filter={`url(#soft-${uid})`}
        />

        {/* Near side of the disc, drawn in front of the shadow */}
        <path
          d={`M ${-discWidth} 0 A ${discWidth} 14 0 0 0 ${discWidth} 0`}
          fill="none"
          stroke={`url(#disc-${uid})`}
          strokeWidth="9"
          filter={`url(#soft-${uid})`}
        />
      </g>
    </svg>
  );
}
