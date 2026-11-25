'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ui, useUi } from '@/experience/store';
import { detectQuality } from '@/experience/performance/PerformanceManager';
import { ScrollController } from '@/experience/scroll/ScrollController';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { Cursor } from '@/components/layout/Cursor';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Skills } from '@/components/sections/Skills';
import { ExperienceSection } from '@/components/sections/ExperienceSection';
import { Projects } from '@/components/sections/Projects';
import { Education } from '@/components/sections/Education';
import { Contact } from '@/components/sections/Contact';

// three/drei are client-only: keep them out of the server render entirely.
const PersistentCanvas = dynamic(() => import('@/experience/canvas/PersistentCanvas'), { ssr: false });
const LoaderOverlay = dynamic(() => import('@/experience/loader/LoaderOverlay').then((m) => m.LoaderOverlay), { ssr: false });
// Dev-only: the guard is a compile-time constant, so this import is removed from production bundles.
const DebugPanel =
  process.env.NODE_ENV !== 'production' ? dynamic(() => import('@/components/ui/DebugPanel'), { ssr: false }) : null;

/**
 * ExperienceRoot — composes the ONE persistent canvas, the loader, the scroll engine and the
 * (always server-rendered, always readable) portfolio content.
 */
export function ExperienceRoot() {
  const webgl = useUi((s) => s.webgl);
  const quality = useUi((s) => s.quality);
  const introDone = useUi((s) => s.introDone);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const { tier, webgl: ok } = detectQuality();
    ui.set({ quality: tier, webgl: ok });
    if (!ok) ui.set({ phase: 'journey', introDone: true });
    setMounted(true);
  }, []);

  // Content reveal is driven by one attribute on <html> (also used by the no-JS safety net).
  useEffect(() => {
    document.documentElement.dataset.intro = introDone ? 'done' : 'pending';
  }, [introDone]);

  return (
    <>
      <a className="skip-link" href="#about" onClick={() => ui.set({ skipToken: ui.get().skipToken + 1 })}>
        Skip to content
      </a>

      <ScrollController />
      {mounted && webgl && <PersistentCanvas />}
      {mounted && webgl && quality !== 'high' && <div className="vignette" aria-hidden="true" />}
      {mounted && webgl && <LoaderOverlay />}

      <SiteChrome />
      <Cursor />
      <div className="grain" aria-hidden="true" />

      <main id="main">
        <Hero />
        <div className="rest">
          <About />
          <Skills />
          <ExperienceSection />
          <Projects />
          <Education />
          <Contact />
        </div>
      </main>

      {DebugPanel && <DebugPanel />}
    </>
  );
}
