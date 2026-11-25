'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  LinearFilter,
  SRGBColorSpace,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type ShaderMaterial,
} from 'three';
import { QUALITY_PRESETS } from '@/config/scene.config';
import { damp } from '@/utils/math';
import { useUi, xp } from '../store';
import { visibleAt } from '../camera/frame';

/* -------------------------------------------------------------------------------------------
 * Floor: a transparent shadow-catcher + a soft pool of warm light. The page background (and the
 * hero typography) stays visible through the canvas, so there is no opaque "ground" plane.
 * ----------------------------------------------------------------------------------------- */
function Floor() {
  const quality = useUi((s) => s.quality);
  const realShadows = QUALITY_PRESETS[quality].shadowMap > 0;
  const pool = useRef<Mesh>(null);
  const poolTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(128, 128, 6, 128, 128, 128);
    grad.addColorStop(0, 'rgba(215,172,116,0.55)');
    grad.addColorStop(0.5, 'rgba(215,172,116,0.16)');
    grad.addColorStop(1, 'rgba(215,172,116,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.minFilter = LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, []);
  useEffect(() => () => poolTex.dispose(), [poolTex]);

  useFrame((_, dtRaw) => {
    const m = pool.current;
    if (!m) return;
    const dt = Math.min(dtRaw, 0.05);
    m.position.x = damp(m.position.x, xp.character.x, 5, dt);
    m.position.z = damp(m.position.z, xp.character.z, 5, dt);
    const stage = xp.camera.blend < 1 ? Math.max(0, xp.loader.stage) : 1;
    (m.material as MeshBasicMaterial).opacity = 0.5 * stage * (0.6 + 0.4 * xp.pose.light.warm);
  });

  return (
    <>
      <mesh ref={pool} rotation-x={-Math.PI / 2} position-y={0.001}>
        <circleGeometry args={[4.4, 48]} />
        <meshBasicMaterial map={poolTex} transparent depthWrite={false} opacity={0} toneMapped={false} />
      </mesh>
      {realShadows && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.0015} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <shadowMaterial transparent opacity={0.5} />
        </mesh>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------------------------
 * Atmospheric dust: a few warm motes drifting upward, animated entirely in the vertex shader.
 * ----------------------------------------------------------------------------------------- */
const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * (0.03 + aSeed * 0.05);
    p.y = mod(p.y + t * 3.0, 4.2);
    p.x += sin(uTime * 0.2 + aSeed * 40.0) * 0.25;
    p.z += cos(uTime * 0.17 + aSeed * 31.0) * 0.2;
    vAlpha = smoothstep(0.0, 0.5, p.y) * (1.0 - smoothstep(2.6, 4.2, p.y)) * (0.25 + aSeed * 0.6);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (0.6 + aSeed) * (3.2 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

function Dust() {
  const quality = useUi((s) => s.quality);
  const count = QUALITY_PRESETS[quality].particles;
  const mat = useRef<ShaderMaterial>(null);
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 4.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 7 - 0.5;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new BufferAttribute(seed, 1));
    return g;
  }, [count]);
  useEffect(() => () => geo.dispose(), [geo]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uSize: { value: 38 }, uColor: { value: new Color('#D7AC74') } }),
    [],
  );
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += Math.min(dt, 0.05);
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={dustVertex}
        fragmentShader={dustFragment}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

/* -------------------------------------------------------------------------------------------
 * Miniature developer workstation — appears beside the character in the Skills section only.
 * ----------------------------------------------------------------------------------------- */
function Workstation() {
  const group = useRef<Group>(null);
  const screenTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 320;
    const g = c.getContext('2d')!;
    g.fillStyle = '#0d0c0b';
    g.fillRect(0, 0, 512, 320);
    g.fillStyle = '#1a1816';
    g.fillRect(0, 0, 512, 24);
    for (let i = 0; i < 15; i++) {
      const ind = [0, 1, 1, 2, 0, 2, 3, 1][i % 8];
      g.fillStyle = i % 4 === 0 ? '#D7AC74' : '#6f6a62';
      g.fillRect(28 + ind * 24, 44 + i * 18, 60 + ((i * 47) % 190), 7);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => screenTex.dispose(), [screenTex]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const v = xp.pose.props.workstation;
    g.visible = v > 0.01;
    if (!g.visible) return;
    const z = -0.55;
    const w = visibleAt(z).w;
    g.position.set(xp.camera.tx + w * (xp.viewport.mobile ? 0.3 : 0.345), 0, z);
    g.rotation.y = -0.55;
    g.scale.setScalar(Math.max(0.001, v) * (xp.viewport.mobile ? 0.75 : 1));
  });

  const graphite = '#1d1d20';
  return (
    <group ref={group} visible={false}>
      {/* desk top + legs */}
      <mesh position={[0, 0.34, 0]} castShadow>
        <boxGeometry args={[1.05, 0.035, 0.52]} />
        <meshStandardMaterial color="#26231f" roughness={0.7} />
      </mesh>
      {[-0.48, 0.48].flatMap((x) => [-0.2, 0.2].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.17, z]}>
          <boxGeometry args={[0.03, 0.34, 0.03]} />
          <meshStandardMaterial color={graphite} roughness={0.5} metalness={0.6} />
        </mesh>
      )))}
      {/* monitor */}
      <mesh position={[0, 0.66, -0.13]} castShadow>
        <boxGeometry args={[0.62, 0.38, 0.025]} />
        <meshStandardMaterial color={graphite} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.66, -0.116]}>
        <planeGeometry args={[0.58, 0.34]} />
        <meshBasicMaterial map={screenTex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.45, -0.13]}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
        <meshStandardMaterial color={graphite} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* keyboard */}
      <mesh position={[0, 0.362, 0.1]}>
        <boxGeometry args={[0.42, 0.012, 0.14]} />
        <meshStandardMaterial color="#111113" roughness={0.8} />
      </mesh>
      {/* lamp (warm accent) */}
      <mesh position={[0.4, 0.42, -0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15, 12]} />
        <meshStandardMaterial color={graphite} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.4, 0.52, -0.05]}>
        <sphereGeometry args={[0.035, 16, 12]} />
        <meshBasicMaterial color="#D7AC74" toneMapped={false} />
      </mesh>
      {/* mug */}
      <mesh position={[-0.4, 0.388, 0.12]}>
        <cylinderGeometry args={[0.035, 0.03, 0.07, 16]} />
        <meshStandardMaterial color="#D7AC74" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function EnvironmentController() {
  return (
    <>
      <Floor />
      <Dust />
      <Workstation />
    </>
  );
}
