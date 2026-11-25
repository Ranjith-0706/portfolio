'use client';
import { portfolio } from '@/data/portfolio';
import { useScrollContext } from '@/hooks/useScrollContext';
import { Words } from '@/components/ui/Words';

/**
 * Section 03 — content on the LEFT, character (and a miniature developer workstation, rendered in
 * the canvas) on the RIGHT. Skills are spatial typography: large staggered words whose underline
 * length encodes visual weight only (not a proficiency claim).
 */
export function Skills() {
  const { skills } = portfolio;
  const ref = useScrollContext<HTMLElement>(({ gsap, root }) => {
    gsap.from(root.querySelectorAll('.skills__title .mi'), {
      yPercent: 115, duration: 1.2, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: root.querySelector('.skills__title'), start: 'top 85%', toggleActions: 'play none none reverse' },
    });
    root.querySelectorAll<HTMLElement>('.skill').forEach((row) => {
      const depth = parseFloat(row.style.getPropertyValue('--depth')) || 0.5;
      const scrub = { trigger: row, start: 'top 94%', end: 'top 64%', scrub: 0.6 };
      gsap.from(row.querySelector('.skill__name'), { xPercent: -14, opacity: 0, ease: 'none', scrollTrigger: scrub });
      gsap.from(row.querySelector('.skill__n'), { opacity: 0, ease: 'none', scrollTrigger: scrub });
      gsap.fromTo(row.querySelector('.skill__bar i'), { scaleX: 0 }, { scaleX: depth, ease: 'none', scrollTrigger: scrub });
    });
  });

  return (
    <section ref={ref} id="skills" data-section="skills" className="section skills" aria-labelledby="skills-title">
      <div className="section__inner" style={{ width: '100%' }}>
        <div className="skills__body">
          <span className="eyebrow">03 — {skills.kicker}</span>
          <h2 id="skills-title" className="skills__title display">
            <Words text={skills.headline} />
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {skills.list.map((s, i) => (
              <li key={s.name} className="skill" style={{ ['--depth' as string]: s.depth }} tabIndex={0}>
                <span className="skill__n">{String(i + 1).padStart(2, '0')}</span>
                <span className="skill__row">
                  <span className="skill__name display">{s.name}</span>
                  <span className="skill__note">
                    {s.group} — {s.note}
                  </span>
                </span>
                <span className="skill__bar" aria-hidden="true">
                  <i />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
