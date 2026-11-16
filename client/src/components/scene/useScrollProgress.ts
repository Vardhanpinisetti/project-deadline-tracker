import { useState, useEffect, useRef } from 'react';
import { smoothstep } from '../../lib/motion';

export interface ScrollState {
  scrollY: number;
  viewportHeight: number;
  toEmber: number;
  toNight: number;
  isScrolled: boolean;
  scrollVelocity: number;
  footerTop: number;
}

export function useScrollProgress(): ScrollState {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollY: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 900,
    toEmber: 0,
    toNight: 0,
    isScrolled: false,
    scrollVelocity: 0,
    footerTop: 3000,
  });

  const lastScrollY = useRef(0);
  const lastTime = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const smoothedVelocity = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    function update() {
      const y = window.scrollY || window.pageYOffset || 0;
      const h = window.innerHeight || 900;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime.current);
      lastTime.current = now;

      // Instant velocity (px/sec)
      const instantVelocity = Math.abs((y - lastScrollY.current) / (dt / 1000));
      lastScrollY.current = y;

      // Smooth velocity: vel += (instant - vel) * 0.1
      smoothedVelocity.current += (instantVelocity - smoothedVelocity.current) * 0.1;

      // Locate footer / end section
      const footerEl = document.getElementById('end');
      let footerTop = document.documentElement.scrollHeight - h;
      if (footerEl) {
        const rect = footerEl.getBoundingClientRect();
        footerTop = rect.top + y;
      }

      // Scroll crossfade:
      // toEmber = smoothstep(0.15h, 1.05h, y)
      // toNight = smoothstep(footerTop - 1.1h, footerTop - 0.1h, y)
      const toEmber = smoothstep(0.15 * h, 1.05 * h, y);
      const toNight = smoothstep(footerTop - 1.1 * h, footerTop - 0.1 * h, y);
      const isScrolled = y > 0.5 * h;

      setScrollState({
        scrollY: y,
        viewportHeight: h,
        toEmber,
        toNight,
        isScrolled,
        scrollVelocity: smoothedVelocity.current,
        footerTop,
      });
    }

    function onScrollOrResize() {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        update();
        rafId.current = null;
      });
    }

    update();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return scrollState;
}
