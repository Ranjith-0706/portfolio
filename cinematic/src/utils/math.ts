export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
/** Frame-rate independent exponential smoothing. lambda ≈ responsiveness (1/s). */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));
/** Shortest signed angle difference. */
export const angleDelta = (from: number, to: number) => {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};
export const dampAngle = (current: number, target: number, lambda: number, dt: number) =>
  current + angleDelta(current, target) * (1 - Math.exp(-lambda * dt));

/** Recursively interpolate two objects that share the same numeric shape. */
export function lerpDeep<T>(a: T, b: T, t: number): T {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t) as T;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => lerpDeep(v, b[i], t)) as T;
  if (a && b && typeof a === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(a as object)) {
      out[k] = lerpDeep((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], t);
    }
    return out as T;
  }
  return a;
}
