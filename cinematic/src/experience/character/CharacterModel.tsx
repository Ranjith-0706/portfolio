'use client';
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Group, Mesh, SkinnedMesh, Vector3, type AnimationClip, type Material, type MeshStandardMaterial } from 'three';
import { characterConfig, type CharacterAssetConfig } from './character.config';

export interface CharacterLoadInfo {
  scene: Group;
  clips: AnimationClip[];
  triangles: number;
  materials: Material[];
  /** Size of the source model's bounding box, before normalisation. */
  sourceSize: Vector3;
  skinned: boolean;
}

interface Props {
  config?: CharacterAssetConfig;
  onLoaded?: (info: CharacterLoadInfo) => void;
}

/**
 * CharacterModel — loads the GLB once and normalises it using its bounding box:
 *  - uniformly scaled so its height == config.targetHeight (when normalize === 'bbox-height')
 *  - re-pivoted so the configured pivot (feet by default) is the local origin
 *  - yaw-corrected so its front faces +Z
 * Nothing in here depends on the mesh or on clip names, so a rigged replacement drops in unchanged.
 */
export function CharacterModel({ config = characterConfig, onLoaded }: Props) {
  const gltf = useGLTF(config.url);

  const { wrapper, info } = useMemo(() => {
    const scene = gltf.scene as Group;
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    const s = (config.normalize === 'bbox-height' ? config.targetHeight / Math.max(size.y, 1e-6) : 1) * config.scale;

    // Local pivot in *source* units
    let px = center.x;
    let py = box.min.y;
    let pz = center.z;
    if (config.pivot === 'center') py = center.y;
    else if (Array.isArray(config.pivot)) [px, py, pz] = config.pivot;

    const wrapper = new Group();
    wrapper.name = 'character-normalised';
    wrapper.rotation.y = config.rotationYOffset;
    scene.scale.setScalar(s);
    scene.position.set(-px * s, -py * s + config.groundOffset, -pz * s);
    wrapper.add(scene);

    let triangles = 0;
    let skinned = false;
    const materials = new Set<Material>();
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      if ((o as SkinnedMesh).isSkinnedMesh) skinned = true;
      const g = m.geometry;
      triangles += g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3;
      m.castShadow = true;
      m.receiveShadow = false;
      m.frustumCulled = !skinned;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        materials.add(mat);
        const std = mat as MeshStandardMaterial;
        if (std.map) std.map.anisotropy = 4;
        if ('envMapIntensity' in std) std.envMapIntensity = 0.6;
      }
    });

    const info: CharacterLoadInfo = {
      scene,
      clips: gltf.animations ?? [],
      triangles: Math.round(triangles),
      materials: [...materials],
      sourceSize: size,
      skinned,
    };
    return { wrapper, info };
  }, [gltf, config]);

  useLayoutEffect(() => {
    onLoaded?.(info);
  }, [info, onLoaded]);

  return <primitive object={wrapper} />;
}

useGLTF.preload(characterConfig.url);
