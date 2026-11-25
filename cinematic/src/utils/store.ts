'use client';
import { useSyncExternalStore } from 'react';

/** Minimal external store for LOW-frequency UI state (phase, active section, quality…). */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(partial: Partial<T>) {
      let changed = false;
      for (const k of Object.keys(partial) as (keyof T)[]) if (state[k] !== partial[k]) changed = true;
      if (!changed) return;
      state = { ...state, ...partial };
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

export type Store<T extends object> = ReturnType<typeof createStore<T>>;

export function useStore<T extends object, S>(store: Store<T>, selector: (s: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}
