'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type DirectionalLight, type PointLight, type SpotLight } from 'three';
import { QUALITY_PRESETS } from '@/config/scene.config';
import { LOADER_STAGE } from '@/config/timeline.config';
import { lerp, damp } from '@/utils/math';
import { useUi, xp } from '../store';

const WARM = new Color('#D7AC74');
const COOL = new Color('#aeb6c8');
const tmp = new Color();

/**
 * LightingController — one warm key spot that follows the character, a cool-ish rim, a very low
 * ambient and a screen-glow light for the laptop. Intensities come from the timeline pose, so each
 * section has its own mood without any per-section light objects.
 */
export function LightingController() {
  const quality = useUi((s) => s.quality);
  const preset = QUALITY_PRESETS[quality];

  const key = useRef<SpotLight>(null);
  const rim = useRef<DirectionalLight>(null);
  const screen = useRef<PointLight>(null);
  const cur = useRef({ key: 0, rim: 0, amb: 0, warm: 1, keyX: -1, gl: 0 });
  const ambient = useRef<import('three').AmbientLight>(null);
  const fill = useRef<DirectionalLight>(null);

  useEffect(() => {
    const k = key.current;
    if (!k) return;
    k.add(k.target);
    return () => {
      k.remove(k.target);
    };
  }, []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const k = key.current;
    const r = rim.current;
    const sc = screen.current;
    if (!k || !r || !sc) return;

    const b = xp.camera.blend;
    const L = LOADER_STAGE.light;
    const P = xp.pose.light;
    const stage = Math.max(0.0001, xp.loader.stage);
    const targets = {
      key: lerp(L.key, P.key, b) * xp.debug.key * (b < 1 ? stage : 1),
      rim: lerp(L.rim, P.rim, b) * (b < 1 ? stage : 1),
      amb: lerp(L.amb, P.amb, b),
      warm: lerp(L.warm, P.warm, b),
      keyX: lerp(L.keyX, P.keyX, b),
    };
    const c = cur.current;
    c.key = damp(c.key, targets.key, 4, dt);
    c.rim = damp(c.rim, targets.rim, 4, dt);
    c.amb = damp(c.amb, targets.amb, 4, dt);
    c.warm = damp(c.warm, targets.warm, 3, dt);
    c.keyX = damp(c.keyX, targets.keyX, 3, dt);

    const cx = xp.character.x;
    const cz = xp.character.z;
    tmp.copy(COOL).lerp(WARM, c.warm);

    k.color.copy(tmp);
    k.intensity = c.key * 420;
    k.position.set(cx + c.keyX, 4.6, cz + 3.4);
    k.target.position.set(cx, 0.55, cz);
    k.target.updateMatrixWorld();

    r.color.copy(COOL);
    r.intensity = c.rim * 1.6;
    r.position.set(cx + 2.2, 2.6, cz - 3.2);
    r.target.position.set(cx, 0.6, cz);
    r.target.updateMatrixWorld();

    if (ambient.current) ambient.current.intensity = c.amb * 2.4 + 0.22;
    // soft frontal fill keeps the face readable from any camera distance
    if (fill.current) {
      fill.current.intensity = 0.55 + c.amb * 1.5;
      fill.current.position.set(cx + 0.6, 1.6, cz + 5);
      fill.current.target.position.set(cx, 0.6, cz);
      fill.current.target.updateMatrixWorld();
    }

    // Screen glow: sits just in front of the laptop screen and lights the character's face.
    const lx = xp.character.x + 0.55;
    sc.position.set(lx - 0.18, 0.28 + xp.laptop.y, xp.character.z + 0.5);
    sc.intensity = xp.laptop.glow * xp.laptop.open * 2.4 * (xp.laptop.visible > 0.5 ? 1 : 0);
    sc.color.set('#ffe0b0');
  });

  return (
    <>
      <ambientLight ref={ambient} color="#d9dce6" intensity={0.2} />
      <spotLight
        ref={key}
        angle={0.42}
        penumbra={1}
        decay={2}
        distance={30}
        castShadow={preset.shadowMap > 0}
        shadow-mapSize={[preset.shadowMap || 16, preset.shadowMap || 16]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={5}
        shadow-camera-near={2}
        shadow-camera-far={14}
      />
      <directionalLight ref={rim} />
      <directionalLight ref={fill} color="#ffe9cf" />
      <pointLight ref={screen} distance={3.2} decay={2} intensity={0} />
    </>
  );
}
