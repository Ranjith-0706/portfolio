import type { CharacterAnimationAdapter } from './CharacterAnimationAdapter';
import type { LogicalState } from './character.config';
import { xp } from '../store';

/**
 * Narrow public surface other systems (loader timeline, contact hooks, debug) use to talk to
 * the character. They request LOGICAL states and ask "is there a real clip?" — never touching
 * clip names or bones.
 */
let adapter: CharacterAnimationAdapter | null = null;

export const characterApi = {
  attach(a: CharacterAnimationAdapter | null) {
    adapter = a;
  },
  /** True only if a real skeletal clip backs this state (procedural fallbacks return false). */
  hasClip: (s: LogicalState) => adapter?.hasClip(s) ?? false,
  clipDuration: (s: LogicalState) => adapter?.clipDuration(s) ?? 0,
  /** Force a logical state (e.g. Sit during the loader). `null` hands control back to locomotion. */
  force(s: LogicalState | null) {
    xp.character.forced = s;
  },
};
