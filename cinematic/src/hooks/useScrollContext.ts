'use client';
import { useLayoutEffect, useRef } from 'react';
import { registerGsap } from '@/utils/gsap';

type Setup = (api: { gsap: typeof import('gsap').gsap; ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger; root: HTMLElement }) => void;

/**
 * Runs `setup` inside a gsap.context scoped to the returned ref, so every tween and
 * ScrollTrigger created by a section is reverted automatically on unmount. Skipped entirely for
 * `prefers-reduced-motion` (content simply stays in its final, visible state).
 */
export function useScrollContext<T extends HTMLElement = HTMLElement>(setup: Setup) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { gsap, ScrollTrigger } = registerGsap();
    const ctx = gsap.context(() => setup({ gsap, ScrollTrigger, root: el }), el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}
