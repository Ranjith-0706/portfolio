'use client';
import { forwardRef, useMemo } from 'react';
import { CanvasTexture, LinearFilter, type Mesh } from 'three';

/** Soft radial contact shadow. Always on (cheap) — real shadow maps are an optional extra. */
export const BlobShadow = forwardRef<Mesh>(function BlobShadow(_, ref) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.9)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const t = new CanvasTexture(c);
    t.minFilter = LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, []);

  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position-y={0.004} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.7} toneMapped={false} />
    </mesh>
  );
});
