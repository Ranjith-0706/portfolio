/**
 * CharacterAssetConfig — the single place that describes the protagonist's asset.
 *
 * Swapping the character should only require editing this file (or setting
 * NEXT_PUBLIC_CHARACTER_URL) and dropping a new GLB in /public/models.
 * See docs/CHARACTER_REPLACEMENT.md for the full contract.
 */

export const LOGICAL_STATES = [
  'Idle',
  'Walk',
  'Run',
  'Turn',
  'Fall',
  'Land',
  'StandUp',
  'Sit',
  'LaptopOpen',
  'LaptopClose',
  'Typing',
  'Wave',
  'LookAtCamera',
] as const;
export type LogicalState = (typeof LOGICAL_STATES)[number];

export type Vec3 = [number, number, number];

export interface CharacterAssetConfig {
  id: string;
  /** Model currently in use. */
  url: string;
  /** Where the rigged/animated replacement is expected to live. */
  futureUrl: string;
  /**
   * 'bbox-height': auto-scale so the model's bounding-box height equals `targetHeight`
   * and re-pivot it so its feet sit on y=0 (handles any source scale).
   * 'none': trust the file's own units (then `scale` is applied as-is).
   */
  normalize: 'bbox-height' | 'none';
  /** World-space height of the character (scene units). Hero camera framing assumes ~1. */
  targetHeight: number;
  /** Extra uniform multiplier after normalisation (per-model tweak). */
  scale: number;
  /** Yaw (radians) that makes the model's *front* face +Z (toward the default camera). */
  rotationYOffset: number;
  /** Lift/sink after normalisation, in world units (e.g. -0.01 if shoes clip the floor). */
  groundOffset: number;
  /** Root pivot used for rotation/translation. 'feet' = bottom-centre of the bbox. */
  pivot: 'feet' | 'center' | Vec3;
  /**
   * Logical state -> ordered list of candidate clip names (case-insensitive; a string is matched
   * as an exact name first, then as a substring). The first match wins. Sections and timelines only
   * ever speak in *logical* states — never in clip or bone names.
   */
  animationMap: Record<LogicalState, string[]>;
  /** Clip playback options per logical state. */
  playback: Partial<Record<LogicalState, { loop: 'repeat' | 'once'; timeScale?: number }>>;
  crossFadeSeconds: number;
  /**
   * Manual capability overrides. Leave empty to auto-detect from the clips actually present
   * in the GLB. `skeletal: false` forces procedural mode even if clips exist.
   */
  capabilities?: Partial<Record<'skeletal', boolean>>;
  /** Interaction anchors, expressed in the NORMALISED character's local space (feet = origin). */
  interaction: {
    /** Where the laptop sits relative to the character root when working/standing. */
    laptopOffset: Vec3;
    laptopYaw: number;
    /** Root offset applied while in the Sit state (lowers the root onto the floor). */
    sitRootOffset: Vec3;
  };
}

export const characterConfig: CharacterAssetConfig = {
  id: 'baby-developer-static-v1',
  url: process.env.NEXT_PUBLIC_CHARACTER_URL || '/models/character_high.glb',
  futureUrl: '/models/character_animated.glb',
  normalize: 'bbox-height',
  targetHeight: 1,
  scale: 1,
  rotationYOffset: 0,
  groundOffset: 0,
  pivot: 'feet',
  animationMap: {
    Idle: ['idle', 'breath', 'stand'],
    Walk: ['walk'],
    Run: ['run', 'jog'],
    Turn: ['turn'],
    Fall: ['fall', 'drop'],
    Land: ['land', 'impact'],
    StandUp: ['standup', 'stand_up', 'getup', 'get_up'],
    Sit: ['sit'],
    LaptopOpen: ['laptopopen', 'laptop_open', 'openlaptop', 'open'],
    LaptopClose: ['laptopclose', 'laptop_close', 'closelaptop', 'close'],
    Typing: ['typing', 'type'],
    Wave: ['wave', 'greet'],
    LookAtCamera: ['lookat', 'look_at', 'lookcamera'],
  },
  playback: {
    Idle: { loop: 'repeat' },
    Walk: { loop: 'repeat' },
    Run: { loop: 'repeat' },
    Typing: { loop: 'repeat' },
    Sit: { loop: 'repeat' },
    LookAtCamera: { loop: 'repeat' },
    Turn: { loop: 'once' },
    Fall: { loop: 'once' },
    Land: { loop: 'once' },
    StandUp: { loop: 'once' },
    LaptopOpen: { loop: 'once' },
    LaptopClose: { loop: 'once' },
    Wave: { loop: 'once' },
  },
  crossFadeSeconds: 0.35,
  interaction: {
    laptopOffset: [0.55, 0, 0.35],
    laptopYaw: -0.7,
    sitRootOffset: [0, -0.04, 0],
  },
};
