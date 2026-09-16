import { useEffect, useRef } from 'react';

/** Deterministic pseudo-random so the sky is the same on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Star {
  /** Normalised position, 0..1, so the field survives resizes. */
  x: number;
  y: number;
  size: number;
  /** 0 = far, 1 = near. Drives parallax, brightness and lensing strength. */
  depth: number;
  hue: string;
  phase: number;
  speed: number;
}

/** Extra canvas around the nebula so parallax never reveals an edge. */
const PARALLAX_MARGIN = 60;
/** How many CSS pixels per 10,000 px² of viewport get a star. */
const STAR_DENSITY = 1.6;
const MAX_STARS = 900;

const STAR_HUES = ['226, 232, 240', '191, 219, 254', '165, 243, 252', '233, 213, 255', '254, 243, 199'];

function buildStars(width: number, height: number): Star[] {
  const random = mulberry32(20190410); // the date of the first EHT image
  const count = Math.min(MAX_STARS, Math.round(((width * height) / 10000) * STAR_DENSITY));
  return Array.from({ length: count }, () => {
    const depth = random() ** 2.2; // most stars far away, a few close
    return {
      x: random(),
      y: random(),
      depth,
      size: 0.4 + depth * 1.9 + random() * 0.4,
      hue: STAR_HUES[Math.floor(random() * STAR_HUES.length)],
      phase: random() * Math.PI * 2,
      speed: 0.4 + random() * 1.4,
    };
  });
}

