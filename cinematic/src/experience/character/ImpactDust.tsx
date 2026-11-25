'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three';
import { xp } from '../store';

const COUNT = 70;

/** Restrained ground-impact dust: a short radial puff that rises slightly and fades. */
export function ImpactDust() {
  const ref = useRef<Points>(null);
  const state = useRef({ seen: 0, age: 99, vel: new Float32Array(COUNT * 3) });

  const { geometry, material } = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(COUNT * 3), 3));
    const material = new PointsMaterial({
      color: '#D7AC74',
      size: 0.045,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
      blending: AdditiveBlending,
    });
    return { geometry, material };
  }, []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = state.current;
    const pts = ref.current;
    if (!pts) return;

    if (xp.events.impactCount !== s.seen) {
      s.seen = xp.events.impactCount;
      s.age = 0;
      const pos = geometry.attributes.position as BufferAttribute;
      const power = Math.min(1.6, 0.5 + xp.events.impactPower * 0.18);
      for (let i = 0; i < COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 0.05 + Math.random() * 0.12;
        pos.setXYZ(i, xp.events.impactX + Math.cos(a) * r, 0.02, xp.events.impactZ + Math.sin(a) * r);
        const sp = (0.5 + Math.random() * 1.4) * power;
        s.vel[i * 3] = Math.cos(a) * sp;
        s.vel[i * 3 + 1] = 0.25 + Math.random() * 0.6;
        s.vel[i * 3 + 2] = Math.sin(a) * sp;
      }
      pos.needsUpdate = true;
    }

    if (s.age < 1.4) {
      s.age += dt;
      const pos = geometry.attributes.position as BufferAttribute;
      const drag = Math.exp(-3.2 * dt);
      for (let i = 0; i < COUNT; i++) {
        s.vel[i * 3] *= drag;
        s.vel[i * 3 + 2] *= drag;
        s.vel[i * 3 + 1] *= Math.exp(-2 * dt);
        pos.setXYZ(
          i,
          pos.getX(i) + s.vel[i * 3] * dt,
          pos.getY(i) + s.vel[i * 3 + 1] * dt,
          pos.getZ(i) + s.vel[i * 3 + 2] * dt,
        );
      }
      pos.needsUpdate = true;
      material.opacity = Math.max(0, 0.55 * (1 - s.age / 1.4));
    } else if (material.opacity !== 0) {
      material.opacity = 0;
    }
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
