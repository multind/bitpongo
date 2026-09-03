// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('production browser compatibility', () => {
  it('targets the Android WebView version supported by the mobile app', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.mts'), 'utf8');

    expect(config).toContain("target: 'chrome80'");
  });
});