/** Paints soft nebula clouds once into an offscreen canvas. */
function paintNebula(width: number, height: number): HTMLCanvasElement {
  // Render at half resolution — it is all blur, nobody can tell.
  const scale = 0.5;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((width + PARALLAX_MARGIN * 2) * scale);
  canvas.height = Math.ceil((height + PARALLAX_MARGIN * 2) * scale);
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  const random = mulberry32(1974);

  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, 'rgb(4, 6, 22)');
  base.addColorStop(0.5, 'rgb(7, 10, 32)');
  base.addColorStop(1, 'rgb(3, 5, 16)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Large coloured clouds, then smaller wisps layered on top.
  const clouds: [number, number, number, string, number][] = [
    [0.18, 0.12, 0.55, '124, 58, 237', 0.32],
    [0.85, 0.2, 0.45, '14, 165, 233', 0.22],
    [0.7, 0.75, 0.6, '219, 39, 119', 0.18],
    [0.1, 0.85, 0.5, '37, 99, 235', 0.2],
    [0.5, 0.45, 0.35, '99, 102, 241', 0.12],
  ];
  ctx.globalCompositeOperation = 'lighter';
  for (const [cx, cy, radius, rgb, alpha] of clouds) {
    const r = radius * Math.max(w, h);
    const g = ctx.createRadialGradient(cx * w, cy * h, 0, cx * w, cy * h, r);
    g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    g.addColorStop(0.45, `rgba(${rgb}, ${alpha * 0.35})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  for (let i = 0; i < 70; i += 1) {
    const [, , , rgb] = clouds[Math.floor(random() * clouds.length)];
    const x = random() * w;
    const y = random() * h;
    const r = (0.03 + random() * 0.12) * Math.max(w, h);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb}, ${0.05 + random() * 0.06})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Faint dust band across the sky.
  ctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.35);
  const band = ctx.createLinearGradient(0, -h * 0.25, 0, h * 0.25);
  band.addColorStop(0, 'rgba(200, 210, 255, 0)');
  band.addColorStop(0.5, 'rgba(200, 210, 255, 0.045)');
  band.addColorStop(1, 'rgba(200, 210, 255, 0)');
  ctx.fillStyle = band;
  ctx.fillRect(-w, -h * 0.25, w * 2, h * 0.5);
  ctx.restore();

  return canvas;
}

/**
 * Full-screen interactive sky behind the application.
 *
 * - Nebula and three star depths shift with the cursor (parallax).
 * - The cursor acts as a gravitational lens: starlight near it is bent
 *   outward into an Einstein ring, using the point-lens image equation.
 * - Honours reduced motion (one static frame) and pauses in hidden tabs.
 */
export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let nebula: HTMLCanvasElement | null = null;
    let frame = 0;

    // Target follows the pointer; `lens` eases towards it every frame.
    const target = { x: 0.5, y: 0.4, strength: 0 };
    const lens = { x: 0.5, y: 0.4, strength: 0 };
    const shooting = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = buildStars(width, height);
      nebula = paintNebula(width, height);
      if (reducedMotion) draw(0);
    };

    const draw = (time: number) => {
      const t = time / 1000;
      const ease = reducedMotion ? 1 : 0.08;
      lens.x += (target.x - lens.x) * ease;
      lens.y += (target.y - lens.y) * ease;
      lens.strength += (target.strength - lens.strength) * (reducedMotion ? 1 : 0.05);

      // Parallax offset in the range [-1, 1] from the viewport centre.
      const px = (lens.x - 0.5) * 2;
      const py = (lens.y - 0.5) * 2;

      ctx.globalCompositeOperation = 'source-over';
      if (nebula) {
        ctx.drawImage(
          nebula,
          -PARALLAX_MARGIN - px * PARALLAX_MARGIN * 0.35,
          -PARALLAX_MARGIN - py * PARALLAX_MARGIN * 0.35,
          width + PARALLAX_MARGIN * 2,
          height + PARALLAX_MARGIN * 2,
        );
      }

      const lx = lens.x * width;
      const ly = lens.y * height;
      // Einstein radius scales gently with viewport size.
      const einstein = Math.min(90, Math.max(48, Math.min(width, height) * 0.075)) * lens.strength;
      const einstein2 = einstein * einstein;
      const influence = einstein * 7;

      ctx.globalCompositeOperation = 'lighter';
      for (const star of stars) {
        const shift = 8 + star.depth * 38;
        let x = star.x * width - px * shift;
        let y = star.y * height - py * shift;
        // Slow drift so the sky never looks frozen.
        if (!reducedMotion) x = (((x - t * (1.5 + star.depth * 6)) % width) + width) % width;

        let magnification = 1;
        if (einstein > 0.5) {
          const dx = x - lx;
          const dy = y - ly;
          const d = Math.hypot(dx, dy);
          if (d < influence && d > 0.001) {
            // Primary image of a point lens: θ = (β + √(β² + 4θE²)) / 2
            const bent = (d + Math.sqrt(d * d + 4 * einstein2)) / 2;
            x = lx + (dx / d) * bent;
            y = ly + (dy / d) * bent;
            const u = d / einstein;
            magnification = Math.min(4, (u * u + 2) / (u * Math.sqrt(u * u + 4)));
          }
        }

        const twinkle = reducedMotion ? 0.8 : 0.65 + 0.35 * Math.sin(t * star.speed + star.phase);
        const alpha = Math.min(1, (0.35 + star.depth * 0.6) * twinkle * magnification);
        const size = star.size * Math.sqrt(magnification);

        ctx.fillStyle = `rgba(${star.hue}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        if (size > 1.6) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
          glow.addColorStop(0, `rgba(${star.hue}, ${alpha * 0.35})`);
          glow.addColorStop(1, `rgba(${star.hue}, 0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(x - size * 4, y - size * 4, size * 8, size * 8);
        }
      }

      // Occasional shooting star.
      if (!reducedMotion) {
        if (!shooting.active && Math.random() < 0.0025) {
          shooting.active = true;
          shooting.x = Math.random() * width;
          shooting.y = Math.random() * height * 0.5;
          const angle = Math.PI * (0.15 + Math.random() * 0.2);
          const speed = 9 + Math.random() * 6;
          shooting.vx = Math.cos(angle) * speed;
          shooting.vy = Math.sin(angle) * speed;
          shooting.life = 1;
        }
        if (shooting.active) {
          const tailX = shooting.x - shooting.vx * 9;
          const tailY = shooting.y - shooting.vy * 9;
          const trail = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY);
          trail.addColorStop(0, `rgba(224, 242, 254, ${0.9 * shooting.life})`);
          trail.addColorStop(1, 'rgba(224, 242, 254, 0)');
          ctx.strokeStyle = trail;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(shooting.x, shooting.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
          shooting.x += shooting.vx;
          shooting.y += shooting.vy;
          shooting.life -= 0.018;
          if (shooting.life <= 0) shooting.active = false;
        }
      }

      // The lens itself: a dark shadow with a faint photon ring.
      if (einstein > 0.5) {
        ctx.globalCompositeOperation = 'source-over';
        const shadow = ctx.createRadialGradient(lx, ly, 0, lx, ly, einstein * 0.95);
        shadow.addColorStop(0, `rgba(0, 0, 0, ${0.85 * lens.strength})`);
        shadow.addColorStop(0.7, `rgba(0, 0, 0, ${0.55 * lens.strength})`);
        shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadow;
        ctx.beginPath();
        ctx.arc(lx, ly, einstein, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'lighter';
        const ring = ctx.createRadialGradient(lx, ly, einstein * 0.55, lx, ly, einstein * 1.5);
        ring.addColorStop(0, 'rgba(34, 211, 238, 0)');
        ring.addColorStop(0.35, `rgba(125, 211, 252, ${0.16 * lens.strength})`);
        ring.addColorStop(0.5, `rgba(192, 132, 252, ${0.1 * lens.strength})`);
        ring.addColorStop(1, 'rgba(147, 51, 234, 0)');
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.arc(lx, ly, einstein * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      draw(time);
      frame = requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      target.x = event.clientX / width;
      target.y = event.clientY / height;
      // Touch gets parallax only; the lens would sit under the finger.
      target.strength = event.pointerType === 'mouse' ? 1 : 0;
      if (reducedMotion) draw(0);
    };
    const onPointerLeave = () => {
      target.strength = 0;
      if (reducedMotion) draw(0);
    };
    const onVisibility = () => {
      if (reducedMotion) return;
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    if (!reducedMotion) frame = requestAnimationFrame(loop);
    if (!finePointer) target.strength = 0;

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
