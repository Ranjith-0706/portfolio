import type Lenis from 'lenis';
import type { SectionId } from '@/config/timeline.config';

/** Tiny module-level handle so UI (nav, CTAs, replay) can drive scrolling without prop drilling. */
let lenis: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  lenis = l;
}

export function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 1.6, lock: false });
  else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
}

export function scrollToSection(id: SectionId, immediate = false) {
  const el = document.querySelector<HTMLElement>(`[data-section="${id}"]`);
  if (!el) return;
  scrollToY(el.getBoundingClientRect().top + window.scrollY, immediate);
}
