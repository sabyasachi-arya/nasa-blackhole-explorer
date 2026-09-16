import { useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/* useDebounce — keeps typing responsive by deferring expensive work   */
/* ------------------------------------------------------------------ */
export function useDebounce<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/* ------------------------------------------------------------------ */
/* useLocalStorage — persisted state that degrades gracefully          */
/* ------------------------------------------------------------------ */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      // Private browsing, blocked site data, or corrupt JSON.
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* non-fatal: the session simply won't persist */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/* ------------------------------------------------------------------ */
/* useInView — one-shot intersection trigger for scroll animations     */
/* ------------------------------------------------------------------ */
/**
 * The bottom margin is positive so the root is *expanded* downward: an element
 * sitting just below the fold on load counts as visible and animates
 * immediately, rather than sitting at zero until the user happens to scroll.
 */
export function useInView<T extends HTMLElement>(rootMargin = '0px 0px 35% 0px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.15 },
    );

    observer.observe(node);

    // Safety net: in some environments (background tabs, prerendering, pages
    // that never composite) the observer never reports. Reveal the content
    // anyway rather than leaving a counter frozen at zero.
    const fallback = window.setTimeout(() => setInView(true), 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [rootMargin]);

  return { ref, inView } as const;
}

/* ------------------------------------------------------------------ */
/* useAnimatedCounter — eased count-up, honouring reduced motion       */
/* ------------------------------------------------------------------ */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export function useAnimatedCounter(target: number, active: boolean, duration = 1400): number {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>();

  useEffect(() => {
    if (!active) return;

    if (prefersReducedMotion()) {
      setDisplay(target);
      return;
    }

    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo: fast start, gentle settle
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);

    // requestAnimationFrame is suspended while a page is hidden or not
    // compositing, which would leave the figure stranded at zero. Guarantee
    // the true value lands once the animation window has elapsed.
    const settle = window.setTimeout(() => setDisplay(target), duration + 80);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.clearTimeout(settle);
    };
  }, [target, active, duration]);

  return display;
}

/* ------------------------------------------------------------------ */
/* useBodyScrollLock — freeze the page behind an open overlay          */
/* ------------------------------------------------------------------ */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const { body } = document;
    const previousPadding = body.style.paddingRight;
    // Compensate for the scrollbar disappearing so the layout doesn't jump.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    body.classList.add('scroll-locked');

    return () => {
      body.classList.remove('scroll-locked');
      body.style.paddingRight = previousPadding;
    };
  }, [locked]);
}

/* ------------------------------------------------------------------ */
/* useFavourites — bookmarked records, persisted between visits        */
/* ------------------------------------------------------------------ */
export function useFavourites() {
  const [favourites, setFavourites] = useLocalStorage<number[]>('bhx:favourites', []);

  const toggle = useCallback(
    (id: number) => {
      setFavourites((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      );
    },
    [setFavourites],
  );

  const isFavourite = useCallback((id: number) => favourites.includes(id), [favourites]);

  return { favourites, toggle, isFavourite } as const;
}

/* ------------------------------------------------------------------ */
/* useMediaQuery — responsive branching for behaviour, not just style  */
/* ------------------------------------------------------------------ */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
