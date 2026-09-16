import { useCallback, useState } from 'react';
import BlackHoleVisual from './BlackHoleVisual';
import type { BlackHoleType } from '../types/blackhole';

/** Rendition widths; keep in sync with WIDTHS in scripts/optimize-images.mjs. */
const IMAGE_WIDTHS = [480, 720, 960];

interface SmartImageProps {
  /** Remote original, used only when no self-hosted rendition exists. */
  src?: string;
  /** Base name of the self-hosted WebP renditions in public/images. */
  localImage?: string;
  alt: string;
  seed: number;
  type: BlackHoleType;
  /** Skip lazy-loading for above-the-fold imagery such as the modal hero. */
  eager?: boolean;
  /** Rendered width hint so phones pick the small rendition. */
  sizes?: string;
  className?: string;
}

/**
 * Image with a shimmering skeleton while it loads and a procedural black hole
 * as the fallback. Self-hosted renditions are preferred: hotlinked Wikimedia
 * thumbnails get rate-limited, especially on mobile networks.
 */
export default function SmartImage(props: SmartImageProps) {
  const url = props.localImage
    ? `${import.meta.env.BASE_URL}images/${props.localImage}-960.webp`
    : props.src;
  // Keyed by URL so paging the modal to another record starts a fresh load
  // instead of resetting state in an effect (which could race a cached load).
  return <SmartImageInner key={url ?? 'none'} {...props} url={url} />;
}

function SmartImageInner({
  url,
  localImage,
  alt,
  seed,
  type,
  eager = false,
  sizes = '100vw',
  className = '',
}: SmartImageProps & { url?: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(url ? 'loading' : 'error');

  // A cached image can finish before React attaches onLoad; catch that case.
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
  }, []);

  const srcSet = localImage
    ? IMAGE_WIDTHS.map((w) => `${import.meta.env.BASE_URL}images/${localImage}-${w}.webp ${w}w`).join(', ')
    : undefined;

  const showFallback = status === 'error' || !url;

  return (
    <div className={`relative h-full w-full overflow-hidden bg-space-900 ${className}`}>
      {showFallback ? (
        <BlackHoleVisual seed={seed} type={type} />
      ) : (
        <>
          {status === 'loading' && <div className="skeleton absolute inset-0" />}
          <img
            ref={imgRef}
            src={url}
            srcSet={srcSet}
            sizes={srcSet ? sizes : undefined}
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
