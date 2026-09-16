import { useEffect, useState } from 'react';
import { ArrowDown, Radio } from 'lucide-react';

interface HeroProps {
  total: number;
}

export default function Hero({ total }: HeroProps) {
  const [offset, setOffset] = useState(0);

  // Gentle parallax on the hero only — cheap, and stops at 400px of scroll.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setOffset(Math.min(window.scrollY, 400));
        frame = 0;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="relative overflow-hidden pb-10 pt-14 md:pb-14 md:pt-20">
      <div
        className="page-container gpu relative text-center"
        style={{ transform: `translate3d(0, ${offset * 0.15}px, 0)`, opacity: 1 - offset / 700 }}
      >
        <span className="glass animate-fade-up inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-300">
          <Radio size={12} className="text-cosmic-cyan" aria-hidden="true" />
          {total} confirmed objects
        </span>

        <h1
          className="animate-fade-up mx-auto mt-6 max-w-4xl text-display font-extrabold"
          style={{ animationDelay: '80ms' }}
        >
          <span className="text-ink-100">Mapping the </span>
          <span className="text-gradient">darkest objects</span>
          <span className="text-ink-100"> in the known universe</span>
        </h1>

        <p
          className="animate-fade-up mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-300 md:text-base"
          style={{ animationDelay: '160ms' }}
        >
          A researcher's catalogue of black holes confirmed by NASA, ESA and ground-based
          observatories — their distance from Earth, mass, event-horizon scale, discovery history
          and the sources behind every figure.
        </p>

        <div
          className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: '240ms' }}
        >
          <a href="#catalogue" className="btn-primary">
            Browse the catalogue
            <ArrowDown size={15} aria-hidden="true" />
          </a>
          <a
            href="https://science.nasa.gov/universe/black-holes/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            NASA background reading
          </a>
        </div>
      </div>
    </section>
  );
}
