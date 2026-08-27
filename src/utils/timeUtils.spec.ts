import { afterEach, describe, expect, it } from 'vitest';

import { setDisplayTimeZonePreference } from '@/mobile/app-context';

import { formatInstant, formatScheduleInstant, parseInstant } from './timeUtils';

afterEach(() => setDisplayTimeZonePreference('FOLLOW_DEVICE', null));

describe('zone-aware time utilities', () => {
  it('formats absolute instants in an explicit IANA zone', () => {
    expect(formatInstant('2026-08-25T13:00:00Z', 'Asia/Shanghai')).toBe('2026-08-25 21:00');
  });

  it('rejects timestamps that have no absolute offset', () => {
    expect(() => parseInstant('2026-08-25T13:00:00')).toThrowError('Absolute timestamp requires Z or an explicit offset');
  });

  it('keeps the strategy schedule zone primary and adds a local secondary value', () => {
    expect(formatScheduleInstant('2026-08-25T13:00:00Z', 'Asia/Shanghai', 'America/New_York')).toEqual({
      primary: '2026-08-25 21:00 Asia/Shanghai',
      secondary: '2026-08-25 09:00 America/New_York',
    });
  });

  it('uses a fixed display preference when no zone is passed', () => {
    setDisplayTimeZonePreference('FIXED', 'Asia/Tokyo');
    expect(formatInstant('2026-08-25T13:00:00Z')).toBe('2026-08-25 22:00');
  });
});
