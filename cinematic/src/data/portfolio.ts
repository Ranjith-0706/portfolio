/**
 * PLACEHOLDER CONTENT — replace with real resume data.
 * Everything below is dummy copy (companies, dates, projects) and is intentionally
 * generic. Nothing here is a real employer, metric or achievement.
 */
export const portfolio = {
  person: {
    name: 'RANJITH P',
    firstName: 'Ranjith',
    designation: 'Software Engineer',
    tagline: 'I build digital experiences that connect ideas with technology.',
    location: 'Tamil Nadu, India',
    email: 'hello@example.com',
    availability: 'Open to select projects',
  },
  cta: { primary: 'Explore My Journey', secondary: 'View Projects' },
  about: {
    kicker: 'About',
    headline: 'Quietly obsessed with how things work — and how they feel.',
    paragraphs: [
      'Placeholder biography. I design and build software end to end: dependable backends, considered interfaces and the thin layer of craft that makes both feel inevitable.',
      'This copy is a stand-in until the real resume is added. It exists to test the editorial layout, line length and rhythm of the page.',
    ],
    facts: [
      { label: 'Focus', value: 'Full-stack engineering' },
      { label: 'Currently', value: 'Placeholder Studio' },
      { label: 'Based in', value: 'Tamil Nadu, India' },
      { label: 'Working in', value: 'Python · TypeScript' },
    ],
  },
  skills: {
    kicker: 'Toolkit',
    headline: 'The instruments I reach for.',
    // `depth` drives only the visual weight of each row — it is NOT a claim of proficiency.
    list: [
      { name: 'Python', group: 'Backend', note: 'Services, scripting, data plumbing', depth: 0.92 },
      { name: 'FastAPI', group: 'Backend', note: 'Typed, documented HTTP APIs', depth: 0.88 },
      { name: 'React', group: 'Frontend', note: 'Component systems and state', depth: 0.86 },
      { name: 'Next.js', group: 'Frontend', note: 'Routing, rendering, performance', depth: 0.82 },
      { name: 'TypeScript', group: 'Frontend', note: 'Contracts you can refactor against', depth: 0.84 },
      { name: 'PostgreSQL', group: 'Backend', note: 'Schema design and query tuning', depth: 0.78 },
      { name: 'Redis', group: 'Backend', note: 'Caching and queues', depth: 0.7 },
      { name: 'Docker', group: 'Delivery', note: 'Reproducible environments', depth: 0.76 },
      { name: 'AWS', group: 'Delivery', note: 'Compute, storage, deploys', depth: 0.64 },
      { name: 'GitHub Actions', group: 'Delivery', note: 'CI that stays out of the way', depth: 0.72 },
    ],
  },
  experience: {
    kicker: 'Experience',
    headline: 'Chapters so far.',
    items: [
      {
        period: '2024 — Now',
        role: 'Software Engineer',
        company: 'Placeholder Labs',
        summary: 'Dummy entry. Owns services and interfaces for an imaginary product, from schema to screen.',
        points: ['Placeholder responsibility one', 'Placeholder responsibility two', 'Placeholder responsibility three'],
      },
      {
        period: '2022 — 2024',
        role: 'Full-Stack Developer',
        company: 'Sample Systems Co.',
        summary: 'Dummy entry. Built internal tools and customer-facing features for a fictional platform.',
        points: ['Placeholder responsibility one', 'Placeholder responsibility two'],
      },
      {
        period: '2021 — 2022',
        role: 'Junior Developer',
        company: 'Example Digital',
        summary: 'Dummy entry. First professional chapter: shipping small things, learning the craft.',
        points: ['Placeholder responsibility one', 'Placeholder responsibility two'],
      },
    ],
  },
  projects: {
    kicker: 'Selected Work',
    headline: 'Featured projects.',
    items: [
      { n: '01', title: 'AI-Powered Analytics Platform', year: '2025', role: 'Placeholder role', stack: ['Python', 'FastAPI', 'PostgreSQL', 'React'], blurb: 'Dummy project. A dashboard that turns raw event streams into readable decisions.', kind: 'analytics' },
      { n: '02', title: 'Modern E-commerce Platform', year: '2024', role: 'Placeholder role', stack: ['Next.js', 'TypeScript', 'Redis', 'Stripe'], blurb: 'Dummy project. A storefront tuned for speed, with a calm checkout.', kind: 'commerce' },
      { n: '03', title: 'Cloud Management System', year: '2024', role: 'Placeholder role', stack: ['AWS', 'Docker', 'GitHub Actions', 'Python'], blurb: 'Dummy project. One console to provision, observe and retire cloud resources.', kind: 'cloud' },
      { n: '04', title: 'Interactive 3D Web Experience', year: '2025', role: 'Placeholder role', stack: ['Three.js', 'React Three Fiber', 'GSAP'], blurb: 'Dummy project. A scroll-driven spatial story rendered in the browser.', kind: 'three' },
    ],
  },
  education: {
    kicker: 'Education & Achievements',
    headline: 'Foundations and milestones.',
    milestones: [
      { year: '2017 — 2021', title: 'B.E. Computer Science', place: 'Placeholder Institute of Technology', note: 'Dummy entry — degree details to be provided.' },
      { year: '2017', title: 'Higher Secondary', place: 'Placeholder Higher Secondary School', note: 'Dummy entry.' },
    ],
    achievements: [
      { title: 'Placeholder Achievement One', note: 'Description of a recognition, hackathon or certification.' },
      { title: 'Placeholder Achievement Two', note: 'Description of a recognition, hackathon or certification.' },
      { title: 'Placeholder Achievement Three', note: 'Description of a recognition, hackathon or certification.' },
    ],
  },
  contact: {
    kicker: 'Contact',
    headline: "Let's build something extraordinary.",
    email: 'hello@example.com',
    socials: [
      { label: 'GitHub', href: 'https://github.com/' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    ],
  },
} as const;

export type Portfolio = typeof portfolio;
