'use client';
import { useEffect, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import { damp } from '@/utils/math';
import { ui, useUi, xp } from '../store';
import { cancelLoader, createLoaderControl, resetIntroState, runLoader, skipLoader, type LoaderControl } from './loaderDirector';
import { scrollToY } from '../scroll/scrollApi';

/**
 * LoaderOverlay — the typographic layer of the cinematic loader + the director host.
 * The 3D stage (laptop, spotlight, character) lives in the persistent canvas; this component only
 * draws the minimal UI and runs the loader sequence. Progress shown is REAL asset progress.
 */
export function LoaderOverlay() {
  const phase = useUi((s) => s.phase);
  const status = useUi((s) => s.loaderStatus);
  const replayToken = useUi((s) => s.replayToken);
  const webgl = useUi((s) => s.webgl);

  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const ctlRef = useRef<LoaderControl | null>(null);

  // ---- real progress from the loading manager (GLB + textures) --------------------------------
  useEffect(() => {
    const sync = () => {
      const p = useProgress.getState();
      const done = ui.get().modelReady;
      xp.loader.progress = done ? 1 : Math.min(1, p.progress / 100);
    };
    sync();
    const unsubA = useProgress.subscribe(sync);
    const unsubB = ui.subscribe(sync);
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  // ---- smooth display value (never exceeds real progress) + DOM updates, no React renders ------
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const target = xp.loader.progress;
      xp.loader.shown = Math.min(target, damp(xp.loader.shown, target, 2.6, dt) + 0.002 * (target > xp.loader.shown ? 1 : 0));
      if (pctRef.current) pctRef.current.textContent = String(Math.round(xp.loader.shown * 100)).padStart(3, '0');
      if (barRef.current) barRef.current.style.transform = `scaleX(${xp.loader.shown})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---- run the director (and re-run on replay) ----------------------------------------------------
  useEffect(() => {
    const reduced = ui.get().reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!webgl) {
      ui.set({ phase: 'journey', introDone: true });
      return;
    }
    resetIntroState();
    const ctl = createLoaderControl();
    ctlRef.current = ctl;
    runLoader(ctl, { reduced });
    return () => {
      cancelLoader(ctl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayToken, webgl]);

  // ---- skip --------------------------------------------------------------------------------------------
  const skipToken = useUi((s) => s.skipToken);
  useEffect(() => {
    if (skipToken > 0 && ctlRef.current) skipLoader(ctlRef.current);
  }, [skipToken]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ui.get().phase === 'loading') ui.set({ skipToken: ui.get().skipToken + 1 });
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const hidden = phase !== 'loading';

  return (
    <div
      className="loader"
      data-hidden={hidden}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <div className="loader__top">
        <span className="loader__mark">RP</span>
        <span className="loader__tag">A short film in scroll</span>
      </div>

      <div className="loader__bottom">
        <div className="loader__meter">
          <span className="loader__label">Loading assets</span>
          <div className="loader__count" aria-hidden="true">
            <span ref={pctRef}>000</span>
            <i>%</i>
          </div>
          <div className="loader__bar" aria-hidden="true">
            <div ref={barRef} className="loader__barfill" />
          </div>
        </div>
        <p className="loader__status">{status}…</p>
        <button
          type="button"
          className="loader__skip"
          onClick={() => {
            ui.set({ skipToken: ui.get().skipToken + 1 });
            scrollToY(0, true);
          }}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
