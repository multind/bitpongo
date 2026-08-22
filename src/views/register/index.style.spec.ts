import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/views/register/index.vue'), 'utf8');

describe('registration view styles', () => {
  it('keeps readable rem typography and visible field boundaries', () => {
    expect(source).toMatch(/h1\s*\{[^}]*font-size:\s*1\.625rem/s);
    expect(source).toMatch(/\.subtitle[^}]*font-size:\s*1rem/s);
    expect(source).toMatch(/\.form\s*\{[^}]*margin:\s*2\.5rem 0/s);
    expect(source).toMatch(/\.register-field\s*\{[^}]*border:\s*0\.0625rem solid #d8d8d8/s);
    expect(source).toMatch(/--nut-cell-box-shadow:\s*0 0\.0625rem 0\.4375rem rgb\(237 238 241\)/s);
    expect(source).toMatch(/&:focus-within\s*\{/);
    expect(source).toMatch(/\.agreement-row\s*\{[^}]*font-size:\s*0\.875rem/s);
  });
});
