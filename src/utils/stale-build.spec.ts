import { describe, expect, it, vi } from 'vitest';
import { isChunkLoadError, reloadForNewBuild, STALE_BUILD_RELOAD_KEY } from './stale-build';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('stale build recovery', () => {
  it('reloads once and records the time', () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    expect(reloadForNewBuild(storage, reload, 100_000)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    expect(storage.getItem(STALE_BUILD_RELOAD_KEY)).toBe('100000');
  });

  it('refuses a second reload within ten seconds to avoid a loop', () => {
    const storage = memoryStorage({ [STALE_BUILD_RELOAD_KEY]: '100000' });
    const reload = vi.fn();
    expect(reloadForNewBuild(storage, reload, 105_000)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    expect(reloadForNewBuild(storage, reload, 111_000)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload when session storage is unavailable', () => {
    const reload = vi.fn();
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
    };
    expect(reloadForNewBuild(blocked, reload, 1)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it.each([
    'Failed to fetch dynamically imported module: https://app.imastermind.io/assets/details-abc.js',
    'Importing a module script failed.',
    'error loading dynamically imported module',
    'Unable to preload CSS for /assets/index-abc.css',
  ])('recognizes chunk load failures: %s', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it('ignores unrelated navigation errors', () => {
    expect(isChunkLoadError(new Error('Navigation cancelled'))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});
