'use client';
import { portfolio } from '@/data/portfolio';
import { useScrollContext } from '@/hooks/useScrollContext';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { replayIntro } from '@/experience/replay';
import { scrollToY } from '@/experience/scroll/scrollApi';

/**
 * Section 07 — the character returns to the centre. A miniature laptop sits beside him
 * (prop rendered in the canvas). Future hooks: Sit → LaptopOpen → Typing → Wave goodbye can be
 * requested through `characterApi.force(...)` once a rigged model provides those clips.
 *
 * The stage is `position: sticky`, so the whole closing composition holds still while the
 * character walks back to the centre; the extra section height is just scroll runway.
 */
export function Contact() {
  const { contact } = portfolio;
  const ref = useScrollContext<HTMLElement>(({ gsap, root }) => {
    gsap.from(root.querySelectorAll('.contact__title .mi'), {
      yPercent: 118, duration: 1.4, stagger: 0.14, ease: 'expo.out',
      scrollTrigger: { trigger: root, start: 'top 60%', toggleActions: 'play none none reverse' },
    });
    gsap.from(root.querySelectorAll('.contact__links > *, .contact__foot'), {
      opacity: 0, y: 24, duration: 1, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: root, start: 'top 45%', toggleActions: 'play none none reverse' },
    });
  });

  return (
    <section ref={ref} id="contact" data-section="contact" className="section contact" aria-labelledby="contact-title">
      <div className="contact__stage">
        <span className="eyebrow">07 — {contact.kicker}</span>
        <h2 id="contact-title" className="contact__title display" aria-label={contact.headline}>
          <span className="mw" aria-hidden="true"><span className="mi">Let&rsquo;s build</span></span>
          <br />
          <span className="mw" aria-hidden="true"><span className="mi">something</span></span>
          <span className="mw serif" aria-hidden="true" style={{ display: 'block' }}><span className="mi">extraordinary.</span></span>
        </h2>

        <div className="contact__links">
          <MagneticButton className="contact__mail" href={`mailto:${contact.email}`} cursor="Mail">
            {contact.email}
          </MagneticButton>
          {contact.socials.map((s) => (
            <MagneticButton key={s.label} className="btn" href={s.href} target="_blank" rel="noreferrer" cursor="Open">
              {s.label} ↗
            </MagneticButton>
          ))}
          <MagneticButton className="btn btn--solid" onClick={replayIntro} cursor="Replay">
            Replay intro
          </MagneticButton>
        </div>

        <div className="contact__foot">
          <span>© Placeholder · RANJITH P</span>
          <button type="button" onClick={() => scrollToY(0)} className="mono" data-cursor="Top">
            Back to top ↑
          </button>
        </div>
      </div>
    </section>
  );
}
