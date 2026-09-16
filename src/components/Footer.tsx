import { ExternalLink, Info } from 'lucide-react';

const SOURCES = [
  { label: 'NASA Science — Black Holes', href: 'https://science.nasa.gov/universe/black-holes/' },
  { label: 'Chandra X-ray Observatory', href: 'https://science.nasa.gov/mission/chandra/' },
  { label: 'Hubble Space Telescope', href: 'https://science.nasa.gov/mission/hubble/' },
  { label: 'NASA/IPAC Extragalactic Database', href: 'https://ned.ipac.caltech.edu/' },
  { label: 'NASA Astrophysics Data System', href: 'https://ui.adsabs.harvard.edu/' },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 py-10 md:mt-24">
      <div className="page-container grid gap-8 md:grid-cols-[1.4fr_1fr]">
        {/* Data-provenance note */}
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-100">
            <Info size={15} className="text-cosmic-cyan" aria-hidden="true" />
            About this data
          </h2>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-300">
            Figures are drawn from peer-reviewed measurements published by NASA, ESA, ESO and
            associated observatories, and cross-checked against the NASA/IPAC Extragalactic
            Database. Masses and distances for the most extreme objects carry substantial
            uncertainty — quasar masses inferred from emission-line widths in particular can be
            uncertain by a factor of two or more, and are marked as such in each record.
          </p>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-500">
            Event-horizon diameters are computed from the Schwarzschild radius for a non-rotating
            black hole of the stated mass (about 2.95 km per solar mass), so they are indicative
            rather than measured. Imagery comes from Wikimedia Commons under its respective
            public-domain and Creative Commons licences; where no photograph exists, the
            application renders an illustrative accretion disc instead.
          </p>
          <p className="mt-4 text-[11px] text-ink-500">
            An independent educational project. Not affiliated with or endorsed by NASA.
          </p>
        </div>

        {/* Source links */}
        <div>
          <h2 className="text-sm font-bold text-ink-100">Primary sources</h2>
          <ul className="mt-3 space-y-2">
            {SOURCES.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-xs text-ink-300 transition-colors duration-fast hover:text-cosmic-cyan"
                >
                  {source.label}
                  <ExternalLink
                    size={11}
                    aria-hidden="true"
                    className="opacity-50 transition-transform duration-fast group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
