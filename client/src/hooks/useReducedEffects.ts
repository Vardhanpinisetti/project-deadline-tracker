import { useState, useEffect } from 'react';

const STORAGE_KEY = 'envision_reduced_effects';

export function useReducedEffects(): [boolean, (val: boolean | ((prev: boolean) => boolean)) => void] {
  const [reduced, setReducedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => {
      // Only follow system change if user has not set an explicit override in storage
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setReducedState(e.matches);
      }
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduced) {
      document.documentElement.classList.add('reduced-effects');
    } else {
      document.documentElement.classList.remove('reduced-effects');
    }
  }, [reduced]);

  const setReduced = (val: boolean | ((prev: boolean) => boolean)) => {
    setReducedState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return [reduced, setReduced];
}
