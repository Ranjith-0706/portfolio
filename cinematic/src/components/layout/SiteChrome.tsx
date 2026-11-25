'use client';
import { useEffect, useRef } from 'react';
import { SECTION_IDS, SECTION_META } from '@/config/timeline.config';
import { ui, useUi, xp } from '@/experience/store';
import { scrollToSection, scrollToY } from '@/experience/scroll/scrollApi';
import { replayIntro } from '@/experience/replay';
import { setAmbient } from '@/utils/audio';

/**
 * Minimal navigation layer: wordmark, replay + sound controls, scroll progress, and a vertical
 * section index with an active indicator. Progress is written straight to the DOM (no re-renders).
 */
export function SiteChrome() {
  const active = useUi((s) => s.activeIndex);
  const sound = useUi((s) => s.sound);
  const progress = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (progress.current) progress.current.style.transform = `scaleX(${xp.scroll.progress})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="site-chrome">
      <div className="progress" aria-hidden="true">
        <i ref={progress as React.RefObject<HTMLElement & HTMLDivElement>} />
      </div>

      <button type="button" className="brand" onClick={() => scrollToY(0)} aria-label="Back to top" data-cursor="Top">
        RP<span>.</span>
      </button>

      <div className="tools">
        <button type="button" className="tool tool--hide-sm" onClick={replayIntro} data-cursor="Replay">
          Replay intro
        </button>
        <button
          type="button"
          className="tool"
          aria-pressed={sound}
          onClick={() => {
            const next = !ui.get().sound;
            ui.set({ sound: next });
            void setAmbient(next);
          }}
        >
          Sound {sound ? 'on' : 'off'}
        </button>
      </div>

      <nav className="sidenav" aria-label="Sections">
        {SECTION_IDS.map((id, i) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === i ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(id);
            }}
          >
            <span>
              {SECTION_META[id].index} · {SECTION_META[id].label}
            </span>
            <i />
          </a>
        ))}
      </nav>
    </div>
  );
}
