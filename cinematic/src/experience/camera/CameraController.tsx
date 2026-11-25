'use client';
import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { LOADER_STAGE } from '@/config/timeline.config';
import { lerp, damp } from '@/utils/math';
import { ui, xp } from '../store';
import { currentFov, currentPose } from './frame';

/**
 * CameraController — slow dolly + tracking driven by the scroll timeline.
 *
 *  - The camera pose comes from the sampled keyframes (wide → medium → close-up per section).
 *  - Everything is exponentially smoothed, so forward and reverse scrolling look identical.
 *  - Parallax is tiny (a few centimetres) and is disabled for reduced motion.
 *  - No rotation shake: the only transient is a small vertical settle on the hero landing.
 */
export function CameraController() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const pointer = useThree((s) => s.pointer);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const c = xp.camera;
    const { reducedMotion } = ui.get();

    const pose = currentPose().cam;
    const L = LOADER_STAGE.cam;
    const b = c.blend;
    const target = {
      x: lerp(L.x, pose.x, b),
      y: lerp(L.y, pose.y, b),
      z: lerp(L.z, pose.z, b),
      tx: lerp(L.tx, pose.tx, b),
      ty: lerp(L.ty, pose.ty, b),
      tz: lerp(L.tz, pose.tz, b),
    };

    const lambda = reducedMotion ? 14 : 3.2;
    c.x = damp(c.x, target.x, lambda, dt);
    c.y = damp(c.y, target.y, lambda, dt);
    c.z = damp(c.z, target.z, lambda, dt);
    c.tx = damp(c.tx, target.tx, lambda, dt);
    c.ty = damp(c.ty, target.ty, lambda, dt);
    c.tz = damp(c.tz, target.tz, lambda, dt);
    c.shake = damp(c.shake, 0, 6, dt);

    const px = reducedMotion ? 0 : pointer.x * 0.11;
    const py = reducedMotion ? 0 : pointer.y * 0.05;
    const kick = -c.shake * Math.abs(Math.cos(performance.now() * 0.02));

    camera.position.set(c.x + px, c.y + py + kick + xp.debug.camY, c.z + xp.debug.camZ);
    camera.lookAt(c.tx + px * 0.3, c.ty, c.tz);

    const fov = currentFov();
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
