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

  /* ------------------------------------------------------------------
   * Design Lab demos
   * ---------------------------------------------------------------- */
  const clamp = gsap.utils.clamp;

  // 1 · 3D depth card
  const tiltStage = $('#lab-tilt');
  if (tiltStage && !reduce) {
    const card = $('.lt-card', tiltStage);
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 800 });
    tiltStage.addEventListener('pointermove', e => {
      const r = tiltStage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 36); rx((0.5 - py) * 36);
      card.style.setProperty('--gx', px * 100 + '%'); card.style.setProperty('--gy', py * 100 + '%');
    });
    tiltStage.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  // 2 · magnetic button
  const magStage = $('#lab-mag');
  if (magStage && !reduce) {
    const btn = $('.lm-btn', magStage), label = $('span', btn);
    const bx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    const by = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
    const tx = gsap.quickTo(label, 'x', { duration: 0.5, ease: 'power3.out' });
    const ty = gsap.quickTo(label, 'y', { duration: 0.5, ease: 'power3.out' });
    magStage.addEventListener('pointermove', e => {
      const r = magStage.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      bx(dx * 0.4); by(dy * 0.4); tx(dx * 0.12); ty(dy * 0.12);
    });
    magStage.addEventListener('pointerleave', () => { bx(0); by(0); tx(0); ty(0); });
  }

  // 3 · text scramble
  const scr = $('#lab-scramble');
  if (scr) {
    const words = ['Design × Code', 'Idea → Shipped', 'Pixels → Product', 'Human + AI'];
    const glyphs = '!-_/[]{}—=+*^?#01';
    let w = 0, raf = 0, started = false;
    const next = () => {
      w = (w + 1) % words.length;
      const to = words[w];
      if (reduce) { scr.textContent = to; return; }
      const from = scr.textContent, len = Math.max(from.length, to.length), q = [];
      for (let i = 0; i < len; i++) {
        const start = Math.floor(Math.random() * 14);
        q.push({ from: from[i] || '', to: to[i] || '', start, end: start + 10 + Math.floor(Math.random() * 14), c: '' });
      }
      let f = 0;
      cancelAnimationFrame(raf);
      const step = () => {
        let out = '', done = 0;
        q.forEach(o => {
          if (f >= o.end) { done++; out += o.to; }
          else if (f >= o.start) {
            if (!o.c || Math.random() < 0.28) o.c = glyphs[Math.floor(Math.random() * glyphs.length)];
            out += `<i>${o.c}</i>`;
          } else out += o.from;
        });
        scr.innerHTML = out;
        if (done < q.length) { f++; raf = requestAnimationFrame(step); } else scr.textContent = to;
      };
      step();
    };
    scr.addEventListener('click', next);
    scr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
    if (finePointer) scr.addEventListener('pointerenter', () => { if (started) next(); });
    ScrollTrigger.create({ trigger: scr, start: 'top 85%', once: true, onEnter: () => { next(); started = true; } });
  }

  // 4 · cursor spotlight
  const spot = $('#lab-spot');
  if (spot && !reduce) {
    const move = e => {
      const r = spot.getBoundingClientRect();
      spot.style.setProperty('--x', e.clientX - r.left + 'px');
      spot.style.setProperty('--y', e.clientY - r.top + 'px');
    };
    spot.addEventListener('pointermove', move);
    spot.addEventListener('pointerdown', move);
    // idle drift so it is discoverable before the first hover
    const o = { t: 0 };
    gsap.to(o, { t: Math.PI * 2, duration: 7, repeat: -1, ease: 'none', onUpdate() {
      if (spot.matches(':hover')) return;
      const r = spot.getBoundingClientRect();
      spot.style.setProperty('--x', r.width * (0.5 + Math.cos(o.t) * 0.28) + 'px');
      spot.style.setProperty('--y', r.height * (0.5 + Math.sin(o.t * 1.3) * 0.22) + 'px');
    } });
  }

  // 5 · parallax layers + draggable chips
  const par = $('#lab-par');
  if (par) {
    if (!reduce) {
      const layers = $$('.lpar-layer', par).map(l => ({
        d: +l.dataset.depth,
        x: gsap.quickTo(l, 'x', { duration: 0.9, ease: 'power3.out' }),
        y: gsap.quickTo(l, 'y', { duration: 0.9, ease: 'power3.out' })
      }));
      par.addEventListener('pointermove', e => {
        const r = par.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach(l => { l.x(-px * l.d * 60); l.y(-py * l.d * 60); });
      });
      par.addEventListener('pointerleave', () => layers.forEach(l => { l.x(0); l.y(0); }));
    }
    $$('.chip', par).forEach(chip => {
      chip.addEventListener('pointerdown', e => {
        e.preventDefault();
        chip.setPointerCapture(e.pointerId);
        chip.classList.add('drag');
        const sr = par.getBoundingClientRect(), cr = chip.getBoundingClientRect();
        const sx = e.clientX, sy = e.clientY;
        const bx = gsap.getProperty(chip, 'x'), by = gsap.getProperty(chip, 'y');
        const minX = sr.left - cr.left, maxX = sr.right - cr.right, minY = sr.top - cr.top, maxY = sr.bottom - cr.bottom;
        if (!reduce) gsap.to(chip, { scale: 1.12, duration: 0.25, ease: 'back.out(3)' });
        const move = ev => gsap.set(chip, { x: bx + clamp(minX, maxX, ev.clientX - sx), y: by + clamp(minY, maxY, ev.clientY - sy) });
        const up = () => {
          chip.classList.remove('drag');
          chip.removeEventListener('pointermove', move);
          chip.removeEventListener('pointerup', up);
          chip.removeEventListener('pointercancel', up);
          if (!reduce) gsap.to(chip, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.5)' });
        };
        chip.addEventListener('pointermove', move);
        chip.addEventListener('pointerup', up);
        chip.addEventListener('pointercancel', up);
      });
    });
  }

  /* ------------------------------------------------------------------
   * AI sidekick: eyes follow the cursor, head tilts, blinks, talks per section
   * ---------------------------------------------------------------- */
  const bot = $('#bot');
  if (bot) {
    const body = $('#bot-body'), eyes = $$('.bot-eye', bot), bubble = $('#bot-bubble'), hop = $('.bot-hop', bot);
    let hideT;
    const say = (msg, ms = 4200) => {
      bubble.textContent = msg;
      bot.classList.add('talk');
      clearTimeout(hideT);
      hideT = setTimeout(() => bot.classList.remove('talk'), ms);
    };

    addEventListener('bot:say', e => say(e.detail, 3200));

    if (!reduce) {
      gsap.set(body, { transformPerspective: 500 });
      const tiltX = gsap.quickTo(body, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const tiltY = gsap.quickTo(body, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      const ex = eyes.map(e => gsap.quickTo(e, 'x', { duration: 0.25, ease: 'power2.out' }));
      const ey = eyes.map(e => gsap.quickTo(e, 'y', { duration: 0.25, ease: 'power2.out' }));
      const look = (x, y) => {
        const r = body.getBoundingClientRect();
        const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * 0.44);
        const d = Math.hypot(dx, dy) || 1, k = Math.min(d / 220, 1), max = r.width * 0.03;
        ex.forEach(f => f(dx / d * max * k)); ey.forEach(f => f(dy / d * max * k));
        tiltY(clamp(-16, 16, dx / innerWidth * -28)); tiltX(clamp(-12, 12, dy / innerHeight * 22));
      };
      addEventListener('pointermove', e => look(e.clientX, e.clientY), { passive: true });
      (function blink() {
        gsap.to(eyes, { scaleY: 0.08, duration: 0.07, yoyo: true, repeat: 1, delay: 2.4 + Math.random() * 3, onComplete: blink });
      })();
    }

    const lines = ["Hi! I'm Ranjith's AI sidekick 👋", 'Psst… the Design Lab demos are fun.', 'He ships FastAPI + React, fast.', 'Want to hire him? Hit “Let’s talk”.'];
    let li = 0;
    const poke = () => {
      say(lines[li++ % lines.length], 3600);
      if (reduce) return;
      gsap.fromTo(hop, { y: 0 }, { y: -20, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 });
      gsap.fromTo(eyes, { scale: 1 }, { scale: 1.3, duration: 0.18, yoyo: true, repeat: 1 });
    };
    bot.addEventListener('click', poke);
    bot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });

    $$('[data-bot]').forEach(sec => ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onEnter: () => say(sec.dataset.bot), onEnterBack: () => say(sec.dataset.bot)
    }));
    setTimeout(() => { bot.classList.add('on'); say($('#hero').dataset.bot, 4800); }, 2800);
  }

  /* ------------------------------------------------------------------
   * Toolkit: hovering a diagram node lights up its skill cards, and vice versa
   * ---------------------------------------------------------------- */
  const bento = $('#bento');
  if (bento) {
    const svg = $('.dg', bento);
    const nodes = $$('.dg-node', bento);
    const tiles = $$('.skill', bento);
    if (reduce && svg && svg.pauseAnimations) svg.pauseAnimations();
    const clear = () => {
      nodes.forEach(n => n.classList.remove('hot'));
      tiles.forEach(t => t.classList.remove('hot', 'dim'));
      svg.classList.remove('focus');
    };
    const lightNode = key => {
      clear();
      svg.classList.add('focus');
      nodes.forEach(n => n.classList.toggle('hot', n.dataset.key === key));
      tiles.forEach(t => {
        const on = t.dataset.nodes.split(' ').includes(key);
        t.classList.toggle('hot', on); t.classList.toggle('dim', !on);
      });
    };
    const lightTile = tile => {
      clear();
      const keys = tile.dataset.nodes.split(' ');
      svg.classList.add('focus');
      nodes.forEach(n => n.classList.toggle('hot', keys.includes(n.dataset.key)));
    };
    nodes.forEach(n => {
      n.addEventListener('pointerenter', () => lightNode(n.dataset.key));
      n.addEventListener('pointerleave', clear);
      n.addEventListener('focus', () => lightNode(n.dataset.key));
      n.addEventListener('blur', clear);
    });
    tiles.forEach(t => {
      t.addEventListener('pointerenter', () => lightTile(t));
      t.addEventListener('pointerleave', clear);
    });
  }

  /* ------------------------------------------------------------------
   * Contact: copy email, live IST clock
   * ---------------------------------------------------------------- */
  const copyBtn = $('#copy-mail');
  if (copyBtn) {
    const label = $('.cm-label', copyBtn), hint = $('#cm-hint');
    const original = label.textContent;
    let resetT;
    const burst = () => {
      if (reduce) return;
      const r = copyBtn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (let i = 0; i < 16; i++) {
        const d = document.createElement('i');
        d.className = 'cm-burst';
        document.body.appendChild(d);
        const ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 90;
        gsap.fromTo(d, { x: cx, y: cy, scale: 1, opacity: 1 }, {
          x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist - 20, scale: 0, opacity: 0,
          duration: 0.8 + Math.random() * 0.4, ease: 'power3.out', onComplete: () => d.remove()
        });
      }
    };
    const done = ok => {
      clearTimeout(resetT);
      copyBtn.style.minWidth = copyBtn.offsetWidth + 'px';
      copyBtn.classList.toggle('copied', ok);
      label.textContent = ok ? 'Copied ✓' : 'Press Ctrl+C';
      hint.textContent = ok ? 'Email copied to clipboard' : 'Copy failed — select and copy manually';
      hint.classList.toggle('ok', ok);
      if (ok) { burst(); dispatchEvent(new CustomEvent('bot:say', { detail: 'Copied! Talk soon 👋' })); }
      resetT = setTimeout(() => {
        label.textContent = original; copyBtn.classList.remove('copied');
        hint.textContent = 'Click to copy'; hint.classList.remove('ok');
        copyBtn.style.minWidth = '';
      }, 2200);
    };
    copyBtn.addEventListener('click', async () => {
      const text = copyBtn.dataset.email;
      try { await navigator.clipboard.writeText(text); done(true); }
      catch (e) {
        try {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          const ok = document.execCommand('copy'); ta.remove(); done(ok);
        } catch (e2) { done(false); }
      }
    });
  }

  const istEl = $('#ist-time');
  if (istEl) {
    let fmt;
    try { fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }); } catch (e) { fmt = null; }
    const tick = () => { if (fmt) istEl.textContent = fmt.format(new Date()).toUpperCase(); };
    tick(); setInterval(tick, 15000);
  }

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

  // About: statement lights up word by word as you scroll
  const big = $('.about-text .big');
  if (big) {
    const wrapWords = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const sp = document.createElement('span');
            sp.className = 'hl-w'; sp.textContent = part;
            frag.appendChild(sp);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrapWords(n);
      });
    };
    wrapWords(big);
    big.classList.add('hl');
    gsap.to('.hl-w', {
      opacity: 1, ease: 'none', stagger: 0.15,
      scrollTrigger: { trigger: big, start: 'top 82%', end: 'bottom 42%', scrub: 0.5 }
    });
  }

  // About: terminal types itself out when it scrolls into view (click to replay)
  const term = $('#term-body');
  if (term) {
    const rows = $$('p', term).map(p => ({ el: p, text: p.textContent, cmd: p.classList.contains('t-cmd') }));
    const caret = document.createElement('i');
    caret.className = 't-caret';
    let run = 0;
    const play = async () => {
      const id = ++run;
      const wait = ms => new Promise(r => setTimeout(r, ms));
      rows.forEach(r => { r.el.textContent = ''; r.el.style.visibility = 'hidden'; });
      for (const r of rows) {
        if (id !== run) return;
        r.el.style.visibility = 'visible';
        const tn = document.createTextNode('');
        r.el.append(tn, caret);
        if (r.cmd) {
          await wait(260);
          for (let i = 1; i <= r.text.length; i++) {
            if (id !== run) return;
            tn.nodeValue = r.text.slice(0, i);
            await wait(38 + Math.random() * 40);
          }
          await wait(200);
        } else {
          tn.nodeValue = r.text;
          await wait(220);
        }
      }
    };
    rows.forEach(r => { r.el.textContent = ''; r.el.style.visibility = 'hidden'; });
    ScrollTrigger.create({ trigger: '#term', start: 'top 80%', once: true, onEnter: play });
    $('#term').addEventListener('click', play);
  }

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

  // Journey: the sticky left panel + year wheel follow the active role.
  // Desktop shows ONE card at a time (the others are hidden); tablet/mobile keep the stacked list.
  const jr = $('#jr'), jrStick = $('.jr-stick'), jrItems = $$('.tl-item');
  const jrPanes = $$('.jr-pane'), jrSteps = $$('.jr-step');
  if (jr && jrStick && jrItems.length && jrPanes.length) {
    const N = jrItems.length;
    const setActive = i => {
      jrPanes.forEach((p, k) => p.classList.toggle('is-on', k === i));
      jrSteps.forEach((s, k) => s.classList.toggle('is-on', k === i));
      jrItems.forEach((it, k) => it.classList.toggle('is-active', k === i));
    };
    // Year wheel: a big clock-style arc around the panel, years where the numbers would be.
    // It turns as you scroll so the current year always sits at 3 o'clock, beside the card.
    const wheel = $('#jr-wheel'), side = wheel && wheel.parentElement;
    const yrs = jrPanes.map(p => +p.querySelector('.jr-year b').textContent);
    const yMax = Math.max(...yrs), yMin = Math.min(...yrs);
    const wState = { pos: 0 };
    let W = null;
    const NS = 'http://www.w3.org/2000/svg';
    const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
    const buildWheel = () => {
      if (!wheel) return;
      wheel.textContent = ''; W = null;
      const sw = side.offsetWidth, sh = side.offsetHeight, tl = $('#timeline');
      if (!sw || !tl) return;
      const gap = Math.max(36, (tl.getBoundingClientRect().left + 10) - side.getBoundingClientRect().right);
      const R = sw / 2 + gap * 0.5;
      const maxRad = Math.acos(Math.min(0.99, (sw / 2 + 12) / R));
      const step = 62 / R;
      const S = 2 * (R + 70), c0 = S / 2;
      const svg = mk('svg', { width: S, height: S, viewBox: `0 0 ${S} ${S}` });
      svg.style.left = sw / 2 - S / 2 + 'px'; svg.style.top = sh / 2 - S / 2 + 'px';
      const pt = (rad, r) => [c0 + r * Math.cos(rad), c0 + r * Math.sin(rad)];
      const [x1, y1] = pt(-maxRad - 0.12, R), [x2, y2] = pt(maxRad + 0.12, R);
      svg.appendChild(mk('path', { class: 'jw-arc', d: `M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}` }));
      const items = [];
      for (let y = yMax; y >= yMin; y--) {
        const tick = mk('line', { class: 'jw-tick' });
        const label = mk('text', { class: 'jw-yr' }); label.textContent = y;
        svg.append(tick, label);
        items.push({ i: yMax - y, tick, label });
      }
      const dot = mk('circle', { class: 'jw-dot', cx: c0 + R, cy: c0, r: 4.5 });
      svg.appendChild(dot);
      wheel.appendChild(svg);
      W = { R, step, maxRad, c0, items, fs: Math.max(12, Math.min(22, gap * 0.34)) };
    };
    const paintWheel = () => {
      if (!W) return;
      const { R, step, maxRad, c0, items, fs } = W, pos = wState.pos;
      items.forEach(it => {
        const th = (it.i - pos) * step, ad = Math.abs(th);
        const vis = ad < maxRad ? Math.pow(1 - ad / maxRad, 0.8) : 0;
        const x = c0 + R * Math.cos(th), y = c0 + R * Math.sin(th);
        const on = Math.abs(it.i - pos) < 0.5;
        it.label.setAttribute('x', x.toFixed(1)); it.label.setAttribute('y', y.toFixed(1));
        it.label.style.opacity = vis.toFixed(2);
        it.label.style.fontSize = (on ? fs * 1.35 : fs * 0.78) + 'px';
        it.label.classList.toggle('on', on);
        const tx1 = c0 + (R - 5) * Math.cos(th), ty1 = c0 + (R - 5) * Math.sin(th), tx2 = c0 + (R + 5) * Math.cos(th), ty2 = c0 + (R + 5) * Math.sin(th);
        it.tick.setAttribute('x1', tx1.toFixed(1)); it.tick.setAttribute('y1', ty1.toFixed(1));
        it.tick.setAttribute('x2', tx2.toFixed(1)); it.tick.setAttribute('y2', ty2.toFixed(1));
        it.tick.style.opacity = (vis * 0.9).toFixed(2);
      });
    };
    const moveWheel = f => {
      if (!wheel) return;
      const i = Math.min(yrs.length - 2, Math.max(0, Math.floor(f)));
      const t = Math.min(1, Math.max(0, f - i));
      const yr = yrs[i] + (yrs[i + 1] - yrs[i]) * t;
      gsap.to(wState, { pos: yMax - yr, duration: 0.7, ease: 'power3.out', overwrite: true, onUpdate: paintWheel });
    };
    buildWheel(); paintWheel();
    addEventListener('load', () => { buildWheel(); paintWheel(); });
    let wTimer;
    addEventListener('resize', () => { clearTimeout(wTimer); wTimer = setTimeout(() => { buildWheel(); paintWheel(); }, 150); });


    const mmJ = gsap.matchMedia();

    // tablet / mobile: original stacked cards with scroll reveals
    mmJ.add('(max-width: 980px)', () => {
      gsap.to('#tl-fill', {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 70%', scrub: true }
      });
      jrItems.forEach(item => {
        gsap.from(item.querySelector('.tl-card'), { x: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: item, start: 'top 82%' } });
        gsap.from(item.querySelector('.tl-dot'), { scale: 0, duration: 0.7, ease: 'back.out(3)', scrollTrigger: { trigger: item, start: 'top 82%' } });
      });
    });

    // desktop: scroll steps through the roles, one card visible at a time
    mmJ.add('(min-width: 981px)', () => {
      jr.classList.add('is-stepper');
      jr.style.setProperty('--jr-n', N);
      buildWheel(); paintWheel();
      let cur = -1, raf = 0;
      const geo = () => {
        const r = jr.getBoundingClientRect();
        const top = parseFloat(getComputedStyle(jrStick).top) || 0;
        return { r, top, range: Math.max(1, r.height - jrStick.offsetHeight) };
      };
      const show = (i, dir, animate) => {
        jrItems.forEach((it, k) => { it.classList.toggle('is-hidden', k !== i); it.setAttribute('aria-hidden', k !== i ? 'true' : 'false'); });
        if (!animate) return;
        const it = jrItems[i];
        gsap.fromTo($('.tl-card', it), { x: 60 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'expo.out', overwrite: 'auto' });
        gsap.fromTo($('.tl-dot', it), { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(3)', overwrite: 'auto' });
      };
      const update = () => {
        raf = 0;
        const { r, top, range } = geo();
        const p = Math.min(1, Math.max(0, (top - r.top) / range));
        const idx = Math.min(N - 1, Math.floor(p * N));
        gsap.set('#tl-fill', { scaleY: p });
        moveWheel(Math.min(N - 1, Math.max(0, p * N - 0.5)));
        if (idx !== cur) {
          const dir = idx > cur ? 1 : -1, first = cur === -1;
          cur = idx; setActive(idx); show(idx, dir, !first);
        }
      };
      const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
      addEventListener('scroll', queue, { passive: true });
      addEventListener('resize', queue);
      jrSteps.forEach((s, i) => { s.onclick = () => {
        const { r, top, range } = geo();
        scrollTo({ top: scrollY + r.top - top + ((i + 0.5) / N) * range, behavior: 'smooth' });
      }; });
      update();
      return () => {
        removeEventListener('scroll', queue); removeEventListener('resize', queue);
        jrSteps.forEach(s => { s.onclick = null; });
        jr.classList.remove('is-stepper'); jr.style.removeProperty('--jr-n');
        jrItems.forEach(it => { it.classList.remove('is-hidden'); it.removeAttribute('aria-hidden'); });
        gsap.set('#tl-fill', { clearProps: 'transform' });
      };
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
    const fill = $('#h-fill'), cur = $('#h-cur');
    let curIdx = -1;
    gsap.to(trackEl, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '#projects', pin, start: 'top top',
        end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1,
        onUpdate: self => {
          const cards = $$('.card');
          const idx = Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1)));
          if (fill) fill.style.transform = `scaleX(${self.progress})`;
          if (idx !== curIdx) {
            curIdx = idx;
            cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
            if (cur) { cur.textContent = String(idx + 1).padStart(2, '0'); gsap.fromTo(cur, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }); }
          }
        }
      }
    });
    $$('.card').forEach(c => gsap.from(c, { opacity: 0.2, scale: 0.92, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '#projects', start: 'top 70%' } }));
  });
  mm.add('(max-width: 720px)', () => {
    $$('.card').forEach(c => gsap.from(c, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 88%' } }));
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
