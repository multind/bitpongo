import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/views/register/index.vue'), 'utf8');

describe('registration view styles', () => {
  it('keeps readable rem typography and compact agreement spacing', () => {
    expect(source).toMatch(/h1\s*\{[^}]*font-size:\s*1\.625rem/s);
    expect(source).toMatch(/\.subtitle[^}]*font-size:\s*1rem/s);
    expect(source).toMatch(/\.form\s*\{[^}]*margin:\s*2\.5rem 0/s);
    expect(source).toMatch(/:deep\(\.register-field \.nut-form-item__label\)[^}]*font-weight:\s*600/s);
    expect(source).toMatch(/:deep\(\.register-field \.nut-input\)[\s\S]*--nut-input-font-size:\s*1rem/s);
    expect(source).toContain('style="gap: 0.25rem"');
    expect(source).toMatch(/\.agreement-row\s*\{[^}]*font-size:\s*0\.825rem/s);
  });
});
