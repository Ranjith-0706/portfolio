'use client';
import { portfolio } from '@/data/portfolio';
import { useScrollContext } from '@/hooks/useScrollContext';
import { Words } from '@/components/ui/Words';
import { ProjectPreview } from '@/components/ui/ProjectPreview';

/**
 * Section 05 — character on the RIGHT. Four full-bleed showcases (not a card grid): oversized
 * numerals drift with scroll, the preview opens with a clip-path wipe while its content settles
 * from a slight zoom.
 */
export function Projects() {
  const { projects } = portfolio;
  const ref = useScrollContext<HTMLElement>(({ gsap, root }) => {
    gsap.from(root.querySelectorAll('.projects__title .mi'), {
      yPercent: 115, duration: 1.2, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: root.querySelector('.projects__title'), start: 'top 85%', toggleActions: 'play none none reverse' },
    });
    root.querySelectorAll<HTMLElement>('.proj').forEach((p) => {
      const media = p.querySelector('.proj__media');
      const inner = p.querySelector('.proj__media > *');
      const scrub = { trigger: p, start: 'top 80%', end: 'top 25%', scrub: 0.7 };
      gsap.fromTo(media, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', ease: 'none', scrollTrigger: scrub });
      gsap.fromTo(inner, { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: scrub });
      gsap.fromTo(p.querySelector('.proj__num'), { yPercent: -18 }, {
        yPercent: 22, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      const t = { trigger: p, start: 'top 55%', toggleActions: 'play none none reverse' };
      gsap.from(p.querySelectorAll('.proj__title .mi'), { yPercent: 115, duration: 1.1, stagger: 0.05, ease: 'expo.out', scrollTrigger: t });
      gsap.from(p.querySelectorAll('.proj__year, .proj__blurb, .proj__stack'), { opacity: 0, y: 26, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: t });
    });
  });

  return (
    <section ref={ref} id="projects" data-section="projects" className="section projects" aria-labelledby="projects-title">
      <div className="projects__head">
        <span className="eyebrow">05 — {projects.kicker}</span>
        <h2 id="projects-title" className="projects__title display">
          <Words text={projects.headline} />
        </h2>
      </div>

      {projects.items.map((p) => (
        <article key={p.n} className="proj" aria-label={p.title}>
          <div className="proj__num display outline" aria-hidden="true">
            {p.n}
          </div>
          <div className="proj__grid">
            <div className="proj__media" data-cursor="View" data-label="Placeholder preview">
              <ProjectPreview kind={p.kind} />
            </div>
            <div className="proj__meta">
              <div className="proj__year">
                {p.year} · {p.role}
              </div>
              <h3 className="proj__title serif">
                <Words text={p.title} />
              </h3>
              <p className="proj__blurb">{p.blurb}</p>
              <ul className="proj__stack">
                {p.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
