'use client';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { CAMERA, QUALITY_PRESETS } from '@/config/scene.config';
import { lerp } from '@/utils/math';
import { ui, useUi } from '../store';
import { characterConfig } from '../character/character.config';
import { CharacterController } from '../character/CharacterController';
import { CameraController } from '../camera/CameraController';
import { LightingController } from '../lighting/LightingController';
import { EnvironmentController } from '../environment/EnvironmentController';
import { Laptop } from '../loader/Laptop';
import { PerformanceManager } from '../performance/PerformanceManager';
import { ErrorBoundary } from './ErrorBoundary';

const PostFx = lazy(() => import('./PostFx'));

/** Releases GPU resources + caches when the canvas goes away (route change, hot reload, unmount). */
function Disposer() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(
    () => () => {
      scene.traverse((o) => {
        const m = o as import('three').Mesh;
        m.geometry?.dispose?.();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        for (const mat of mats) {
          for (const v of Object.values(mat)) (v as { isTexture?: boolean; dispose?: () => void })?.isTexture && (v as { dispose: () => void }).dispose();
          mat.dispose();
        }
      });
      useGLTF.clear(characterConfig.url);
      gl.dispose();
    },
    [gl, scene],
  );
  return null;
}

function ContextWatcher() {
  const el = useThree((s) => s.gl.domElement);
  useEffect(() => {
    const lost = (e: Event) => {
      e.preventDefault();
      console.warn('[3d] WebGL context lost — switching to the static, content-first experience');
      // Switch to the static, content-first experience instead of a frozen canvas.
      ui.set({ webgl: false, phase: 'journey', introDone: true });
    };
    el.addEventListener('webglcontextlost', lost);
    return () => el.removeEventListener('webglcontextlost', lost);
  }, [el]);
  return null;
}

function Scene({ onDpr }: { onDpr: (f: number) => void }) {
  const quality = useUi((s) => s.quality);
  const preset = QUALITY_PRESETS[quality];
  return (
    <>
      <PerformanceManager onDpr={onDpr} />
      <ContextWatcher />
      <CameraController />
      <LightingController />
      <EnvironmentController />
      <Laptop />
      <CharacterController />
      {preset.postprocessing && (
        <Suspense fallback={null}>
          <PostFx />
        </Suspense>
      )}
      <Disposer />
    </>
  );
}

/**
 * PersistentCanvas — the ONE WebGL canvas for the whole site. It is mounted once, fixed behind
 * the content, and never unmounted between sections: one renderer, one scene, one character.
 */
export default function PersistentCanvas() {
  const quality = useUi((s) => s.quality);
  const preset = QUALITY_PRESETS[quality];
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, preset.dpr[1]));
  const [paused, setPaused] = useState(false);

  // Cap the pixel ratio by the tier; PerformanceMonitor lowers it further under load.
  const onDpr = useCallback(
    (factor: number) => {
      const target = lerp(preset.dpr[0], Math.min(window.devicePixelRatio || 1, preset.dpr[1]), factor);
      setDpr(Math.max(preset.dpr[0], Math.round(target * 20) / 20));
    },
    [preset],
  );
  useEffect(() => {
    setDpr((d) => Math.min(d, preset.dpr[1]));
  }, [preset]);

  // Stop rendering entirely while the tab is hidden.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <div className="stage" aria-hidden="true">
      <ErrorBoundary onError={() => ui.set({ webgl: false, phase: 'journey', introDone: true })}>
        <Canvas
          frameloop={paused ? 'never' : 'always'}
          dpr={dpr}
          shadows={preset.shadowMap > 0 ? 'percentage' : false}
          gl={{ antialias: preset.antialias, alpha: true, powerPreference: 'high-performance', stencil: false }}
          camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: [0.05, 0.72, 3.5] }}
        >
          <Scene onDpr={onDpr} />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
