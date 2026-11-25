# Replacing the character (static mesh → rigged, animated model)

The site is built so that the protagonist is **data, not code**. Sections and scroll timelines only
speak in *logical states* (`Idle`, `Walk`, `Sit`, `Typing`, …) and in *normalised poses*. They never
mention a mesh, a bone or a clip name. Swapping the model should touch **one config file and one
GLB** — nothing else.

## TL;DR — three steps

1. Export the new character as a GLB and put it in `public/models/` (e.g. `character_animated.glb`).
2. Edit `src/experience/character/character.config.ts`:
   ```ts
   url: '/models/character_animated.glb',   // or set NEXT_PUBLIC_CHARACTER_URL
   ```
   …and adjust `animationMap` if your clip names differ (see below).
3. Run the site, open the debug panel (dev only, backtick key) and check **clips**, **state → effective**
   and **[mode]**. When clips are found the mode flips from `procedural` to `skeletal` by itself.

No section component, timeline keyframe or scroll code needs to change.

## The contract a new model should meet

| Topic | Requirement | Where it is enforced / adjustable |
|---|---|---|
| Format | glTF 2.0 binary (`.glb`). Draco/Meshopt are fine (drei decodes them). | `CharacterModel.tsx` (`useGLTF`) |
| Up axis | **+Y up.** | – |
| Facing | **Front faces +Z** (toward the default camera). If it faces another way, set `rotationYOffset` (radians). | `rotationYOffset` |
| Scale | Any. The model is auto-scaled so its **bounding-box height = `targetHeight`** (default 1 world unit). Use `scale` for a per-model multiplier. | `normalize`, `targetHeight`, `scale` |
| Pivot | Auto-recentred so the **feet-centre of the bounding box is the origin** (`pivot: 'feet'`). Use `'center'` or `[x,y,z]` (source units) for something else. | `pivot` |
| Ground contact | Feet should be at the lowest point of the mesh. Nudge with `groundOffset` if shoes clip the floor. | `groundOffset` |
| Skeleton | Humanoid rig (any bone names — nothing references them). Skinned meshes are supported (`frustumCulled` is disabled automatically). | – |
| Locomotion clips | **In-place** (no root motion). The root is moved by the scroll timeline; clip speed is synced to ground speed. | `setLocomotionSpeed` in the adapter |
| Clip names | Free. Map them to logical states in `animationMap` (exact name first, then substring, case-insensitive; spaces/dots/dashes are treated as `_`). | `animationMap` |
| Loop behaviour | Per state in `playback` (`repeat` or `once`). Looping: Idle, Walk, Run, Typing, Sit, LookAtCamera. One-shot: Turn, Fall, Land, StandUp, LaptopOpen, LaptopClose, Wave. | `playback` |
| Cross-fade | `crossFadeSeconds` (default 0.35 s) between any two states. | `crossFadeSeconds` |
| Laptop interaction | The laptop is a separate procedural prop. Its position relative to the character root and its yaw are config values; tweak so the hands meet the keyboard in `Typing`. | `interaction.laptopOffset`, `interaction.laptopYaw`, `interaction.sitRootOffset` |
| Budget | ≤ ~100k triangles, one material, one 2K texture is comfortable; test on integrated graphics. | – |

### Logical states and what each clip should do

| State | Used by | Clip expectation |
|---|---|---|
| `Idle` | every dwell, settle after scrolling | Subtle breathing loop. **Required** — everything falls back to it. |
| `Walk` / `Run` | travel between sections (speed-based; Run above ~1.6 u/s) | In-place loops. |
| `Turn` | large yaw change while barely moving | Optional one-shot. |
| `Fall` / `Land` | hero entrance (gravity-driven) | `Fall` loops in the air; `Land` plays once on impact. Optional. |
| `StandUp` | after landing / after sitting | Optional one-shot. |
| `Sit` | loader (final pose = sitting on the floor) | Loop of the seated pose (or a sit-down one-shot ending in the pose). |
| `LaptopOpen` / `LaptopClose` | loader, contact | One-shots; the loader waits for the clip's duration. |
| `Typing` | loader, contact | Seated typing loop. |
| `Wave` | contact (goodbye) | One-shot. |
| `LookAtCamera` | hero idle, contact | Optional; falls back to `Idle`. |

**Missing clips never break anything.** Unsupported states fall back along
`STATE_FALLBACK` in `CharacterStateMachine.ts`
(`Run→Walk→Idle`, `Wave→LookAtCamera→Idle`, `Sit/Typing/LaptopOpen→Idle`, …).

## What is temporary and how it is bypassed

Everything that exists *only because the current mesh has no skeleton* lives in two small places:

* `ProceduralMotion.ts` — rigid whole-body motion: a tiny idle breathing bob, a gentle lean into the
  direction of travel, a yaw sway. It deliberately does **not** fake walking (no step-bobbing) and
  never deforms or stretches limbs.
* `FallPhysics.ts` — the hero's gravity fall, soft bounce and landing "give". This is physics for the
  *root*, so it stays valid with a rigged model (the `Fall`/`Land` clips, if present, simply play on top).

`CharacterAnimationAdapter` chooses its back-end **automatically**:

* **skeletal** — if the GLB contains clips that match any logical state → Three.js `AnimationMixer`
  with cross-fading. `ProceduralMotion` is zeroed so the two never fight.
* **procedural** — otherwise (the current `character_high.glb`).

Force procedural even when clips exist with `capabilities: { skeletal: false }`.

## How the loader connects to future clips (no rewrite)

`src/experience/loader/loaderDirector.ts` is a list of steps written purely in logical states:

```
stage lights → place laptop → character appears → Sit → LaptopOpen (+ screen glow) → Typing → handover
```

Each step calls `characterApi.force('<State>')` and then waits for
`characterApi.clipDuration('<State>')` — or a short fallback delay if there is no clip. With the
current static mesh those states fall back to `Idle` and the character simply stands beside the
laptop; with a rigged model the *same code* plays the real sit / open / type sequence.

If your sitting pose needs different framing, change `LOADER_STAGE` in `config/timeline.config.ts`
(character offset, yaw, camera) and `interaction.*` in the character config.

## Verification checklist after swapping

1. `npm run dev`, open the page, press <kbd>`</kbd> for the debug panel.
2. **clips** lists your clip names; **[mode]** shows `skeletal`.
3. Scroll slowly: **state** should go `Idle → Walk → Idle`; **effective** should match (no fallback).
4. Replay the intro: the loader should show Sit → LaptopOpen → Typing.
5. Use the panel's *char scale / x / y* sliders and *cam* sliders to frame him; then copy the final
   numbers into `character.config.ts` (`targetHeight`, `groundOffset`) or the poses in
   `timeline.config.ts`.
6. Check *triangles* and *fps* on integrated graphics; lower `QUALITY_PRESETS` in
   `config/scene.config.ts` if needed.
7. `npm run build` must pass.

## Files you may edit vs. files you should not need to

| Edit | Purpose |
|---|---|
| `src/experience/character/character.config.ts` | model URL, normalisation, clip mapping, interaction offsets |
| `src/config/timeline.config.ts` | where the character / camera / lights are along the scroll (framing tweaks) |
| `public/models/*` | the GLB itself |

| Should not need changes | Why |
|---|---|
| `src/components/sections/*` | they only know about DOM + scroll |
| `src/experience/scroll/*` | converts scroll → pose, character-agnostic |
| `CharacterController.tsx`, `CharacterStateMachine.ts` | work on logical states and the root transform |
