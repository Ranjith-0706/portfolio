/**
 * Cinematic timeline — the ONLY place that describes where the character, camera and
 * lights are along the scroll journey. Nothing here knows about bones or clip names.
 *
 * Keyframes are anchored to sections: `{ section, vh }` means "the scroll position where
 * <section>'s top edge is `vh` viewport-heights above the viewport top" (i.e. scrollY =
 * sectionTop + vh * innerHeight). Between two keyframes every value is eased with a
 * smoothstep, so the character always starts and ends a leg at rest and never teleports.
 * Scrolling backwards simply samples the same curve in reverse.
 *
 * Character X is expressed as a fraction of the *visible width at the character's depth*
 * (−0.5 = left edge, +0.5 = right edge) so layouts stay correct on any aspect ratio.
 */
export const SECTION_IDS = ['hero', 'about', 'skills', 'experience', 'projects', 'education', 'contact'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_META: Record<SectionId, { label: string; index: string }> = {
  hero: { label: 'Intro', index: '01' },
  about: { label: 'About', index: '02' },
  skills: { label: 'Toolkit', index: '03' },
  experience: { label: 'Experience', index: '04' },
  projects: { label: 'Work', index: '05' },
  education: { label: 'Education', index: '06' },
  contact: { label: 'Contact', index: '07' },
};

export interface Pose {
  /** Character X as fraction of visible width (−0.5…0.5). */
  x: number;
  /** Character depth (world Z). Positive = closer to camera. */
  z: number;
  /** Resting yaw when settled (radians). +yaw turns the front toward +X. */
  yaw: number;
  cam: { x: number; y: number; z: number; tx: number; ty: number; tz: number };
  light: { key: number; keyX: number; rim: number; amb: number; warm: number };
  /** 0…1 visibility of scene props. */
  props: { workstation: number; laptop: number };
}

export interface Keyframe {
  at: { section: SectionId; vh: number };
  pose: Pose;
}

const cam = (x: number, y: number, z: number, tx: number, ty: number, tz = 0) => ({ x, y, z, tx, ty, tz });
const noProps = { workstation: 0, laptop: 0 };

const HERO: Pose = {
  x: 0, z: 0, yaw: 0,
  cam: cam(0, 1.15, 6.2, 0, 1.2),
  light: { key: 1, keyX: -1.4, rim: 0.8, amb: 0.14, warm: 1 },
  props: noProps,
};
const ABOUT_IN: Pose = {
  x: 0.36, z: -0.3, yaw: 0,
  cam: cam(0.3, 1.0, 5.8, 0.1, 0.68),
  light: { key: 0.95, keyX: -1.2, rim: 0.6, amb: 0.12, warm: 0.9 },
  props: noProps,
};
const ABOUT: Pose = {
  x: -0.27, z: 0.25, yaw: 0.55,
  cam: cam(0.5, 0.95, 4.7, 0.4, 0.62),
  light: { key: 1.1, keyX: 1.2, rim: 0.55, amb: 0.14, warm: 1 },
  props: noProps,
};
const SKILLS: Pose = {
  x: 0.2, z: 0.1, yaw: -0.55,
  cam: cam(-0.5, 1.0, 5.0, -0.4, 0.64),
  light: { key: 1.0, keyX: -1.2, rim: 0.8, amb: 0.1, warm: 0.7 },
  props: { workstation: 1, laptop: 0 },
};
const EXPERIENCE: Pose = {
  x: -0.27, z: 0.2, yaw: 0.5,
  cam: cam(0.5, 0.9, 4.9, 0.4, 0.6),
  light: { key: 0.9, keyX: 1.4, rim: 0.5, amb: 0.1, warm: 0.85 },
  props: noProps,
};
const PROJECTS: Pose = {
  x: 0.4, z: -0.4, yaw: -0.45,
  cam: cam(-0.2, 1.1, 6.4, -0.2, 0.7),
  light: { key: 0.8, keyX: -1.6, rim: 0.9, amb: 0.1, warm: 0.55 },
  props: noProps,
};
const EDUCATION: Pose = {
  x: -0.27, z: 0.2, yaw: 0.5,
  cam: cam(0.5, 0.95, 4.9, 0.4, 0.62),
  light: { key: 0.95, keyX: 1.3, rim: 0.55, amb: 0.13, warm: 0.95 },
  props: noProps,
};
const CONTACT: Pose = {
  x: 0, z: 0.5, yaw: 0,
  cam: cam(0, 1.0, 5.9, 0, 1.05),
  light: { key: 1.15, keyX: -0.9, rim: 0.65, amb: 0.16, warm: 1 },
  props: { workstation: 0, laptop: 1 },
};

const k = (section: SectionId, vh: number, pose: Pose): Keyframe => ({ at: { section, vh }, pose });
const withProps = (p: Pose, props: Pose['props']): Pose => ({ ...p, props });

/** Ordered by scroll position. `vh` values describe each leg's start / settle. */
export const KEYFRAMES: Keyframe[] = [
  k('hero', 0, HERO),
  k('hero', 0.5, HERO), // hold at centre while the title is read
  k('about', 0, ABOUT_IN), // right edge → …
  k('about', 0.9, ABOUT), // … → left (settles, faces the content)
  k('skills', 0, ABOUT),
  k('skills', 0.9, SKILLS), // left → right
  k('experience', 0, withProps(SKILLS, SKILLS.props)),
  k('experience', 0.9, withProps({ ...EXPERIENCE }, noProps)), // right → left
  k('projects', 0, EXPERIENCE),
  k('projects', 0.9, PROJECTS), // left → right
  k('education', 0, PROJECTS),
  k('education', 0.9, EDUCATION), // right → left
  k('contact', 0, EDUCATION),
  k('contact', 0.5, CONTACT), // returns to centre (sticky stage gives the scroll runway)
];

/** Loader stage: standing character beside a miniature laptop, tight cinematic framing. */
export const LOADER_STAGE = {
  /** World-space X of the character during the loader (fraction of visible width). */
  charX: -0.13,
  charZ: 0,
  yaw: 0.85, // looks toward the laptop
  cam: cam(0.05, 0.72, 3.5, 0.02, 0.5),
  light: { key: 0.85, keyX: -1.0, rim: 0.6, amb: 0.06, warm: 1 },
};

/**
 * Responsive adaptation applied on top of the sampled pose (portrait phones/tablets).
 * `heroWeight` (1 at the very top → 0 once the hero is scrolled away) lets the hero use a closer,
 * higher-set camera on phones than the content sections do.
 */
export function adaptPose(pose: Pose, aspect: number, heroWeight = 0): Pose {
  if (aspect >= 0.95) return pose;
  const narrow = Math.max(0, Math.min(1, (0.95 - aspect) / 0.55)); // 0 (tablet) → 1 (phone)
  const zFactor = 1 + 0.28 * narrow + (-0.38 * narrow) * heroWeight; // hero: ×0.9, sections: ×1.28
  const tyShift = 0.45 * narrow - 0.75 * narrow * heroWeight; // hero: −0.3, sections: +0.45
  return {
    ...pose,
    x: pose.x * (1 - 0.5 * narrow),
    cam: {
      ...pose.cam,
      z: pose.cam.z * zFactor,
      ty: pose.cam.ty + tyShift,
      y: pose.cam.y + 0.35 * narrow * (1 - heroWeight),
    },
  };
}
