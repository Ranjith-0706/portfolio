/**
 * Optional ambient sound. OFF by default; the AudioContext is only created after an explicit
 * user gesture (the toggle), which also satisfies browser autoplay policies. The drone is
 * synthesised (no audio files), very quiet, and fades in/out.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;

function build() {
  if (started || typeof window === 'undefined') return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  filter.Q.value = 0.6;
  filter.connect(master);
  master.connect(ctx.destination);

  const freqs = [55, 82.41, 110.0, 164.81];
  freqs.forEach((f, i) => {
    const o = ctx!.createOscillator();
    o.type = i % 2 ? 'sine' : 'triangle';
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 4;
    const g = ctx!.createGain();
    g.gain.value = 0.22 / (i + 1);
    const lfo = ctx!.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.03;
    const lg = ctx!.createGain();
    lg.gain.value = 0.08;
    lfo.connect(lg).connect(g.gain);
    o.connect(g).connect(filter);
    o.start();
    lfo.start();
  });
  started = true;
}

export async function setAmbient(on: boolean) {
  if (on) build();
  if (!ctx || !master) return;
  if (on && ctx.state === 'suspended') await ctx.resume();
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setTargetAtTime(on ? 0.05 : 0, t, on ? 1.2 : 0.4);
  if (!on) setTimeout(() => ctx?.suspend(), 1500);
}
