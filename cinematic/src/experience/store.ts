'use client';
import { createStore, useStore } from '@/utils/store';
import type { QualityTier } from '@/config/scene.config';
import type { LogicalState } from './character/character.config';
import { KEYFRAMES, type Pose } from '@/config/timeline.config';

export type Phase = 'loading' | 'transition' | 'falling' | 'landing' | 'journey';

/** LOW-frequency state that React components subscribe to. */
export const ui = createStore({
  phase: 'loading' as Phase,
  activeIndex: 0,
  reducedMotion: false,
  webgl: true,
  quality: 'medium' as QualityTier,
  sound: false,
  modelReady: false,
  modelFailed: false,
  /** Bumped by "Replay intro". */
  replayToken: 0,
  /** Bumped when the user presses Skip. */
  skipToken: 0,
  /** Short label shown by the loader overlay (set by the loader director). */
  loaderStatus: 'Setting the stage',
  /** Loader finished (or was skipped / failed) — page content may be revealed. */
  introDone: false,
});

/** React hook for the low-frequency UI store. */
export const useUi = <S,>(selector: (s: ReturnType<typeof ui.get>) => S): S => useStore(ui, selector);

/**
 * HIGH-frequency mutable state, read & written inside animation frames.
 * Never put this in React state — it would re-render at 60 Hz.
 */
export const xp = {
  scroll: { y: 0, limit: 1, progress: 0, velocity: 0, /** continuous section index */ section: 0 },
  viewport: { w: 1, h: 1, aspect: 1, mobile: false },
  /** Sampled from the timeline for the current scroll position (before responsive adaptation). */
  pose: KEYFRAMES[0].pose as Pose,
  loader: { /** 0…1 real asset-loading progress */ progress: 0, /** displayed value (never exceeds `progress`) */ shown: 0, /** stage lights 0…1 */ stage: 0, typing: 0 },
  laptop: { visible: 0, open: 0, glow: 0, y: 0 },
  character: {
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    speed: 0,
    state: 'Idle' as LogicalState,
    effective: 'Idle' as LogicalState,
    mode: 'procedural' as 'procedural' | 'skeletal',
    clips: [] as string[],
    triangles: 0,
    height: 1,
    /** 0…1 material opacity (loader fade-in). */
    opacity: 1,
    /** Phase/timeline-forced logical state; null = derive from locomotion. */
    forced: null as LogicalState | null,
  },
  camera: { x: 0.05, y: 0.72, z: 3.5, tx: 0.02, ty: 0.5, tz: 0, shake: 0, /** 0 = loader framing, 1 = scroll timeline */ blend: 0 },
  perf: { fps: 60, dpr: 1 },
  events: { impactCount: 0, impactX: 0, impactZ: 0, impactPower: 0 },
  /** Dev-only overrides driven by the debug panel. */
  debug: { scale: 1, dx: 0, dy: 0, camZ: 0, camY: 0, key: 1, freeze: false },
};

export const isDev = process.env.NODE_ENV !== 'production';
