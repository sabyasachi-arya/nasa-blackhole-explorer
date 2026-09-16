import { useEffect, useState } from 'react';
import BlackHoleVisual from './BlackHoleVisual';
import type { BlackHoleType } from '../types/blackhole';

interface SmartImageProps {
  src?: string;
  alt: string;
  seed: number;
  type: BlackHoleType;
  /** Skip lazy-loading for above-the-fold imagery such as the modal hero. */
  eager?: boolean;
  className?: string;
}

/**
 * Image with a shimmering skeleton while it loads and a procedural black hole
 * as the fallback. Remote imagery is hotlinked from Wikimedia, so failures are
 * expected in the wild (offline, blocked CDN, rate limiting) and must degrade
 * to something that still looks intentional.
 */
export default function SmartImage({
  src,
  alt,
  seed,
  type,
  eager = false,
  className = '',
}: SmartImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');

  // Reset when the component is reused for a different record (modal paging).
  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  const showFallback = status === 'error' || !src;

  return (
    <div className={`relative h-full w-full overflow-hidden bg-space-900 ${className}`}>
      {showFallback ? (
        <BlackHoleVisual seed={seed} type={type} />
      ) : (
        <>
          {status === 'loading' && <div className="skeleton absolute inset-0" />}
          <img
            src={src}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              status === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      )}
    </div>
  );
}
