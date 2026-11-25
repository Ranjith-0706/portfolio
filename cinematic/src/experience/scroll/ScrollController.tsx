'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { registerGsap } from '@/utils/gsap';
import { KEYFRAMES, SECTION_IDS, type Pose, type SectionId } from '@/config/timeline.config';
import { lerpDeep, smoothstep, clamp } from '@/utils/math';
import { ui, xp } from '../store';
import { setLenis } from './scrollApi';

/**
 * ScrollController
 *  - Smooth scrolling with Lenis (disabled for reduced motion → native scroll).
 *  - Lenis ⇄ GSAP ScrollTrigger sync (single ticker, lagSmoothing off).
 *  - Converts the scroll position into a normalised cinematic pose using KEYFRAMES.
 *  - Locks scrolling only while the intro plays (loader → hero landing).
 *
 * It renders nothing; it only writes to the mutable `xp` store.
 */
export function ScrollController() {
  useEffect(() => {
    const { gsap, ScrollTrigger } = registerGsap();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    ui.set({ reducedMotion: reduced });
    // Dev only: lets the console / automated tests inspect the live experience state.
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __xp: typeof xp }).__xp = xp;

    let lenis: Lenis | null = null;
    if (!reduced) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.2 });
      setLenis(lenis);
      lenis.on('scroll', ScrollTrigger.update);
    }
    gsap.ticker.lagSmoothing(0);

    // ---- layout cache -------------------------------------------------------------------
    let tops: number[] = [];
    let keyY: number[] = [];
    const sectionEls = () =>
      SECTION_IDS.map((id) => document.querySelector<HTMLElement>(`[data-section="${id}"]`));

    const measure = () => {
      const vh = innerHeight;
      xp.viewport.w = innerWidth;
      xp.viewport.h = vh;
      xp.viewport.aspect = innerWidth / vh;
      xp.viewport.mobile = innerWidth < 760;
      const els = sectionEls();
      tops = els.map((el) => (el ? el.getBoundingClientRect().top + window.scrollY : 0));
      keyY = KEYFRAMES.map((kf) => {
        const i = SECTION_IDS.indexOf(kf.at.section as SectionId);
        return (tops[i] ?? 0) + kf.at.vh * vh;
      });
      xp.scroll.limit = Math.max(1, document.documentElement.scrollHeight - vh);
      // Keyframes past the end of the page could never be reached: pull them back inside the
      // scrollable range (keeping order) so the final pose is always achievable.
      for (let i = keyY.length - 1; i >= 0; i--) keyY[i] = Math.min(keyY[i], xp.scroll.limit - (keyY.length - 1 - i));
      for (let i = 1; i < keyY.length; i++) keyY[i] = Math.max(keyY[i], keyY[i - 1] + 1);
    };

    const samplePose = (y: number): Pose => {
      if (y <= keyY[0]) return KEYFRAMES[0].pose;
      const last = KEYFRAMES.length - 1;
      if (y >= keyY[last]) return KEYFRAMES[last].pose;
      let i = 0;
      while (i < last && keyY[i + 1] < y) i++;
      const t = smoothstep((y - keyY[i]) / (keyY[i + 1] - keyY[i]));
      return lerpDeep(KEYFRAMES[i].pose, KEYFRAMES[i + 1].pose, t);
    };

    // ---- per-frame ----------------------------------------------------------------------
    let lastY = window.scrollY;
    let smoothV = 0;
    const tick = (time: number, deltaMs: number) => {
      lenis?.raf(time * 1000);
      const dt = Math.max(0.001, deltaMs / 1000);
      const y = lenis ? lenis.scroll : window.scrollY;
      const v = (y - lastY) / dt;
      lastY = y;
      smoothV += (v - smoothV) * Math.min(1, dt * 8);
      const s = xp.scroll;
      s.y = y;
      s.velocity = smoothV;
      s.progress = clamp(y / s.limit);
      xp.pose = samplePose(y);

      // continuous section index (for env/nav)
      let idx = 0;
      for (let i = 0; i < tops.length; i++) if (y + innerHeight * 0.001 >= tops[i]) idx = i;
      const nextTop = tops[idx + 1] ?? tops[idx] + innerHeight;
      s.section = idx + clamp((y - tops[idx]) / Math.max(1, nextTop - tops[idx]));
      // active = last section whose top has crossed 45% of the viewport
      let activeIdx = 0;
      for (let i = 0; i < tops.length; i++) if (y + innerHeight * 0.45 >= tops[i]) activeIdx = i;
      if (ui.get().activeIndex !== activeIdx) ui.set({ activeIndex: activeIdx });
    };
    gsap.ticker.add(tick);

    // ---- lock while the intro plays -----------------------------------------------------
    const applyLock = () => {
      const { phase, introDone } = ui.get();
      const locked = phase !== 'journey' && !introDone;
      if (locked) {
        lenis?.stop();
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
        lenis?.start();
      }
    };
    applyLock();
    const unsub = ui.subscribe(applyLock);

    measure();
    const onResize = () => {
      measure();
      ScrollTrigger.refresh();
    };
    addEventListener('resize', onResize);
    // content (fonts/images) can change heights after first paint
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    document.fonts?.ready.then(() => {
      measure();
      ScrollTrigger.refresh();
    });

    return () => {
      gsap.ticker.remove(tick);
      unsub();
      removeEventListener('resize', onResize);
      ro.disconnect();
      lenis?.destroy();
      setLenis(null);
      document.documentElement.style.overflow = '';
    };
  }, []);

  return null;
}
