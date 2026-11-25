'use client';
import { portfolio } from '@/data/portfolio';
import { useScrollContext } from '@/hooks/useScrollContext';
import { Words } from '@/components/ui/Words';

/** Section 04 — character on the LEFT; a career line that draws as you scroll, chapters on the right. */
export function ExperienceSection() {
  const { experience } = portfolio;
  const ref = useScrollContext<HTMLElement>(({ gsap, root }) => {
    gsap.from(root.querySelectorAll('.exp__title .mi'), {
      yPercent: 115, duration: 1.2, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: root.querySelector('.exp__title'), start: 'top 85%', toggleActions: 'play none none reverse' },
    });
    // the career line draws with scroll position (fully reversible)
    gsap.to(root.querySelector('.exp__line i'), {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: root.querySelector('.exp__body'), start: 'top 60%', end: 'bottom 75%', scrub: 0.4 },
    });
    root.querySelectorAll<HTMLElement>('.exp__item').forEach((item) => {
      const toggle = { trigger: item, start: 'top 72%', toggleActions: 'play none none reverse' };
      gsap.from(item.querySelector('.exp__period'), { clipPath: 'inset(0 100% 0 0)', duration: 1.3, ease: 'expo.out', scrollTrigger: toggle });
      gsap.from(item.querySelectorAll('.exp__role .mi, .exp__co'), { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: toggle });
      gsap.from(item.querySelector('.exp__sum'), { opacity: 0, y: 24, duration: 1, ease: 'power3.out', scrollTrigger: { ...toggle, start: 'top 62%' } });
      gsap.from(item.querySelectorAll('.exp__list li'), { opacity: 0, x: 30, duration: 0.9, stagger: 0.12, ease: 'power3.out', scrollTrigger: { ...toggle, start: 'top 55%' } });
    });
  });

  return (
    <section ref={ref} id="experience" data-section="experience" className="section experience" aria-labelledby="exp-title">
      <div className="section__inner" style={{ width: '100%' }}>
        <div className="exp__body">
          <div className="exp__line" aria-hidden="true">
            <i />
          </div>
          <span className="eyebrow">04 — {experience.kicker}</span>
          <h2 id="exp-title" className="exp__title display">
            <Words text={experience.headline} />
          </h2>
          {experience.items.map((it) => (
            <article key={it.period} className="exp__item">
              <div className="exp__period display outline">{it.period}</div>
              <h3 className="exp__role serif">
                <Words text={it.role} />
              </h3>
              <div className="exp__co">{it.company}</div>
              <p className="exp__sum">{it.summary}</p>
              <ul className="exp__list">
                {it.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
