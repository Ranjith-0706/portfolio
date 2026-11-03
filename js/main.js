(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const hasTHREE = typeof THREE !== 'undefined';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;

  const loader = $('#loader');
  const finishLoader = () => { if (loader) loader.style.display = 'none'; document.body.classList.remove('loading'); };

  // If the animation libraries failed to load, show a usable static page.
  if (!hasGSAP) { finishLoader(); return; }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('loading');

  /* ------------------------------------------------------------------
   * Split hero text into characters
   * ---------------------------------------------------------------- */
  $$('[data-split]').forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map(w =>
      `<span class="word" aria-hidden="true">${[...w].map(c => `<span class="char">${c}</span>`).join('')}</span>`
    ).join(' ');
  });

  /* ------------------------------------------------------------------
   * Typed role text
   * ---------------------------------------------------------------- */
  const phrases = ['FastAPI & Python backends', 'React / Next.js interfaces', 'AI-assisted full-stack delivery', 'Docker & CI/CD pipelines'];
  const typedEl = $('#typed');
  (function typer() {
    if (!typedEl) return;
    if (reduce) { typedEl.textContent = phrases[0]; return; }
    let p = 0, i = 0, del = false;
    const tick = () => {
      const word = phrases[p];
      typedEl.textContent = word.slice(0, i);
      if (!del && i === word.length) { del = true; return setTimeout(tick, 1600); }
      if (del && i === 0) { del = false; p = (p + 1) % phrases.length; }
      i += del ? -1 : 1;
      setTimeout(tick, del ? 28 : 65);
    };
    tick();
  })();

  /* ------------------------------------------------------------------
   * Custom cursor + magnetic buttons + 3D tilt cards
   * ---------------------------------------------------------------- */
  if (finePointer) {
    const dot = $('#cursor-dot'), ring = $('#cursor-ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      document.body.classList.add('has-cursor');
      dot.style.transform = `translate(${mx}px,${my}px)`;
    }, { passive: true });
    gsap.ticker.add(() => {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
    });
    document.addEventListener('mouseover', e => {
      ring.classList.toggle('hover', !!e.target.closest('a,button,[data-cursor],.tilt'));
    });

    // Magnetic
    $$('.magnetic').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });

    // Tilt
    $$('.tilt').forEach(el => {
      const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power2.out' });
      const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power2.out' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rotY((px - 0.5) * 12);
        rotX((0.5 - py) * 12);
        el.style.setProperty('--mx', px * 100 + '%');
        el.style.setProperty('--my', py * 100 + '%');
      });
      el.addEventListener('mouseleave', () => { rotX(0); rotY(0); });
    });
  }

  /* ------------------------------------------------------------------
   * Three.js background scene
   * ---------------------------------------------------------------- */
  const scene3d = { scroll: 0, mx: 0, my: 0 };
  if (hasTHREE && !reduce) {
    const canvas = $('#bg');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(innerWidth, innerHeight);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f1216, 0.055);
    const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 8;

    const narrowInit = () => innerWidth < 720;
    const colA = new THREE.Color(0x8296ab), colB = new THREE.Color(0xff6b47), colC = new THREE.Color(0xff9170);

    const hero = new THREE.Group();
    scene.add(hero);

    // AI "neural orb": nodes on a sphere joined by nearby-neighbour links
    const sphereNodes = (n, r, jitter) => {
      const out = [], ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2, rr = Math.sqrt(1 - y * y), th = ga * i;
        const k = r * (1 + (Math.random() - 0.5) * jitter);
        out.push(new THREE.Vector3(Math.cos(th) * rr * k, y * k, Math.sin(th) * rr * k));
      }
      return out;
    };
    const nodesOuter = sphereNodes(narrowInit() ? 90 : 150, 2.1, 0.18);
    const linkPts = [];
    for (let i = 0; i < nodesOuter.length; i++)
      for (let j = i + 1; j < nodesOuter.length; j++)
        if (nodesOuter[i].distanceTo(nodesOuter[j]) < (narrowInit() ? 1.2 : 0.95))
          linkPts.push(nodesOuter[i], nodesOuter[j]);
    const knotMat = new THREE.LineBasicMaterial({ color: colA, transparent: true, opacity: 0.5 });
    const knot = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(linkPts), knotMat);
    const nodeMat = new THREE.PointsMaterial({ color: colB, size: 0.09, transparent: true, opacity: 0.95, sizeAttenuation: true });
    knot.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(nodesOuter), nodeMat));
    hero.add(knot);

    const coreMat = new THREE.PointsMaterial({ color: colC, size: 0.07, transparent: true, opacity: 0.8, sizeAttenuation: true });
    const core = new THREE.Points(new THREE.BufferGeometry().setFromPoints(sphereNodes(60, 1.05, 0.25)), coreMat);
    hero.add(core);

    const ringMat = new THREE.MeshBasicMaterial({ color: colC, transparent: true, opacity: 0.4 });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.012, 8, 160), ringMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.01, 8, 160), ringMat);
    ring1.rotation.x = 1.2; ring2.rotation.y = 1.1;
    hero.add(ring1, ring2);

    // Particle field
    const COUNT = innerWidth < 720 ? 700 : 1800;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 36;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 36;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.045, transparent: true, opacity: 0.7, sizeAttenuation: true });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    addEventListener('mousemove', e => {
      scene3d.mx = (e.clientX / innerWidth - 0.5) * 2;
      scene3d.my = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    addEventListener('resize', () => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    });

    const tmp = new THREE.Color();
    let t = 0, introScale = 0;
    gsap.to({ v: 0 }, { v: 1, duration: 2.2, delay: 0.3, ease: 'expo.out', onUpdate() { introScale = this.targets()[0].v; } });

    const render = () => {
      t += 0.008;
      const p = scene3d.scroll;
      const narrow = innerWidth < 900;

      // Hero object wanders across the page as you scroll
      const tx = narrow ? 0 : Math.cos(p * Math.PI * 4) * 2.7;
      const ty = narrow ? 1.6 - p * 3 : Math.sin(p * Math.PI * 3) * 0.7;
      hero.position.x += (tx - hero.position.x) * 0.05;
      hero.position.y += (ty - hero.position.y) * 0.05;
      const s = introScale * (narrow ? 0.62 : 1) * (1 - Math.min(p * 1.4, 0.45));
      hero.scale.setScalar(Math.max(s, 0.001));

      knot.rotation.x = t * 0.6 + p * 8;
      knot.rotation.y = t * 0.9 + p * 6 + scene3d.mx * 0.6;
      core.rotation.x = -t * 1.3; core.rotation.y = -t * 0.8;
      ring1.rotation.z = t * 0.7; ring2.rotation.x = -t * 0.5;
      hero.rotation.x += (scene3d.my * 0.35 - hero.rotation.x) * 0.05;

      // colour shift with scroll: steel -> coral -> soft coral
      const k = (p * 2) % 2;
      if (k < 1) tmp.copy(colA).lerp(colB, k); else tmp.copy(colB).lerp(colC, k - 1);
      knotMat.color.copy(tmp);
      knotMat.opacity = 0.5 - Math.min(p * 3, 0.28);
      coreMat.opacity = 0.8 - Math.min(p * 2, 0.4);

      points.rotation.y = t * 0.12 + p * 1.5;
      points.rotation.x = p * 0.8;
      camera.position.x += (scene3d.mx * 0.7 - camera.position.x) * 0.04;
      camera.position.y += (-scene3d.my * 0.5 - camera.position.y) * 0.04;
      camera.position.z = 8 - p * 1.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    gsap.ticker.add(render);
  } else if ($('#bg')) {
    $('#bg').style.display = 'none';
  }

  /* ------------------------------------------------------------------
   * Scroll progress + nav behaviour
   * ---------------------------------------------------------------- */
  const bar = $('#progress'), nav = $('nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      scene3d.scroll = self.progress;
      bar.style.transform = `scaleX(${self.progress})`;
      const y = self.scroll();
      nav.classList.toggle('hide', y > lastY && y > 200);
      lastY = y;
    }
  });
  $$('.nav-links a').forEach(a => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: s => a.classList.toggle('active', s.isActive)
    });
  });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ------------------------------------------------------------------
   * Intro timeline (after loader)
   * ---------------------------------------------------------------- */
  const intro = () => {
    finishLoader();
    if (reduce) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero-inner .eyebrow', { y: 30, opacity: 0, duration: 1 })
      .from('.hero-title .char', { yPercent: 115, rotate: 8, duration: 1.3, stagger: 0.04 }, '-=0.7')
      .from('.hero-role, .hero-desc', { y: 30, opacity: 0, duration: 1, stagger: 0.12 }, '-=0.9')
      .from('.hero-btns .btn', { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, '-=0.8')
      .from('.hero-meta > *', { y: 20, opacity: 0, duration: 1, stagger: 0.1 }, '-=0.8')
      .from('nav', { y: -60, opacity: 0, duration: 1 }, '-=1.2');
  };

  // Loader counter
  const num = $('#loader-num'), lbar = $('#loader-bar');
  const counter = { v: 0 };
  const startIntro = () => {
    gsap.to(loader, {
      yPercent: -100, duration: 0.9, ease: 'expo.inOut',
      onStart: intro,
      onComplete: () => { loader.style.display = 'none'; ScrollTrigger.refresh(); }
    });
  };
  gsap.to(counter, {
    v: 100, duration: reduce ? 0.1 : 1.6, ease: 'power2.inOut',
    onUpdate: () => { num.textContent = Math.round(counter.v); lbar.style.transform = `scaleX(${counter.v / 100})`; },
    onComplete: startIntro
  });

  if (reduce) { return; }

  /* ------------------------------------------------------------------
   * Scroll animations
   * ---------------------------------------------------------------- */
  // Generic reveal
  gsap.set('.reveal', { opacity: 0, y: 50 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09 })
  });

  // Count-up stats
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)) })
    });
  });

  // Hero parallax out
  gsap.to('.hero-inner', {
    yPercent: -18, opacity: 0.1, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // Marquee: constant drift, speed/skew reacts to scroll velocity
  const track = $('#marquee');
  if (track) {
    const half = () => track.scrollWidth / 2;
    let x = 0, dir = -1, boost = 0;
    ScrollTrigger.create({
      onUpdate: self => { boost = gsap.utils.clamp(-30, 30, self.getVelocity() / 120); if (self.direction !== 0) dir = -self.direction; }
    });
    gsap.ticker.add(() => {
      boost *= 0.92;
      x += dir * (1.1 + Math.abs(boost));
      if (x <= -half()) x += half();
      if (x > 0) x -= half();
      track.style.transform = `translate3d(${x}px,0,0) skewX(${gsap.utils.clamp(-12, 12, boost * -0.4)}deg)`;
    });
  }

  // Timeline progress + cards
  const tl = $('#timeline');
  if (tl) {
    gsap.to('#tl-fill', {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: tl, start: 'top 70%', end: 'bottom 70%', scrub: true }
    });
    $$('.tl-item').forEach(item => {
      gsap.from(item.querySelector('.tl-card'), {
        x: 60, opacity: 0, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: item, start: 'top 82%' }
      });
      gsap.from(item.querySelector('.tl-dot'), {
        scale: 0, duration: 0.7, ease: 'back.out(3)',
        scrollTrigger: { trigger: item, start: 'top 82%' }
      });
    });
  }

  // Section headline lines grow
  $$('.sec-head i').forEach(l => gsap.from(l, {
    scaleX: 0, transformOrigin: '0 50%', duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: l, start: 'top 90%' }
  }));

  // Contact title parallax
  gsap.from('.contact-title', {
    scale: 0.85, ease: 'none',
    scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'top 30%', scrub: true }
  });

  // Horizontal pinned projects (desktop only)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 721px)', () => {
    const trackEl = $('#h-track'), pin = $('.h-pin');
    const dist = () => Math.max(0, trackEl.scrollWidth - innerWidth + 48);
    gsap.to(trackEl, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '#projects', pin, start: 'top top',
        end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1
      }
    });
    $$('.card').forEach(c => gsap.from(c, { opacity: 0.2, scale: 0.92, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '#projects', start: 'top 70%' } }));
  });
  mm.add('(max-width: 720px)', () => {
    $$('.card').forEach(c => gsap.from(c, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 88%' } }));
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
