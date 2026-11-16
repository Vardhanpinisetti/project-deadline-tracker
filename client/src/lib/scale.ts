/**
 * Sets --u (design unit in px) on document.documentElement.
 * On screens wider than 820px: 1u = clientWidth / 1440
 * On screens 820px or below:  1u = clientWidth / 390
 */
export function initScale(): () => void {
  function updateScale() {
    if (typeof document === 'undefined') return;
    const width = document.documentElement.clientWidth || window.innerWidth;
    const u = width > 820 ? width / 1440 : width / 390;
    document.documentElement.style.setProperty('--u', `${u}px`);
  }

  updateScale();
  window.addEventListener('resize', updateScale, { passive: true });
  window.addEventListener('orientationchange', updateScale, { passive: true });

  return () => {
    window.removeEventListener('resize', updateScale);
    window.removeEventListener('orientationchange', updateScale);
  };
}
