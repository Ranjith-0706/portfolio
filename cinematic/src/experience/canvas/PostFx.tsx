'use client';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

/**
 * Selective post-processing — "high" tier only. Bloom is gated by a high luminance threshold so
 * it only catches the emissive laptop/monitor screens and the warm lamp, never the whole frame.
 */
export default function PostFx() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={0.45} luminanceThreshold={0.92} luminanceSmoothing={0.2} mipmapBlur levels={4} />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
    </EffectComposer>
  );
}
