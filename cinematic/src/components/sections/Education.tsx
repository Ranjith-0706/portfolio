'use client';
import { portfolio } from '@/data/portfolio';
import { useScrollContext } from '@/hooks/useScrollContext';
import { Words } from '@/components/ui/Words';

/** Section 06 — character on the LEFT; a refined editorial ledger of milestones + achievements. */
export function Education() {
  const { education } = portfolio;
  const ref = useScrollContext<HTMLElement>(({ gsap, root }) => {
    gsap.from(root.querySelectorAll('.edu__title .mi'), {
      yPercent: 115, duration: 1.2, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: root.querySelector('.edu__title'), start: 'top 85%', toggleActions: 'play none none reverse' },
    });
    root.querySelectorAll<HTMLElement>('.edu__ms').forEach((ms) => {
      const t = { trigger: ms, start: 'top 80%', toggleActions: 'play none none reverse' };
      gsap.from(ms, { borderTopColor: 'transparent', duration: 1, scrollTrigger: t });
      gsap.from(ms.querySelector('.edu__year'), { clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'expo.out', scrollTrigger: t });
      gsap.from(ms.querySelectorAll('h3, p, .edu__place'), { opacity: 0, y: 22, duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: t });
    });
    gsap.from(root.querySelectorAll('.ach li'), {
      opacity: 0, x: 40, duration: 1, stagger: 0.14, ease: 'power3.out',
      scrollTrigger: { trigger: root.querySelector('.ach'), start: 'top 78%', toggleActions: 'play none none reverse' },
    });
  });

  return (
    <section ref={ref} id="education" data-section="education" className="section education" aria-labelledby="edu-title">
      <div className="section__inner" style={{ width: '100%' }}>
        <div className="edu__body">
          <span className="eyebrow">06 — {education.kicker}</span>
          <h2 id="edu-title" className="edu__title display">
            <Words text={education.headline} />
          </h2>
          {education.milestones.map((m) => (
            <article key={m.title} className="edu__ms">
              <div className="edu__year display outline">{m.year}</div>
              <div>
                <h3>{m.title}</h3>
                <span className="edu__place">{m.place}</span>
                <p>{m.note}</p>
              </div>
            </article>
          ))}
          <div className="ach">
            <h3>Achievements</h3>
            <ol>
              {education.achievements.map((a) => (
                <li key={a.title}>
                  <b>{a.title}</b>
                  <span>{a.note}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
