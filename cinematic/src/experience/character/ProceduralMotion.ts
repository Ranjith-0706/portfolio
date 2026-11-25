import type { LogicalState } from './character.config';
import { damp } from '@/utils/math';

/**
 * TEMPORARY motion for the current *static* mesh (no skeleton, no clips).
 *
 * Rules (deliberately strict):
 *  - Only whole-body, rigid transforms: no limb deformation, no stretching.
 *  - "Walk" is NOT faked with step bobbing. A static mesh moving across the floor is a *glide*:
 *    we only lean it slightly into the direction of travel.
 *  - Idle gets a very small breathing bob so the character never looks frozen.
 *
 * This file is the only place that contains such behaviour. When a rigged model with clips is
 * loaded, the adapter switches to AnimationMixer playback and this module returns zeros.
 */
export interface ProceduralOffsets {
  y: number;
  pitch: number;
  roll: number;
  yawSway: number;
}

export interface ProceduralInputs {
  t: number;
  /** Signed world-space X velocity (units/s). */
  vx: number;
  /** Ground speed (units/s). */
  speed: number;
  grounded: boolean;
  reducedMotion: boolean;
}

export class ProceduralMotion {
  readonly offsets: ProceduralOffsets = { y: 0, pitch: 0, roll: 0, yawSway: 0 };
  private idleWeight = 1;
  private lean = 0;

  update(dt: number, state: LogicalState, i: ProceduralInputs) {
    const o = this.offsets;
    if (i.reducedMotion) {
      o.y = o.pitch = o.roll = o.yawSway = 0;
      return o;
    }
    // Weight eases in once motion stops → "settles into idle" instead of snapping.
    const wantIdle = i.grounded && i.speed < 0.08 && state !== 'Fall' ? 1 : 0;
    this.idleWeight = damp(this.idleWeight, wantIdle, 3, dt);

    const breathe = Math.sin(i.t * 1.7) * 0.0055 + Math.sin(i.t * 0.9 + 1.2) * 0.0025;
    const sway = Math.sin(i.t * 0.55) * 0.025;

    // Lean into the direction of travel (rigid tilt, small).
    const leanTarget = Math.max(-0.1, Math.min(0.1, -i.vx * 0.05));
    this.lean = damp(this.lean, leanTarget, 6, dt);

    o.y = breathe * this.idleWeight;
    o.yawSway = sway * this.idleWeight;
    o.roll = this.lean;
    o.pitch = Math.abs(this.lean) * 0.25;
    return o;
  }

  reset() {
    this.offsets.y = this.offsets.pitch = this.offsets.roll = this.offsets.yawSway = 0;
    this.lean = 0;
  }
}
