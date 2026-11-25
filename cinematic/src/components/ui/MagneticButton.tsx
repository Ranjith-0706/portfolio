'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';

interface Props {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  strength?: number;
  cursor?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
}

/** A button that leans toward the pointer (desktop, fine pointer only). */
export function MagneticButton({ children, className = 'btn', href, onClick, strength = 0.32, cursor, target, rel, ariaLabel }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [strength]);

  const common = { className, 'data-cursor': cursor ?? '', 'aria-label': ariaLabel };
  return href ? (
    <a ref={ref as React.RefObject<HTMLAnchorElement>} href={href} target={target} rel={rel} onClick={onClick} {...common}>
      {children}
    </a>
  ) : (
    <button ref={ref as React.RefObject<HTMLButtonElement>} type="button" onClick={onClick} {...common}>
      {children}
    </button>
  );
}
