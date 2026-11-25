import type { LogicalState } from './character.config';

/**
 * Logical-state layer. Everything above this file (sections, timelines, loader) requests
 * *logical* states; the adapter decides whether a real clip exists. When a state isn't
 * supported we walk this chain until we reach something that is (ultimately Idle).
 */
export const STATE_FALLBACK: Record<LogicalState, LogicalState> = {
  Idle: 'Idle',
  Run: 'Walk',
  Walk: 'Idle',
  Turn: 'Walk',
  Fall: 'Idle',
  Land: 'Idle',
  StandUp: 'Idle',
  Sit: 'Idle',
  LaptopOpen: 'Idle',
  LaptopClose: 'Idle',
  Typing: 'Idle',
  Wave: 'LookAtCamera',
  LookAtCamera: 'Idle',
};

export function resolveSupported(desired: LogicalState, supports: (s: LogicalState) => boolean): LogicalState {
  let s: LogicalState = desired;
  for (let i = 0; i < 6; i++) {
    if (supports(s)) return s;
    const next = STATE_FALLBACK[s];
    if (next === s) break;
    s = next;
  }
  return 'Idle';
}

export interface LocomotionInputs {
  /** Ground-plane speed in world units / second. */
  speed: number;
  /** Absolute yaw velocity in rad/s. */
  yawRate: number;
  /** Phase-forced state (loader, fall…). Overrides locomotion. */
  forced?: LogicalState | null;
}

/**
 * Derives the *desired* logical state with hysteresis so Idle<->Walk never flickers
 * while the user scrubs the scroll wheel.
 */
export class CharacterStateMachine {
  state: LogicalState = 'Idle';
  private since = 0;
  private time = 0;

  static readonly WALK_ON = 0.14;
  static readonly WALK_OFF = 0.05;
  static readonly MIN_DWELL = 0.3;

  update(dt: number, inputs: LocomotionInputs): LogicalState {
    this.time += dt;
    let next: LogicalState = this.state;

    if (inputs.forced) {
      next = inputs.forced;
    } else {
      const dwell = this.time - this.since;
      if (this.state === 'Walk' || this.state === 'Run' || this.state === 'Turn') {
        if (inputs.speed < CharacterStateMachine.WALK_OFF && dwell > CharacterStateMachine.MIN_DWELL) next = 'Idle';
        else if (inputs.speed > 1.6) next = 'Run';
        else if (inputs.speed < CharacterStateMachine.WALK_ON && inputs.yawRate > 1.2) next = 'Turn';
        else next = 'Walk';
      } else if (inputs.speed > CharacterStateMachine.WALK_ON && dwell > 0.05) {
        next = 'Walk';
      } else if (
        this.state !== 'Idle' &&
        this.state !== 'LookAtCamera' &&
        dwell > CharacterStateMachine.MIN_DWELL
      ) {
        next = 'Idle';
      }
    }

    if (next !== this.state) {
      this.state = next;
      this.since = this.time;
    }
    return this.state;
  }

  /** Force a state (e.g. loader steps). Pass null to release back to locomotion. */
  force(state: LogicalState) {
    this.state = state;
    this.since = this.time;
  }
}
