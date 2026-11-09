import { expect, it } from 'vitest';
import { pushLocale } from './push';

it.each([
  ['ar', 'ar'],
  ['de', 'de'],
  ['es-es', 'es-ES'],
  ['es-mx', 'es-MX'],
  ['fr', 'fr'],
  ['id', 'id'],
  ['it', 'it'],
  ['ja', 'ja'],
  ['ko', 'ko'],
  ['pt-br', 'pt-BR'],
  ['th', 'th'],
  ['vi', 'vi'],
  ['zh-cn', 'zh-CN'],
  ['zh-tw', 'zh-TW'],
  ['en-us', 'en-US'],
  ['xx-ZZ', 'en-US'],
  ['constructor', 'en-US'],
])('normalizes %s for notification requests as %s', (input, expected) => {
  expect(pushLocale(input)).toBe(expected);
});
