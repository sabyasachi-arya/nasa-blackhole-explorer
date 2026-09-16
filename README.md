# NASA Black Hole Explorer

An interactive catalogue of 53 confirmed black holes — distance from Earth, mass, event-horizon
scale, discovery history, and a verified source link for every record.

React 18 · TypeScript · Vite 5 · TailwindCSS 3 · lucide-react

## Getting started

```bash
npm install
```

```bash
npm run dev
```

The dev server runs on <http://localhost:5180>.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` only |
| `npm run enrich:images` | Re-resolve `imageUrl` for every record (see below) |

## Project layout

```
src/
├─ components/       # UI — one concern per file
│  ├─ Navbar.tsx           Sticky header, view switcher, CSV export
│  ├─ Hero.tsx             Title block with scroll parallax
│  ├─ StatsBar.tsx         Dashboard tiles with animated counters
│  ├─ SearchBar.tsx        Debounced search, "/" hotkey, char counter
│  ├─ FilterBar.tsx        Type pills, log-scale range sliders, sort, chips
│  ├─ BlackHoleGrid.tsx    Responsive grid, skeletons, empty state
│  ├─ BlackHoleCard.tsx    Glassmorphism card (memoised)
│  ├─ DetailModal.tsx      Full record, focus trap, keyboard paging
│  ├─ CompareModal.tsx     Two-object side-by-side table
│  ├─ CompareTray.tsx      Floating selection tray
│  ├─ TimelineView.tsx     Discovery-ordered view, grouped by decade
│  ├─ SmartImage.tsx       Lazy image + skeleton + fallback
│  ├─ BlackHoleVisual.tsx  Procedural SVG accretion disc
│  ├─ StarField.tsx        Fixed background star layer
│  └─ Footer.tsx           Data provenance and source links
├─ data/blackholes.json    The catalogue
├─ hooks/index.ts          useDebounce, useInView, useAnimatedCounter, …
├─ types/blackhole.ts      Domain and UI-state types
├─ utils/
│  ├─ catalogue.ts         Filter / sort / stats / CSV — all pure
│  └─ format.ts            Number, unit and distance formatting
└─ styles/index.css        Design tokens, glassmorphism, component classes
```

## Features

- **Search** across names, alternate designations, discoverers, discovery years and descriptions,
  debounced at 180 ms, with the matched substring highlighted on each card.
- **Filters** — classification pills, maximum distance, mass range, favourites-only. Removable
  chips summarise what is active; one button resets everything.
- **Sort** by distance, mass, discovery year or name, in either direction.
- **Detail modal** with key statistics, discovery credits, full description, points of interest and
  three source links. Arrow keys page through the filtered results; Escape closes.
- **Compare** any two objects in a side-by-side table that highlights the nearer, more massive,
  larger or more recent of the pair.
- **Timeline view** groups discoveries by decade, newest first.
- **Favourites** persist in `localStorage`.
- **CSV export** of the current filtered result set (RFC 4180 quoted, BOM-prefixed for Excel).
- **Deep links** — `#object=M87*` opens that record directly; the Share button copies such a link.

### Keyboard

| Key | Action |
| --- | --- |
| `/` | Focus the search field |
| `Enter` / `Space` | Open the focused card |
| `←` `→` | Previous / next record while the modal is open |
| `Esc` | Close the modal |

## Data

53 records (discoveries through August 2026): 30 supermassive, 17 stellar, 6 intermediate. No primordial black hole has ever been
confirmed, so that classification is present in the type system and filter UI but intentionally
holds no records.

Figures come from peer-reviewed measurements published by NASA, ESA, ESO and associated
observatories, cross-checked against the NASA/IPAC Extragalactic Database. Every record carries a
Wikipedia link, a NASA Science link and a catalogue record at NED or the NASA Astrophysics Data
System — all 77 unique URLs were verified to resolve.

**Caveats worth knowing.** Quasar masses inferred from emission-line widths (TON 618, S5 0014+81)
can be uncertain by a factor of two or more, and the records say so. Event-horizon diameters are
*computed* from the Schwarzschild radius of a non-rotating black hole of the stated mass
(≈2.95 km per solar mass), not measured — they are indicative figures, and real black holes spin.
Distances for gravitational-wave events are luminosity distances.

### Imagery

`imageUrl` is populated by `scripts/fetch-images.mjs`, which resolves each record's imagery through
the Wikimedia REST API. Commons hashes every file's storage path, so these URLs cannot be guessed —
they must be resolved, and the script is the reproducible way to refresh them:

```bash
npm run enrich:images
```

It is resumable (rate limiting is common), backs off on HTTP 429, and filters out constellation
maps, light curves and schematic diagrams that lead many astronomy articles. A small `OVERRIDES`
map in the script steers the handful of records where the best image is not the lead image.

Images are hotlinked from Wikimedia Commons under their respective public-domain and Creative
Commons licences. When one fails to load — offline, blocked CDN, rate limiting — `SmartImage` falls
back to `BlackHoleVisual`, a procedurally drawn accretion disc seeded from the record id, so the
grid never shows a broken tile.

## Design system

Tokens live at `:root` in `src/styles/index.css` and are mirrored into `tailwind.config.js`.

- Deep-space background `rgb(3, 7, 18)` with layered radial washes in purple, cyan and magenta
- Glassmorphism surfaces: `rgba(15, 32, 60, 0.55)` at `blur(12px)`, hairline `rgba(148,163,184,0.2)`
- Accents: electric blue `#3b82f6`, neon cyan `#22d3ee`, purple `#9333ea`, magenta `#db2777`
- Inter for text, JetBrains Mono for figures (tabular numerals so columns align)
- Fluid type: headline clamps 28 px → 56 px; section headings 20 px → 40 px
- Transitions at 150 ms (micro) and 300 ms (layout); all animation uses `transform`/`opacity`

Verified: 1 / 2 / 3 / 4 columns at mobile / tablet / desktop / XL, no horizontal overflow at any
width, and text contrast of at least 7.4:1 against the page background.

### Accessibility

Semantic landmarks and headings, `aria-pressed` on every toggle, `aria-live` result counts,
labelled range inputs, a focus trap and restored scroll position in modals, a visible focus ring,
and full `prefers-reduced-motion` support that collapses every animation.

## Performance

- Search debounced; cards `memo`-ised so filtering does not re-render 53 subtrees
- Filtering, sorting and statistics memoised on their inputs
- Images lazy-loaded with `decoding="async"` and a skeleton placeholder
- Vendor, icons and app code split into separate chunks
- Animations are GPU-composited; the parallax listener is `passive` and rAF-throttled

Production build: ~90 KB gzipped total.

---

An independent educational project. Not affiliated with or endorsed by NASA.
