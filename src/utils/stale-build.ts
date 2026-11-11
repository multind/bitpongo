import type { Router } from 'vue-router';

// Shared with the inline entry-script guard in index.html.
export const STALE_BUILD_RELOAD_KEY = 'bitpongo:stale-build-reload';
const RELOAD_WINDOW_MS = 10_000;

/**
 * After a release, an already-open page may request chunks that no longer exist.
 * Reload once to pick up the new build; refuse a second reload within the window so a
 * genuinely broken asset cannot trap the user in a reload loop.
 */
export function reloadForNewBuild(
  storage: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage,
  reload: () => void = () => window.location.reload(),
  now: number = Date.now(),
): boolean {
  try {
    const last = Number(storage.getItem(STALE_BUILD_RELOAD_KEY)) || 0;
    if (now - last < RELOAD_WINDOW_MS) return false;
    storage.setItem(STALE_BUILD_RELOAD_KEY, String(now));
  } catch {
    return false;
  }
  reload();
  return true;
}

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return CHUNK_ERROR.test(message);
}

export function installStaleBuildRecovery(router: Router) {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForNewBuild()) event.preventDefault();
  });
  router.onError((error) => {
    if (isChunkLoadError(error)) reloadForNewBuild();
  });
}
