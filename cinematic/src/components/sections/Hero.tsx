'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { portfolio } from '@/data/portfolio';
import { useUi } from '@/experience/store';
import { scrollToSection } from '@/experience/scroll/scrollApi';
import { MagneticButton } from '@/components/ui/MagneticButton';

/**
 * Hero — typography only. The character (rendered in the persistent canvas, above this layer's
 * name) falls in front of the oversized name. The text reveals once the character has landed.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const phase = useUi((s) => s.phase);
  const webgl = useUi((s) => s.webgl);
  const introDone = useUi((s) => s.introDone);
  const revealed = useRef(false);
  const { person, cta } = portfolio;

  // Hidden until the character lands (and hidden again on "Replay intro").
  const initialised = useRef(false);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const intro = phase === 'loading' || phase === 'transition' || phase === 'falling';
    // Hide on first paint (so the reveal has something to animate from) and again on replay.
    if (intro || (!initialised.current && !matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      revealed.current = false;
      gsap.set(el.querySelectorAll('.mi'), { yPercent: 115 });
      gsap.set(el.querySelectorAll('.hero__fade'), { opacity: 0, y: 24 });
    }
    initialised.current = true;
  }, [phase]);

  useEffect(() => {
    if (!root.current || revealed.current) return;
    const ready = phase === 'landing' || phase === 'journey' || introDone;
    if (!ready) return;
    revealed.current = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mi = root.current.querySelectorAll('.mi');
    const fade = root.current.querySelectorAll('.hero__fade');
    if (reduced) {
      gsap.set(mi, { yPercent: 0 });
      gsap.set(fade, { opacity: 1, y: 0 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(root.current.querySelectorAll('.hero__name .mi'), { yPercent: 0, duration: 1.5, stagger: 0.07 }, 0)
      .to(root.current.querySelectorAll('.hero__role .mi'), { yPercent: 0, duration: 1.2 }, 0.45)
      .to(fade, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.8);
    return () => {
      tl.kill();
    };
  }, [phase, introDone]);

  const letters = (word: string) =>
    [...word].map((c, i) => (
      <span key={i} className="mw" aria-hidden="true" style={{ paddingBottom: '0.06em' }}>
        <span className="mi">{c}</span>
      </span>
    ));

  return (
    <section ref={root} id="hero" data-section="hero" className="hero" aria-label="Introduction">
      <h1 className="hero__name display" aria-label={person.name}>
        <span className="w">{letters('RANJITH')}</span>
        <span className="w w--p">{letters('P')}</span>
      </h1>

      <p className="hero__role serif">
        <span className="mw">
          <span className="mi">{person.designation}</span>
        </span>
        <small className="hero__fade">Scroll-driven short film · placeholder content</small>
      </p>

      {!webgl && (
        // Static fallback when WebGL is unavailable: the same character, as a still.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hero__fallback" src="/images/character_fallback.webp" alt="The baby developer protagonist, standing" width={450} height={675} />
      )}

      <div className="hero__foot hero__ui">
        <p className="hero__tag hero__fade">{person.tagline}</p>
        <div className="hero__cta hero__fade">
          <MagneticButton className="btn btn--solid" cursor="Go" onClick={() => scrollToSection('about')}>
            {cta.primary}
            <Arrow />
          </MagneticButton>
          <MagneticButton className="btn" cursor="Go" onClick={() => scrollToSection('projects')}>
            {cta.secondary}
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M2 8h12M9 3l5 5-5 5" />
    </svg>
  );
}
