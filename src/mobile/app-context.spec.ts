import { afterEach, describe, expect, it } from 'vitest';

import { displayTimeZone, getAppContext, initializeAppContext, setDisplayTimeZonePreference } from './app-context';

afterEach(() => {
  localStorage.clear();
  setDisplayTimeZonePreference('FOLLOW_DEVICE', null);
});

const browserFallback = {
  browserTimeZone: () => 'Europe/Paris',
  browserOffsetMinutes: () => 120,
};

describe('App runtime context', () => {
  it('uses valid App locale and refreshes App timezone fields', async () => {
    localStorage.setItem('timeZone', 'America/New_York');
    localStorage.setItem('timeZoneOffsetMinutes', '-240');

    const context = await initializeAppContext({
      ...browserFallback,
      loadNativeContext: async () => ({
        appVersion: '1.0.0',
        platform: 'ios',
        systemVersion: '18.0',
        safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
        locale: 'zh-tw',
        timeZone: 'Asia/Taipei',
        timeZoneOffsetMinutes: 480,
      }),
    });

    expect(context).toEqual({
      locale: 'zh-tw',
      timeZone: 'Asia/Taipei',
      timeZoneOffsetMinutes: 480,
    });
    expect(localStorage.getItem('timeZone')).toBe('Asia/Taipei');
    expect(localStorage.getItem('timeZoneOffsetMinutes')).toBe('480');
    expect(getAppContext()).toEqual(context);
  });

  it('falls back per field when an old App omits the additions', async () => {
    const context = await initializeAppContext({
      ...browserFallback,
      loadNativeContext: async () => ({
        appVersion: '0.9.0',
        platform: 'android',
        systemVersion: '15',
        safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      }),
    });

    expect(context).toEqual({
      locale: undefined,
      timeZone: 'Europe/Paris',
      timeZoneOffsetMinutes: 120,
    });
  });

  it('ignores invalid native fields and survives bridge rejection', async () => {
    const invalid = await initializeAppContext({
      ...browserFallback,
      loadNativeContext: async () => ({
        appVersion: '1.0.0',
        platform: 'ios',
        systemVersion: '18.0',
        safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
        locale: 'fr-fr' as never,
        timeZone: '   ',
        timeZoneOffsetMinutes: Number.NaN,
      }),
    });
    expect(invalid).toEqual({
      locale: undefined,
      timeZone: 'Europe/Paris',
      timeZoneOffsetMinutes: 120,
    });

    await expect(
      initializeAppContext({
        ...browserFallback,
        loadNativeContext: async () => Promise.reject(new Error('bridge failed')),
      }),
    ).resolves.toEqual({
      locale: undefined,
      timeZone: 'Europe/Paris',
      timeZoneOffsetMinutes: 120,
    });
  });

  it('resolves a fixed display preference before the device zone', async () => {
    await initializeAppContext({
      ...browserFallback,
      loadNativeContext: async () => null,
    });
    setDisplayTimeZonePreference('FIXED', 'Asia/Tokyo');
    expect(displayTimeZone()).toBe('Asia/Tokyo');

    setDisplayTimeZonePreference('FOLLOW_DEVICE', null);
    expect(displayTimeZone()).toBe('Europe/Paris');
  });
});
