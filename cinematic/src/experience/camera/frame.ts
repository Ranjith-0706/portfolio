import { CAMERA } from '@/config/scene.config';
import { adaptPose } from '@/config/timeline.config';
import { clamp, smoothstep } from '@/utils/math';
import { xp } from '../store';

/** Camera vertical FOV (degrees) for the current viewport. */
export const currentFov = () => (xp.viewport.mobile ? CAMERA.mobileFov : CAMERA.fov);

/**
 * World-space size of the visible frustum slice at depth `z`, using the *smoothed* camera pose
 * (xp.camera) rather than the live parallaxed camera — this keeps character placement stable
 * (no feedback loop between camera drift and character position).
 */
export function visibleAt(z: number) {
  const c = xp.camera;
  const dist = Math.max(0.5, c.z - z);
  const h = 2 * Math.tan((currentFov() * Math.PI) / 360) * dist;
  return { w: h * xp.viewport.aspect, h };
}

/** The scroll-sampled pose, adapted to the current viewport (what the camera & character follow). */
export const currentPose = () =>
  adaptPose(xp.pose, xp.viewport.aspect, smoothstep(clamp(1 - xp.scroll.section)));
