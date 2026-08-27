import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTimeZonePreference, syncDeviceTimeZone } from '@/api';
import { setDisplayTimeZonePreference } from './app-context';
import { initializeSessionTimeZone, resetSessionTimeZone } from './session-timezone';

vi.mock('@/api', () => ({
  getTimeZonePreference: vi.fn(),
  syncDeviceTimeZone: vi.fn(),
}));

vi.mock('./app-context', () => ({
  getAppContext: () => ({ timeZone: 'America/New_York' }),
  setDisplayTimeZonePreference: vi.fn(),
}));

describe('session timezone lifecycle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('applies a saved preference and synchronizes a followed device without blocking on sync', async () => {
    vi.mocked(getTimeZonePreference).mockResolvedValue({ mode: 'FOLLOW_DEVICE', timezone: null, effective_timezone: 'UTC' });
    vi.mocked(syncDeviceTimeZone).mockResolvedValue(undefined);

    await initializeSessionTimeZone();

    expect(setDisplayTimeZonePreference).toHaveBeenCalledWith('FOLLOW_DEVICE', null);
    expect(syncDeviceTimeZone).toHaveBeenCalledWith('America/New_York');
  });

  it('resets account-specific display state on logout', () => {
    resetSessionTimeZone();
    expect(setDisplayTimeZonePreference).toHaveBeenCalledWith('FOLLOW_DEVICE', null);
  });

  it('ignores a stale preference response after logout', async () => {
    let resolvePreference!: (value: { mode: 'FIXED'; timezone: string; effective_timezone: string }) => void;
    vi.mocked(getTimeZonePreference).mockReturnValue(
      new Promise((resolve) => {
        resolvePreference = resolve;
      }),
    );

    const pending = initializeSessionTimeZone();
    resetSessionTimeZone();
    resolvePreference({ mode: 'FIXED', timezone: 'Asia/Tokyo', effective_timezone: 'Asia/Tokyo' });
    await pending;

    expect(setDisplayTimeZonePreference).toHaveBeenCalledTimes(1);
    expect(setDisplayTimeZonePreference).toHaveBeenCalledWith('FOLLOW_DEVICE', null);
    expect(syncDeviceTimeZone).not.toHaveBeenCalled();
  });
});
