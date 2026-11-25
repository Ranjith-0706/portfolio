'use client';
import { useEffect, useRef, useState } from 'react';
import { SECTION_IDS } from '@/config/timeline.config';
import { ui, useUi, xp } from '@/experience/store';
import { QUALITY_PRESETS, type QualityTier } from '@/config/scene.config';

/**
 * Development-only debug panel (never rendered in production builds — it is only imported behind
 * a `process.env.NODE_ENV !== 'production'` guard in ExperienceRoot, so it is tree-shaken out).
 * Toggle with the backtick key. Readouts update ~8×/s straight to the DOM (no React renders).
 */
export default function DebugPanel() {
  const [open, setOpen] = useState(true);
  const out = useRef<HTMLPreElement>(null);
  const quality = useUi((s) => s.quality);

  useEffect(() => {
    const id = setInterval(() => {
      if (!out.current) return;
      const c = xp.character;
      const cam = xp.camera;
      const f = (n: number) => n.toFixed(2);
      out.current.textContent = [
        `section   ${SECTION_IDS[ui.get().activeIndex]}  (${f(xp.scroll.section)})`,
        `scroll    ${(xp.scroll.progress * 100).toFixed(1)}%  v=${Math.round(xp.scroll.velocity)}px/s`,
        `phase     ${ui.get().phase}`,
        `char pos  ${f(c.x)}, ${f(c.y)}, ${f(c.z)}`,
        `char rotY ${f(c.yaw)} rad`,
        `state     ${c.state} → ${c.effective}  [${c.mode}]`,
        `clips     ${c.clips.length ? c.clips.join(', ') : '— none (static mesh)'}`,
        `camera    ${f(cam.x)}, ${f(cam.y)}, ${f(cam.z)}  → ${f(cam.tx)}, ${f(cam.ty)}`,
        `triangles ${c.triangles.toLocaleString()}`,
        `fps       ${xp.perf.fps}`,
        `quality   ${ui.get().quality}`,
      ].join('\n');
    }, 120);
    const key = (e: KeyboardEvent) => e.key === '`' && setOpen((o) => !o);
    addEventListener('keydown', key);
    return () => {
      clearInterval(id);
      removeEventListener('keydown', key);
    };
  }, []);

  const slider = (label: string, key: keyof typeof xp.debug, min: number, max: number, step: number) => (
    <label className="dbg-row">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        defaultValue={xp.debug[key] as number}
        onInput={(e) => ((xp.debug[key] as number) = Number((e.target as HTMLInputElement).value))}
      />
    </label>
  );

  return (
    <aside className="dbg" data-open={open}>
      <button type="button" className="dbg__toggle" onClick={() => setOpen((o) => !o)}>
        debug {open ? '–' : '+'}
      </button>
      {open && (
        <>
          <pre ref={out} />
          {slider('char scale', 'scale', 0.4, 2, 0.01)}
          {slider('char x', 'dx', -2, 2, 0.01)}
          {slider('char y', 'dy', -1, 2, 0.01)}
          {slider('cam z', 'camZ', -3, 6, 0.01)}
          {slider('cam y', 'camY', -2, 3, 0.01)}
          {slider('key light', 'key', 0, 3, 0.01)}
          <label className="dbg-row">
            <span>quality</span>
            <select value={quality} onChange={(e) => ui.set({ quality: e.target.value as QualityTier })}>
              {Object.keys(QUALITY_PRESETS).map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
          </label>
          <label className="dbg-row">
            <span>freeze x</span>
            <input type="checkbox" onChange={(e) => (xp.debug.freeze = e.target.checked)} />
          </label>
        </>
      )}
      <style>{`
        .dbg{position:fixed;left:10px;bottom:10px;z-index:200;width:min(340px,92vw);padding:8px 10px;background:rgba(0,0,0,.82);border:1px solid #333;font:11px/1.45 ui-monospace,monospace;color:#cfc8bb;pointer-events:auto}
        .dbg pre{margin:6px 0;white-space:pre-wrap;color:#D7AC74}
        .dbg__toggle{font:inherit;color:#D7AC74;padding:0}
        .dbg-row{display:flex;align-items:center;gap:8px}.dbg-row span{width:74px}.dbg-row input[type=range]{flex:1}
        .dbg-row select{background:#111;color:#cfc8bb;border:1px solid #333}
      `}</style>
    </aside>
  );
}
