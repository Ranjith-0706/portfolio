import { gsap } from 'gsap';
import { LOADER } from '@/config/scene.config';
import { ui, xp } from '../store';
import { characterApi } from '../character/characterApi';
import type { LogicalState } from '../character/character.config';

/**
 * Loader director — sequences the intro story as a list of STEPS.
 *
 * Every step talks to the character through LOGICAL states only (`characterApi.force`). If the
 * loaded model has a real clip for that state (e.g. 'Sit', 'LaptopOpen', 'Typing') the step
 * waits for the clip's duration; otherwise it uses the temporary procedural timing below.
 * That is the entire "future clip" integration: no timeline rewrite is needed when the rigged
 * model arrives — the same steps simply find clips and use them.
 */
export interface LoaderControl {
  skipped: boolean;
  cancelled: boolean;
  abort: Array<() => void>;
}

export const createLoaderControl = (): LoaderControl => ({ skipped: false, cancelled: false, abort: [] });

export function skipLoader(ctl: LoaderControl) {
  ctl.skipped = true;
  ctl.abort.splice(0).forEach((f) => f());
}
export function cancelLoader(ctl: LoaderControl) {
  ctl.cancelled = true;
  ctl.skipped = true;
  ctl.abort.splice(0).forEach((f) => f());
}

const wait = (ctl: LoaderControl, s: number) =>
  new Promise<void>((res) => {
    if (ctl.skipped) return res();
    const call = gsap.delayedCall(s, () => res());
    ctl.abort.push(() => {
      call.kill();
      res();
    });
  });

const tween = (ctl: LoaderControl, target: object, vars: gsap.TweenVars) =>
  new Promise<void>((res) => {
    if (ctl.skipped) {
      gsap.set(target, { ...vars, onComplete: undefined, onUpdate: undefined });
      return res();
    }
    const t = gsap.to(target, { ...vars, onComplete: res });
    ctl.abort.push(() => {
      t.progress(1);
      res();
    });
  });

/** Resolves when `cond()` is true, the timeout elapses, or the run is cancelled. */
const until = (ctl: LoaderControl, cond: () => boolean, timeoutMs: number) =>
  new Promise<void>((res) => {
    const t0 = performance.now();
    const id = setInterval(() => {
      if (cond() || performance.now() - t0 > timeoutMs || ctl.cancelled) {
        clearInterval(id);
        res();
      }
    }, 50);
  });

/** Force a logical state; if a real clip exists, wait for it, else wait `fallback` seconds. */
async function performState(ctl: LoaderControl, state: LogicalState, fallbackSeconds: number) {
  characterApi.force(state);
  const clip = characterApi.clipDuration(state);
  await wait(ctl, clip > 0 ? clip : fallbackSeconds);
}

const setStatus = (loaderStatus: string) => ui.set({ loaderStatus });

export function resetIntroState() {
  xp.character.opacity = 0;
  xp.character.forced = null;
  xp.laptop.visible = 0;
  xp.laptop.open = 0;
  xp.laptop.glow = 0;
  xp.laptop.y = 1.6;
  xp.loader.stage = 0;
  xp.loader.typing = 0;
  xp.loader.shown = 0;
  xp.camera.blend = 0;
}

/** Runs the whole intro. Resolves when the page is handed over to the scroll journey. */
export async function runLoader(ctl: LoaderControl, opts: { reduced: boolean }) {
  const t0 = performance.now();
  const modelSettled = () => ui.get().modelReady || ui.get().modelFailed;
  const hardStop = setTimeout(() => skipLoader(ctl), LOADER.maxDuration);

  try {
    // ---- no 3D at all / model failed → never block the site ---------------------------------
    if (ui.get().modelFailed || !ui.get().webgl) {
      ui.set({ phase: 'journey', introDone: true });
      return;
    }

    // ---- reduced motion: a calm, short fade-in, no falling ----------------------------------
    if (opts.reduced) {
      setStatus('Preparing');
      await until(ctl, modelSettled, LOADER.maxDuration);
      xp.camera.blend = 1;
      xp.laptop.visible = 0;
      xp.loader.stage = 1;
      await tween(ctl, xp.character, { opacity: 1, duration: 0.5 });
      ui.set({ phase: 'journey', introDone: true });
      return;
    }

    // ---- 1. stage lights come up ---------------------------------------------------------------
    setStatus('Setting the stage');
    await tween(ctl, xp.loader, { stage: 1, duration: 1.2, ease: 'power2.out' });

    // ---- 2. the miniature laptop is placed in front of him -------------------------------------
    setStatus('Placing the laptop');
    xp.laptop.visible = 1;
    await tween(ctl, xp.laptop, { y: 0, duration: 0.75, ease: 'bounce.out' });

    // ---- 3. the character steps into the light (waits for the real model) ---------------------
    await until(ctl, modelSettled, LOADER.maxDuration);
    if (ui.get().modelFailed) return void ui.set({ phase: 'journey', introDone: true });
    await tween(ctl, xp.character, { opacity: 1, duration: 1.0, ease: 'power1.inOut' });

    // ---- 4. Sit (future clip) ------------------------------------------------------------------
    await performState(ctl, 'Sit', 0.2);

    // ---- 5. opens the laptop → screen illuminates his face -----------------------------------------
    setStatus('Opening the laptop');
    characterApi.force('LaptopOpen');
    const openClip = characterApi.clipDuration('LaptopOpen');
    await Promise.all([
      tween(ctl, xp.laptop, { open: 1, duration: Math.max(1.1, openClip), ease: 'power2.inOut' }),
      wait(ctl, 0.5).then(() => tween(ctl, xp.laptop, { glow: 1, duration: 0.9, ease: 'power1.out' })),
    ]);

    // ---- 6. typing while the real progress completes -----------------------------------------------
    setStatus('Compiling the experience');
    characterApi.force('Typing');
    await tween(ctl, xp.loader, { typing: 1, duration: 0.6 });
    const elapsed = () => performance.now() - t0;
    await new Promise<void>((res) => {
      if (ctl.skipped) return res();
      const id = setInterval(() => {
        if ((xp.loader.shown >= 0.995 && elapsed() >= LOADER.minDuration) || ctl.skipped) {
          clearInterval(id);
          res();
        }
      }, 60);
      ctl.abort.push(() => {
        clearInterval(id);
        res();
      });
    });
  } finally {
    clearTimeout(hardStop);
  }

  if (ctl.cancelled) return;

  // ---- 7. transition to the hero stage ---------------------------------------------------------------
  setStatus('Ready');
  const fast = ctl.skipped;
  characterApi.force(null);
  await until(ctl, modelSettled, LOADER.maxDuration);
  if (ui.get().modelFailed) return void ui.set({ phase: 'journey', introDone: true });

  const fade = gsap.timeline();
  fade
    .to(xp.character, { opacity: 0, duration: fast ? 0.15 : 0.45, ease: 'power1.in' }, 0)
    .to(xp.laptop, { open: 0, glow: 0, duration: fast ? 0.15 : 0.5 }, 0)
    .to(xp.laptop, { visible: 0, duration: 0.01 }, fast ? 0.15 : 0.5);
  await new Promise<void>((res) => fade.eventCallback('onComplete', () => res()));

  ui.set({ phase: 'transition' });
  xp.laptop.visible = 0;
  xp.character.opacity = 1;
  const camTween = gsap.to(xp.camera, { blend: 1, duration: fast ? 0.7 : 1.9, ease: 'expo.inOut' });
  await new Promise<void>((res) => gsap.delayedCall(fast ? 0.45 : 1.25, () => res()));
  ui.set({ phase: 'falling' });
  await camTween.then();
}
