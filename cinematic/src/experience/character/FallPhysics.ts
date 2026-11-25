import { FALL } from '@/config/scene.config';

export interface FallResult {
  y: number;
  vy: number;
  /** Fired once on the first ground contact with the impact speed. */
  impact: number | null;
  /** True once the character has fully come to rest. */
  settled: boolean;
  /** Small damped spring used for the gentle landing "give" (pitch rock + dip). */
  landSpring: number;
}

/**
 * Gravity-inspired falling for the hero entrance. Deliberately tiny and deterministic:
 * semi-implicit Euler integration, one soft bounce, then a damped spring for the landing
 * "give". Independent from any animation clips.
 */
export class FallPhysics {
  y = 0;
  vy = 0;
  private bounces = 0;
  private spring = 0;
  private springV = 0;
  private restTime = 0;
  private impactFired = false;

  start(startY: number) {
    this.y = startY;
    this.vy = 0;
    this.bounces = 0;
    this.spring = 0;
    this.springV = 0;
    this.restTime = 0;
    this.impactFired = false;
  }

  update(dt: number): FallResult {
    let impact: number | null = null;
    this.vy -= FALL.gravity * dt;
    this.y += this.vy * dt;

    if (this.y <= 0) {
      this.y = 0;
      const v = -this.vy;
      if (!this.impactFired) {
        impact = v;
        this.impactFired = true;
        this.springV = -v * 0.9; // kick the landing spring
      }
      if (v > 0.9 && this.bounces < 2) {
        this.vy = v * FALL.restitution;
        this.bounces++;
      } else {
        this.vy = 0;
        this.restTime += dt;
      }
    }

    // Damped spring (critically-ish) for the landing give.
    const k = 120;
    const c = 14;
    this.springV += (-k * this.spring - c * this.springV) * dt;
    this.spring += this.springV * dt;

    const settled = this.y === 0 && this.vy === 0 && this.restTime > 0.35 && Math.abs(this.spring) < 0.002;
    return { y: this.y, vy: this.vy, impact, settled, landSpring: this.spring };
  }
}
