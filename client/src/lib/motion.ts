/**
 * Mathematical & Animation Utilities for Cinematic Scroll
 */

export function clamp(v: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Standard smoothstep function: S(t) = 3t^2 - 2t^3
 * Smoothly interpolates from 0 to 1 between lower bound a and upper bound b.
 */
export function smoothstep(a: number, b: number, v: number): number {
  if (a === b) return v >= a ? 1 : 0;
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/**
 * Standard easeInOutCubic:
 * 4t^3 below 0.5, else 1 - (-2t + 2)^3 / 2
 */
export function easeInOutCubic(t: number): number {
  const clamped = clamp(t, 0, 1);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
