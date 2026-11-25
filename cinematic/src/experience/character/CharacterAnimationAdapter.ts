import { AnimationAction, AnimationClip, AnimationMixer, LoopOnce, LoopRepeat, Object3D } from 'three';
import { characterConfig, LOGICAL_STATES, type CharacterAssetConfig, type LogicalState } from './character.config';
import { ProceduralMotion, type ProceduralInputs, type ProceduralOffsets } from './ProceduralMotion';
import { resolveSupported } from './CharacterStateMachine';

export type AdapterMode = 'procedural' | 'skeletal';

export interface AdapterReport {
  mode: AdapterMode;
  clips: string[];
  /** logical state -> matched clip name (only for states that have one). */
  mapping: Partial<Record<LogicalState, string>>;
}

/** Finds the first clip matching any candidate (exact name first, then substring). */
export function matchClip(clips: AnimationClip[], candidates: string[]): AnimationClip | undefined {
  const lower = clips.map((c) => ({ c, n: c.name.toLowerCase().replace(/[\s.-]/g, '_') }));
  for (const cand of candidates) {
    const k = cand.toLowerCase();
    const exact = lower.find((x) => x.n === k);
    if (exact) return exact.c;
  }
  for (const cand of candidates) {
    const k = cand.toLowerCase();
    const part = lower.find((x) => x.n.includes(k));
    if (part) return part.c;
  }
  return undefined;
}

/**
 * CharacterAnimationAdapter
 *
 * The one object the rest of the app uses to "animate the character". It exposes logical
 * states only. Behind it there are two interchangeable back-ends:
 *
 *  - skeletal   : Three.js AnimationMixer with cross-fading, used automatically when the GLB
 *                 contains clips that map (via character.config.ts) to logical states.
 *  - procedural : rigid whole-body motion for the current static mesh (ProceduralMotion.ts).
 *
 * Missing clips never throw: unsupported states fall back along STATE_FALLBACK.
 */
export class CharacterAnimationAdapter {
  readonly mode: AdapterMode;
  readonly report: AdapterReport;
  readonly procedural = new ProceduralMotion();
  /** The state actually playing after fallback resolution. */
  effective: LogicalState = 'Idle';

  private mixer: AnimationMixer | null = null;
  private actions = new Map<LogicalState, AnimationAction>();
  private current: AnimationAction | null = null;
  private config: CharacterAssetConfig;

  constructor(root: Object3D, clips: AnimationClip[], config: CharacterAssetConfig = characterConfig) {
    this.config = config;
    const mapping: AdapterReport['mapping'] = {};
    const skeletalAllowed = config.capabilities?.skeletal !== false && clips.length > 0;

    if (skeletalAllowed) {
      this.mixer = new AnimationMixer(root);
      for (const state of LOGICAL_STATES) {
        const clip = matchClip(clips, config.animationMap[state]);
        if (!clip) continue;
        const action = this.mixer.clipAction(clip);
        const pb = config.playback[state];
        if (pb?.loop === 'once') {
          action.setLoop(LoopOnce, 1);
          action.clampWhenFinished = true;
        } else {
          action.setLoop(LoopRepeat, Infinity);
        }
        if (pb?.timeScale) action.timeScale = pb.timeScale;
        this.actions.set(state, action);
        mapping[state] = clip.name;
      }
    }
    this.mode = this.actions.size > 0 ? 'skeletal' : 'procedural';
    this.report = { mode: this.mode, clips: clips.map((c) => c.name), mapping };
  }

  /** Does this logical state have a real implementation (clip OR procedural)? */
  supports(state: LogicalState): boolean {
    if (this.mode === 'skeletal') return this.actions.has(state);
    // Procedural back-end only implements these rigid behaviours.
    return state === 'Idle' || state === 'Walk' || state === 'LookAtCamera' || state === 'Turn';
  }

  /** Has a *real skeletal clip* for this state (used by timelines to await clip durations). */
  hasClip(state: LogicalState): boolean {
    return this.actions.has(state);
  }

  clipDuration(state: LogicalState): number {
    return this.actions.get(state)?.getClip().duration ?? 0;
  }

  /** Request a logical state. Returns the state that is actually used after fallback. */
  setState(desired: LogicalState): LogicalState {
    const next = resolveSupported(desired, (s) => this.supports(s));
    if (next === this.effective && this.current) return next;
    this.effective = next;
    if (this.mode === 'skeletal') {
      const action = this.actions.get(next) ?? null;
      if (action && action !== this.current) {
        action.reset().setEffectiveWeight(1).fadeIn(this.config.crossFadeSeconds).play();
        this.current?.fadeOut(this.config.crossFadeSeconds);
        this.current = action;
      }
    }
    return next;
  }

  /** Sync in-place locomotion clip speed with the root speed (world units/s). */
  setLocomotionSpeed(speed: number) {
    if (this.mode !== 'skeletal') return;
    const a = this.current;
    if (a && (this.effective === 'Walk' || this.effective === 'Run')) {
      a.timeScale = Math.max(0.4, Math.min(1.8, 0.6 + speed * 1.4));
    }
  }

  update(dt: number, inputs: ProceduralInputs): ProceduralOffsets {
    if (this.mode === 'skeletal') {
      this.mixer?.update(dt);
      this.procedural.reset();
      return this.procedural.offsets;
    }
    return this.procedural.update(dt, this.effective, inputs);
  }

  dispose() {
    this.mixer?.stopAllAction();
    this.mixer?.uncacheRoot(this.mixer.getRoot());
    this.actions.clear();
    this.mixer = null;
  }
}
