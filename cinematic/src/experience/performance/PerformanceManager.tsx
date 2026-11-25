'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { QUALITY_PRESETS, type QualityTier } from '@/config/scene.config';
import { ui, xp } from '../store';

/**
 * Picks the initial quality tier from cheap, synchronous signals. This machine class (no discrete
 * GPU) is explicitly a target, so Intel/UHD-class integrated graphics land on "medium" and
 * software renderers on "low". `?quality=low|medium|high` overrides for testing.
 */
export function detectQuality(): { tier: QualityTier; webgl: boolean; renderer: string } {
  if (typeof window === 'undefined') return { tier: 'medium', webgl: true, renderer: 'ssr' };

  let renderer = '';
  let webgl = false;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (gl) {
      webgl = true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    webgl = false;
  }

  const forced = new URLSearchParams(location.search).get('quality') as QualityTier | null;
  if (forced && forced in QUALITY_PRESETS) return { tier: forced, webgl, renderer };

  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const r = renderer.toLowerCase();

  let tier: QualityTier = 'medium';
  if (/swiftshader|llvmpipe|software|basic render/.test(r)) tier = 'low';
  else if (mobile) tier = cores >= 8 && mem >= 6 ? 'medium' : 'low';
  else if (/nvidia|geforce|rtx|gtx|radeon rx|radeon pro|apple m\d|apple gpu/.test(r) && cores >= 8) tier = 'high';
  else if (/intel|uhd|iris|vega|adreno|mali/.test(r)) tier = 'medium';
  else if (cores <= 4) tier = 'low';
  return { tier, webgl, renderer };
}

const ORDER: QualityTier[] = ['high', 'medium', 'low'];

/**
 * Runtime adaptation: drei's PerformanceMonitor watches the frame rate. Sustained drops step
 * the tier down (shadow map → particles → post-processing → DPR). We never step back up, to
 * avoid oscillation on borderline hardware.
 */
export function PerformanceManager({ onDpr }: { onDpr: (factor: number) => void }) {
  const acc = useRef({ t: 0, frames: 0 });

  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt;
    a.frames++;
    if (a.t >= 0.5) {
      xp.perf.fps = Math.round(a.frames / a.t);
      a.t = 0;
      a.frames = 0;
    }
  });

  return (
    <PerformanceMonitor
      ms={250}
      iterations={6}
      threshold={0.75}
      flipflops={2}
      onChange={({ factor }) => onDpr(factor)}
      onDecline={() => {
        const i = ORDER.indexOf(ui.get().quality);
        if (i < ORDER.length - 1) ui.set({ quality: ORDER[i + 1] });
      }}
    />
  );
}
