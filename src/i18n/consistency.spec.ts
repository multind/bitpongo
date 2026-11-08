import { describe, expect, it } from 'vitest';

const packs = Object.entries(
  import.meta.glob<Record<string, unknown>>(['./lang/*.ts', '!./lang/lang-base.ts'], { eager: true, import: 'lang' }),
).map(([path, pack]) => [path.replace('./lang/', '').replace('.ts', ''), pack] as const);

function flatten(target: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(target).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        return Object.entries(flatten(value as Record<string, unknown>, path));
      }
      return [[path, value]];
    }),
  );
}

const source = flatten(packs.find(([locale]) => locale === 'en-us')![1]);
const placeholders = (message: string) => [...new Set(message.match(/\{[\w-]+\}/g) ?? [])].sort();

describe('i18n language packs', () => {
  it.each(packs)('%s preserves every key and interpolation placeholder', (locale, pack) => {
    const messages = flatten(pack);
    expect(Object.keys(messages).sort()).toEqual(Object.keys(source).sort());
    for (const [key, value] of Object.entries(messages)) {
      if (typeof source[key] !== 'string') continue;
      expect(typeof value, `${locale}:${key}`).toBe('string');
      expect(placeholders(value as string), `${locale}:${key}`).toEqual(placeholders(source[key]));
    }
  });
  it.each(packs)('%s provides seven weekday labels', (_locale, pack) => {
    expect((flatten(pack)['frequency.weekDays'] as string).split(',')).toHaveLength(7);
  });
});
