/** Global look + quality configuration. Character-specific data lives in character.config.ts. */
export const PALETTE = {
  bg: '#09090B',
  bg2: '#121214',
  text: '#F4F1EB',
  muted: '#929298',
  accent: '#D7AC74',
} as const;

export type QualityTier = 'high' | 'medium' | 'low';

export interface QualityPreset {
  dpr: [number, number];
  antialias: boolean;
  shadowMap: number; // 0 = no real-time shadow map (blob shadow only)
  particles: number;
  postprocessing: boolean;
}

export const QUALITY_PRESETS: Record<QualityTier, QualityPreset> = {
  high: { dpr: [1, 2], antialias: true, shadowMap: 1024, particles: 220, postprocessing: true },
  medium: { dpr: [1, 1.5], antialias: true, shadowMap: 512, particles: 120, postprocessing: false },
  low: { dpr: [0.75, 1], antialias: false, shadowMap: 0, particles: 50, postprocessing: false },
};

export const CAMERA = { fov: 32, mobileFov: 40, near: 0.1, far: 60 } as const;

/** Gravity used by the hero entrance (world units / s²). Lower than 9.8 reads as "cinematic". */
export const FALL = { gravity: 8.5, restitution: 0.14, startMargin: 1.4 } as const;

/** Loader timing (ms). The loader can never hold the site longer than maxDuration. */
export const LOADER = { minDuration: 4200, maxDuration: 20000 } as const;
