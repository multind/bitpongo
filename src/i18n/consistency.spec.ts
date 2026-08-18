import { describe, expect, it } from 'vitest';

import { lang as enUs } from '@/i18n/lang/en-us';
import { lang as zhCn } from '@/i18n/lang/zh-cn';
import { lang as zhTw } from '@/i18n/lang/zh-tw';

function flattenKeys(target: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(target).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe('i18n language packs', () => {
  it('exposes identical key sets across all locales', () => {
    const keys = {
      'zh-cn': flattenKeys(zhCn).sort(),
      'zh-tw': flattenKeys(zhTw).sort(),
      'en-us': flattenKeys(enUs).sort(),
    };

    expect(keys['zh-tw']).toEqual(keys['zh-cn']);
    expect(keys['en-us']).toEqual(keys['zh-cn']);
  });

  it('keeps weekday arrays the same length in every locale', () => {
    expect(zhCn.frequency.weekDays).toHaveLength(7);
    expect(zhTw.frequency.weekDays).toHaveLength(7);
    expect(enUs.frequency.weekDays).toHaveLength(7);
  });
});
