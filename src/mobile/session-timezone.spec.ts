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
});
