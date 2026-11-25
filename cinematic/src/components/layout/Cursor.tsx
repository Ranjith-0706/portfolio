'use client';
import { useEffect, useRef } from 'react';

/**
 * Restrained custom cursor: a small dot + a lagging ring that grows over elements marked with
 * `data-cursor` (optionally labelled, e.g. "View"). Fine pointers only; never on touch.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = root.current;
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0;
    const dot = el.querySelector<HTMLElement>('.cursor__dot')!;
    const ring = el.querySelector<HTMLElement>('.cursor__ring')!;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.classList.add('on');
      document.body.classList.add('has-cursor');
      dot.style.transform = `translate(${x}px,${y}px)`;
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor],a,button');
      el.classList.toggle('hover', !!t);
      if (label.current) label.current.textContent = t?.dataset.cursor ?? '';
    };
    const loop = () => {
      rx += (x - rx) * (reduced ? 1 : 0.16);
      ry += (y - ry) * (reduced ? 1 : 0.16);
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    const leave = () => el.classList.remove('on');
    addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    raf = requestAnimationFrame(loop);
    return () => {
      removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
      document.body.classList.remove('has-cursor');
    };
  }, []);

  return (
    <div className="cursor" ref={root} aria-hidden="true">
      <div className="cursor__ring">
        <span className="cursor__label" ref={label} />
      </div>
      <div className="cursor__dot" />
    </div>
  );
}
