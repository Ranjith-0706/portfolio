'use client';
import { portfolio } from '@/data/portfolio';
import { useScrollContext } from '@/hooks/useScrollContext';
import { Words } from '@/components/ui/Words';

/** Section 02 — the character settles on the LEFT; editorial content sits on the right. */
export function About() {
  const { about } = portfolio;
  const ref = useScrollContext<HTMLElement>(({ gsap, root }) => {
    const st = (trigger: Element | null, start = 'top 82%') => ({ trigger, start, toggleActions: 'play none none reverse' });
    gsap.from(root.querySelectorAll('.about__title .mi'), {
      yPercent: 115, duration: 1.25, stagger: 0.055, ease: 'expo.out', scrollTrigger: st(root.querySelector('.about__title')),
    });
    gsap.from(root.querySelectorAll('.about__p'), {
      opacity: 0, y: 36, duration: 1.1, stagger: 0.14, ease: 'power3.out', scrollTrigger: st(root.querySelector('.about__p'), 'top 88%'),
    });
    gsap.from(root.querySelectorAll('.facts > div'), {
      clipPath: 'inset(0 100% 0 0)', duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: st(root.querySelector('.facts'), 'top 90%'),
    });
    gsap.from(root.querySelector('.eyebrow'), { opacity: 0, x: -20, duration: 0.9, scrollTrigger: st(root.querySelector('.eyebrow'), 'top 90%') });
  });

  return (
    <section ref={ref} id="about" data-section="about" className="section about" aria-labelledby="about-title">
      <div className="section__inner" style={{ width: '100%' }}>
        <div className="about__body">
          <span className="eyebrow">02 — {about.kicker}</span>
          <h2 id="about-title" className="about__title serif">
            <Words text={about.headline} accentFrom={6} accentClass="" />
          </h2>
          {about.paragraphs.map((p) => (
            <p key={p} className="about__p">
              {p}
            </p>
          ))}
          <dl className="facts">
            {about.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
