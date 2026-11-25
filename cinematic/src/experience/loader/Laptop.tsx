'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, LinearFilter, SRGBColorSpace, type Group, type MeshBasicMaterial } from 'three';
import { characterConfig } from '../character/character.config';
import { ui, xp } from '../store';
import { clamp, damp } from '@/utils/math';

const W = 0.42; // width
const D = 0.29; // depth
const T = 0.014; // base thickness
const LID_T = 0.008;
const MAX_OPEN = Math.PI * 0.58; // ≈ 104°

/** Procedural screen: scrolling code lines + a progress bar that mirrors REAL asset progress. */
function useScreenTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.minFilter = LinearFilter;
    tex.generateMipmaps = false;
    const lines = Array.from({ length: 40 }, (_, i) => ({
      indent: [0, 1, 1, 2, 2, 1, 0, 2, 3, 1][(i * 7) % 10],
      len: 6 + ((i * 53) % 22),
      hue: i % 5 === 0 ? 1 : 0,
    }));
    return { canvas, ctx, tex, lines };
  }, []);
}

function drawScreen(
  s: ReturnType<typeof useScreenTexture>,
  time: number,
  typing: number,
  progress: number,
) {
  const { ctx, canvas, tex, lines } = s;
  ctx.fillStyle = '#0d0c0b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // title bar
  ctx.fillStyle = '#1a1816';
  ctx.fillRect(0, 0, canvas.width, 26);
  ctx.fillStyle = '#D7AC74';
  ctx.fillRect(12, 9, 8, 8);
  // code
  const scroll = (time * 18 * typing) % 18;
  const visible = Math.floor(typing * 14) + 4;
  for (let i = 0; i < 16; i++) {
    const l = lines[(i + Math.floor(time * 1.6 * typing)) % lines.length];
    const y = 42 + i * 17 - scroll;
    if (y < 30 || i > visible) continue;
    ctx.fillStyle = l.hue ? '#D7AC74' : '#6f6a62';
    ctx.fillRect(24 + l.indent * 22, y, l.len * 9, 6);
    ctx.fillStyle = '#3b3833';
    ctx.fillRect(24 + l.indent * 22 + l.len * 9 + 8, y, (l.len % 7) * 9 + 14, 6);
  }
  // caret
  if (typing > 0.1 && Math.floor(time * 2.2) % 2 === 0) {
    ctx.fillStyle = '#F4F1EB';
    ctx.fillRect(24 + 66, 42 + Math.min(visible, 15) * 17 - scroll - 2, 7, 12);
  }
  // progress bar (actual asset progress)
  ctx.fillStyle = '#26231f';
  ctx.fillRect(24, canvas.height - 34, canvas.width - 48, 6);
  ctx.fillStyle = '#D7AC74';
  ctx.fillRect(24, canvas.height - 34, (canvas.width - 48) * progress, 6);
  tex.needsUpdate = true;
}

/**
 * Laptop — a miniature, fully procedural laptop with an independently animated hinge and an
 * emissive screen. Driven entirely by `xp.laptop` ({visible, open, glow, y}); nothing about the
 * character is referenced except the anchor offsets in character.config.ts.
 */
export function Laptop() {
  const group = useRef<Group>(null);
  const lid = useRef<Group>(null);
  const screenMat = useRef<MeshBasicMaterial>(null);
  const screen = useScreenTexture();
  const accum = useRef({ vis: 0, open: 0, glow: 0, t: 0, drawn: 0 });

  useEffect(() => () => screen.tex.dispose(), [screen]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const g = group.current;
    const l = lid.current;
    if (!g || !l) return;
    const a = accum.current;
    a.t += dt;

    // In the journey the laptop is a quiet prop that appears with the contact pose; the loader
    // drives it directly via xp.laptop. (Future: Sit/LaptopOpen/Typing clips take over here.)
    const phase = ui.get().phase;
    const journey = phase === 'journey' || phase === 'landing' || phase === 'falling';
    const targetVis = journey ? xp.pose.props.laptop : xp.laptop.visible;
    const targetOpen = journey ? 0.55 * xp.pose.props.laptop : xp.laptop.open;
    const targetGlow = journey ? 0.55 * xp.pose.props.laptop : xp.laptop.glow;
    if (journey) {
      xp.laptop.visible = targetVis;
      xp.laptop.open = targetOpen;
      xp.laptop.glow = targetGlow;
      xp.laptop.y = 0;
    }
    a.vis = damp(a.vis, targetVis, 7, dt);
    a.open = damp(a.open, targetOpen, journey ? 5 : 30, dt);
    a.glow = damp(a.glow, targetGlow, journey ? 5 : 30, dt);

    g.visible = a.vis > 0.01;
    if (!g.visible) return;

    // placement relative to the character
    const off = characterConfig.interaction.laptopOffset;
    const s = Math.max(0.001, a.vis) * (xp.viewport.mobile ? 0.9 : 1);
    g.position.set(xp.character.x + off[0], xp.laptop.y, xp.character.z + off[2]);
    g.rotation.y = characterConfig.interaction.laptopYaw;
    g.scale.setScalar(s);

    // hinge: 0 = closed (lid flat on base), 1 = fully open
    l.rotation.x = -a.open * MAX_OPEN;

    const m = screenMat.current;
    if (m) {
      const k = clamp(a.glow) * clamp(a.open * 1.6);
      m.color.setScalar(k);
    }
    // redraw the screen at ~15 fps while it is lit
    if (a.glow > 0.02 && a.t - a.drawn > 0.066) {
      a.drawn = a.t;
      drawScreen(screen, a.t, journey ? 0.3 : xp.loader.typing, journey ? 1 : xp.loader.shown);
    }
  });

  return (
    <group ref={group} visible={false}>
      {/* base */}
      <mesh position={[0, T / 2, 0]} castShadow>
        <boxGeometry args={[W, T, D]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.45} metalness={0.7} />
      </mesh>
      {/* keyboard deck */}
      <mesh position={[0, T + 0.0005, 0.02]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[W * 0.86, D * 0.52]} />
        <meshStandardMaterial color="#141416" roughness={0.9} />
      </mesh>
      {/* trackpad */}
      <mesh position={[0, T + 0.0006, D * 0.34]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[W * 0.3, D * 0.2]} />
        <meshStandardMaterial color="#1f1f22" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* hinge group: pivot on the back edge */}
      <group ref={lid} position={[0, T, -D / 2]}>
        <mesh position={[0, LID_T / 2, D / 2]} castShadow>
          <boxGeometry args={[W, LID_T, D]} />
          <meshStandardMaterial color="#303034" roughness={0.4} metalness={0.75} />
        </mesh>
        {/* emissive screen on the inner face (faces −Y when closed, toward the user when open) */}
        <mesh position={[0, -0.0004, D / 2]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[W * 0.93, D * 0.9]} />
          <meshBasicMaterial ref={screenMat} map={screen.tex} toneMapped={false} color="#000" />
        </mesh>
      </group>
    </group>
  );
}
