'use client';
import { Suspense, useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Material, Mesh, MeshBasicMaterial } from 'three';
import { LOADER_STAGE } from '@/config/timeline.config';
import { clamp, damp, dampAngle, lerp, smoothstep } from '@/utils/math';
import { ui, xp, type Phase } from '../store';
import { currentPose, visibleAt } from '../camera/frame';
import { characterConfig } from './character.config';
import { CharacterModel, type CharacterLoadInfo } from './CharacterModel';
import { CharacterAnimationAdapter } from './CharacterAnimationAdapter';
import { CharacterStateMachine } from './CharacterStateMachine';
import { FallPhysics } from './FallPhysics';
import { BlobShadow } from './BlobShadow';
import { ImpactDust } from './ImpactDust';
import { characterApi } from './characterApi';
import { ErrorBoundary } from '../canvas/ErrorBoundary';

/**
 * CharacterController — the single persistent character instance.
 *
 * It owns: world placement (from the scroll timeline), facing, the hero fall/landing physics,
 * the logical state machine and the animation adapter. Sections never talk to it directly;
 * they only change scroll position, which changes the sampled pose.
 */
export function CharacterController() {
  const root = useRef<Group>(null);
  const motion = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const adapter = useRef<CharacterAnimationAdapter | null>(null);
  const mats = useRef<Material[]>([]);
  const sm = useRef(new CharacterStateMachine());
  const fall = useRef(new FallPhysics());
  const lastOpacity = useRef(1);
  const mem = useRef({
    x: 0, z: 0, yaw: 0, vx: 0, speed: 0, yawRate: 0, t: 0,
    prev: null as Phase | null, init: true, fallStartY: 5, settledAt: 0, replay: 0,
  });

  const onLoaded = useCallback((info: CharacterLoadInfo) => {
    adapter.current?.dispose();
    const a = new CharacterAnimationAdapter(info.scene, info.clips, characterConfig);
    adapter.current = a;
    characterApi.attach(a);
    mats.current = info.materials;
    xp.character.clips = a.report.clips;
    xp.character.triangles = info.triangles;
    xp.character.mode = a.mode;
    ui.set({ modelReady: true });
  }, []);

  useEffect(
    () => () => {
      adapter.current?.dispose();
      characterApi.attach(null);
    },
    [],
  );

  useFrame((_, dtRaw) => {
    const r = root.current;
    const mo = motion.current;
    if (!r || !mo) return;
    const dt = Math.min(dtRaw, 0.05);
    const m = mem.current;
    const { phase, reducedMotion, replayToken } = ui.get();
    m.t += dt;

    // ---- re-init on replay ---------------------------------------------------------------
    if (replayToken !== m.replay) {
      m.replay = replayToken;
      m.init = true;
    }

    // ---- targets -------------------------------------------------------------------------
    const pose = currentPose();
    let tx: number, tz: number, tyaw: number;
    if (phase === 'loading') {
      tz = LOADER_STAGE.charZ;
      tx = xp.camera.tx + LOADER_STAGE.charX * visibleAt(tz).w;
      tyaw = LOADER_STAGE.yaw;
    } else {
      tz = pose.z;
      tx = xp.camera.tx + pose.x * visibleAt(tz).w;
      tyaw = pose.yaw;
    }

    // ---- phase entry ---------------------------------------------------------------------
    if (phase !== m.prev) {
      if (phase === 'falling') {
        const vis = visibleAt(tz);
        m.fallStartY = xp.camera.ty + vis.h / 2 + 0.35;
        fall.current.start(m.fallStartY);
        m.x = tx;
        m.z = tz;
        m.vx = 0;
        m.speed = 0;
      }
      m.prev = phase;
    }
    if (m.init) {
      m.x = tx;
      m.z = tz;
      m.yaw = tyaw;
      m.init = false;
    }

    // ---- vertical: fall / landing ---------------------------------------------------------
    let y = 0;
    let landSpring = 0;
    if (phase === 'falling' || phase === 'landing') {
      const res = fall.current.update(dt);
      y = res.y;
      landSpring = res.landSpring;
      if (res.impact !== null) {
        xp.events.impactCount++;
        xp.events.impactX = m.x;
        xp.events.impactZ = m.z;
        xp.events.impactPower = res.impact;
        xp.camera.shake = Math.min(0.06, res.impact * 0.007);
        ui.set({ phase: 'landing' });
      }
      if (res.settled && phase === 'landing') {
        ui.set({ phase: 'journey', introDone: true });
        characterApi.force(null);
      }
    }

    // ---- horizontal: damped travel along the scroll path ------------------------------------
    const prevX = m.x;
    if (phase === 'falling' || phase === 'landing' || xp.debug.freeze) {
      m.x = tx;
      m.z = tz;
    } else if (reducedMotion) {
      m.x = damp(m.x, tx, 12, dt);
      m.z = damp(m.z, tz, 12, dt);
    } else {
      m.x = damp(m.x, tx, 4.2, dt);
      m.z = damp(m.z, tz, 4.2, dt);
    }
    m.vx = (m.x - prevX) / Math.max(dt, 1e-4);
    m.speed = damp(m.speed, Math.abs(m.vx), 10, dt);

    // ---- facing: settle toward content, turn into the direction of travel ----------------------
    let desired = tyaw;
    if (phase === 'journey') {
      const mv = smoothstep(clamp(Math.abs(m.vx) / 0.7));
      desired = lerp(tyaw, Math.sign(m.vx || 1) * 1.05, mv);
    } else if (phase === 'falling') {
      desired = 0.45 * clamp(y / Math.max(0.01, m.fallStartY));
    }
    const prevYaw = m.yaw;
    m.yaw = dampAngle(m.yaw, desired, phase === 'falling' ? 2.5 : 5, dt);
    m.yawRate = Math.abs(m.yaw - prevYaw) / Math.max(dt, 1e-4);

    // ---- logical state → adapter ------------------------------------------------------------
    const forced =
      phase === 'falling' ? 'Fall' : phase === 'landing' ? 'Land' : xp.character.forced;
    const logical = sm.current.update(dt, { speed: m.speed, yawRate: m.yawRate, forced });
    const a = adapter.current;
    let offsets = { y: 0, pitch: 0, roll: 0, yawSway: 0 };
    if (a) {
      const eff = a.setState(logical);
      a.setLocomotionSpeed(m.speed);
      offsets = a.update(dt, {
        t: m.t,
        vx: m.vx,
        speed: m.speed,
        grounded: y < 0.01,
        reducedMotion,
      });
      xp.character.effective = eff;
    }

    // ---- apply to the scene graph --------------------------------------------------------------
    const mobileScale = xp.viewport.mobile ? 0.82 : 1;
    const sc = mobileScale * xp.debug.scale;
    r.visible = phase !== 'transition' && ui.get().modelReady;
    r.position.set(m.x + xp.debug.dx, y + xp.debug.dy, m.z);
    r.rotation.y = m.yaw + offsets.yawSway;
    r.scale.setScalar(sc);
    mo.position.y = offsets.y - landSpring * 0.12;
    mo.rotation.set(offsets.pitch + landSpring * 0.25, 0, offsets.roll);

    // fade (loader reveal)
    const op = phase === 'loading' ? xp.character.opacity : 1;
    if (Math.abs(op - lastOpacity.current) > 0.002 || (op === 1 && lastOpacity.current !== 1)) {
      lastOpacity.current = op;
      for (const mat of mats.current) {
        const mm = mat as Material & { opacity: number };
        const wantTransparent = op < 0.999;
        if (mm.transparent !== wantTransparent) {
          mm.transparent = wantTransparent;
          mm.needsUpdate = true;
        }
        mm.opacity = op;
      }
    }

    // contact shadow
    const sh = shadow.current;
    if (sh) {
      sh.visible = r.visible;
      sh.position.set(m.x + xp.debug.dx, 0.004, m.z);
      const k = 0.62 * sc * (1 + y * 0.3);
      sh.scale.set(k * 1.25, k * 0.9, 1);
      (sh.material as MeshBasicMaterial).opacity = clamp(0.8 - y * 0.18) * op;
    }

    // ---- publish for debug / UI ---------------------------------------------------------------
    const c = xp.character;
    c.x = r.position.x;
    c.y = r.position.y;
    c.z = r.position.z;
    c.yaw = r.rotation.y;
    c.speed = m.speed;
    c.state = logical;
    c.height = characterConfig.targetHeight * sc;
  });

  return (
    <>
      <group ref={root} visible={false}>
        <group ref={motion}>
          <ErrorBoundary
            onError={() => ui.set({ modelFailed: true, introDone: true, phase: 'journey' })}
          >
            <Suspense fallback={null}>
              <CharacterModel onLoaded={onLoaded} />
            </Suspense>
          </ErrorBoundary>
        </group>
      </group>
      <BlobShadow ref={shadow} />
      <ImpactDust />
    </>
  );
}
