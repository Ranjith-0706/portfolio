# Cinematic 3D character portfolio

A scroll-driven short film: a miniature developer (your real `character_high.glb`) is the protagonist
of the whole page. **All portfolio copy is placeholder** — replace `src/data/portfolio.ts` with your resume.

Stack: Next.js 16 · React 19 · TypeScript · Three.js · React Three Fiber · drei · GSAP + ScrollTrigger · Lenis · Tailwind CSS v4 + custom CSS.

## Run it

```bash
cd cinematic
npm install
npm run dev          # http://localhost:3000   (debug panel: press ` )
npm run build && npm start   # production
npm run lint         # tsc --noEmit
```

Useful URL parameters: `?quality=low|medium|high` forces a quality tier (default is auto-detected).

## What you get

1. **Loader** — a warm spotlight, the character beside a miniature laptop with an animated hinge and an
   emissive screen that lights his face; the progress number is the **real** asset-loading progress.
   *Skip intro* button (and `Esc`). Never holds the site longer than 20 s.
2. **Hero** — after a cut to the dark stage, the *same* character falls from above the viewport under
   gravity, lands softly (dust + contact shadow), then the monumental `RANJITH P` reveals behind him.
3. **Continuous journey** — one normalised scroll timeline drives the character, camera, lights and props.
   He alternates right→left / left→right per section, never teleports, settles into idle when scrolling
   stops, and reverses smoothly when you scroll up.
4. **Seven sections** — Hero, About, Toolkit (spatial typography + a miniature workstation), Experience
   (a career line that draws with scroll), Projects (full-bleed showcases), Education & Achievements,
   Contact (laptop beside him; hooks for sit / type / wave).
5. Magnetic buttons, restrained cursor, minimal side-nav with active indicator, scroll progress,
   *Replay intro*, optional ambient sound (**off by default**, synthesised, starts only on click).

## Architecture

```
src/
  app/                     Next.js entry (layout.tsx fonts + safety net, page.tsx)
  components/
    ExperienceRoot.tsx     composes canvas + loader + scroll + content
    layout/                SiteChrome (nav/progress/tools), Cursor
    sections/              Hero, About, Skills, ExperienceSection, Projects, Education, Contact
    ui/                    MagneticButton, Words (masked text), ProjectPreview, DebugPanel (dev only)
  config/
    scene.config.ts        palette, quality presets, gravity, loader timings
    timeline.config.ts     KEYFRAMES: character x/z/yaw, camera, light, props per scroll position
  data/portfolio.ts        ALL content (placeholder)
  experience/
    store.ts               `ui` (low-frequency React state) + `xp` (per-frame mutable state)
    canvas/                PersistentCanvas (the ONE canvas), ErrorBoundary, PostFx
    character/             CharacterModel · CharacterController · CharacterAnimationAdapter ·
                           CharacterStateMachine · ProceduralMotion · FallPhysics · character.config
    camera/                CameraController (+ frame helpers)
    lighting/              LightingController
    environment/           EnvironmentController (floor, dust, workstation prop)
    loader/                loaderDirector (step sequence) · LoaderOverlay · Laptop
    scroll/                ScrollController (Lenis ⇄ ScrollTrigger, scroll → pose)
    performance/           PerformanceManager (tier detection + runtime downgrade)
```

Design rules that hold everywhere:

* **One canvas, one character, one scene** — mounted once and never destroyed between sections.
* **No per-frame React state.** Animation reads/writes the mutable `xp` object; React only sees
  low-frequency changes (`phase`, active section, quality).
* **Sections know nothing about the character.** They are DOM + GSAP. The character reacts to *scroll
  position*, via `timeline.config.ts`.
* **Character is data** — see [`docs/CHARACTER_REPLACEMENT.md`](docs/CHARACTER_REPLACEMENT.md).

## Performance & fallbacks

* Quality tiers (`high` / `medium` / `low`) are chosen from GPU renderer string, cores, memory and
  pointer type; integrated graphics land on `medium` (no post-processing). `PerformanceMonitor` steps the
  tier **down** at runtime if frame rate drops; DPR is capped per tier and adapts.
* `high` only: selective bloom (luminance-gated to the emissive screens) + vignette. Others use a CSS vignette.
* Real shadow map only on `high`/`medium`; a cheap blob contact shadow is always on.
* Rendering stops while the tab is hidden; GPU resources are disposed on unmount.
* **Never blocks content:** no WebGL → static hero with the character still; model fails to load →
  loader hands over immediately; JS pipeline stalls → content is revealed after 30 s by an inline script;
  `<noscript>` shows everything.
* `prefers-reduced-motion`: native scrolling (no Lenis), no fall / bobbing / parallax, short fade-in, all
  reveal animations skipped.
* Accessibility: semantic headings, skip link, `aria-current` nav, focus rings, `aria-pressed` toggles,
  the canvas is `aria-hidden`.

## Notes

* The current GLB is a **static mesh** (100k triangles, no rig). Movement is therefore a rigid glide with
  a slight lean — it is *not* presented as walking. The loader shows him standing beside the laptop.
* `public/models/laptop.glb` is optional/unused: the laptop is built procedurally (hinge + emissive screen).
* Frame-rate figures should be measured on your integrated-graphics laptop; the automated checks in this
  repo ran on a software renderer, which says nothing about real GPU speed.
