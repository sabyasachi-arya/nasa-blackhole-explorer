/**
 * Core domain types for the Black Hole Explorer.
 *
 * `BlackHole` matches the agreed schema exactly; the trailing optional fields
 * (`facts`, `imageCredit`, `wikipediaTitle`, `notable`) are additive and used
 * by the detail modal, image attribution and the image-enrichment script.
 */

export type BlackHoleType = 'stellar' | 'supermassive' | 'intermediate' | 'primordial';

export interface Measurement {
  value: number;
  unit: string;
}

export interface BlackHole {
  id: number;
  name: string;
  alternateNames?: string[];
  distanceFromEarth: {
    value: number;
    unit: string; // "light-years" or "kiloparsecs"
  };
  mass: {
    value: number;
    unit: string; // "solar masses"
  };
  diameter?: {
    value: number;
    unit: string; // "kilometers" or "million kilometers"
  };
  discovered: number;
  discoveredBy: string[];
  description: string;
  type: BlackHoleType;
  imageUrl?: string;
  links: {
    nasa?: string;
    wikipedia: string;
    documentation?: string;
  };
  eventHorizonDiameter?: {
    value: number;
    unit: string;
  };

  /** Short "did you know" lines shown in the detail modal. */
  facts?: string[];
  /** Attribution for `imageUrl`. */
  imageCredit?: string;
  /**
   * Base name of self-hosted WebP renditions in public/images
   * (`<localImage>-{480,720,960}.webp`), generated from
   * `imageUrl` by scripts/optimize-images.mjs.
   */
  localImage?: string;
  /** English Wikipedia article title, used by scripts/fetch-images.mjs. */
  wikipediaTitle?: string;
  /** Flags a record whose headline claim is historically significant. */
  notable?: string;
}

/* ------------------------------------------------------------------ */
/* UI state types                                                      */
/* ------------------------------------------------------------------ */

export type SortKey =
  | 'name-asc'
  | 'name-desc'
  | 'distance-asc'
  | 'distance-desc'
  | 'mass-asc'
  | 'mass-desc'
  | 'discovered-asc'
  | 'discovered-desc';

export interface Filters {
  query: string;
  types: BlackHoleType[];
  /** Inclusive bounds in light-years. */
  maxDistance: number;
  /** Inclusive bounds in solar masses. */
  minMass: number;
  maxMass: number;
  favouritesOnly: boolean;
}

export type ViewMode = 'grid' | 'timeline';
