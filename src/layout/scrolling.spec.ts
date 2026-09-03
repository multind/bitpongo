// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('app page scrolling', () => {
  it('lets the WebView own vertical scrolling so native pull-to-refresh can detect the page position', () => {
    const layout = readFileSync(resolve(process.cwd(), 'src/layout/index.vue'), 'utf8');
    const mainPageRule = layout.match(/\.main-page\s*\{(?<rule>[\s\S]*?)\}/)?.groups?.rule ?? '';
    const tabbarRule = layout.match(/\.tabbar\s*\{(?<rule>[\s\S]*?)\}/)?.groups?.rule ?? '';

    expect(mainPageRule).toContain('min-height: calc(100vh - 110px)');
    expect(mainPageRule).not.toMatch(/(?:^|\n)\s*height\s*:/);
    expect(mainPageRule).not.toMatch(/\boverflow(?:-y)?\s*:/);
    expect(tabbarRule).not.toMatch(/(?:^|\n)\s*height\s*:/);
  });
});
