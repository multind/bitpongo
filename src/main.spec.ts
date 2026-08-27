import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8');

describe('application bootstrap', () => {
  it('initializes App context before creating and mounting Vue', () => {
    const initializeIndex = source.indexOf('await initializeAppContext()');
    const createIndex = source.indexOf('const app = createApp(App)');
    const mountIndex = source.indexOf("app.mount('#app')");

    expect(initializeIndex).toBeGreaterThan(-1);
    expect(initializeIndex).toBeLessThan(createIndex);
    expect(createIndex).toBeLessThan(mountIndex);
    expect(source).toContain('setLang(context.locale, false)');
  });

  it('mounts before starting authenticated timezone synchronization', () => {
    const mountIndex = source.indexOf("app.mount('#app')");
    const sessionTimeZoneIndex = source.indexOf('initializeSessionTimeZone()');

    expect(sessionTimeZoneIndex).toBeGreaterThan(mountIndex);
  });
});
