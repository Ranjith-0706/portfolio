import { ui } from './store';
import { scrollToY } from './scroll/scrollApi';

/** Restart the cinematic intro from the very beginning. */
export function replayIntro() {
  scrollToY(0, true);
  const { replayToken } = ui.get();
  ui.set({ phase: 'loading', introDone: false, loaderStatus: 'Setting the stage', replayToken: replayToken + 1 });
}
