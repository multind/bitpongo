import { describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from './runtime';

describe('resolveApiBaseUrl', () => {
  it('prefers a valid runtime URL', () => {
    expect(resolveApiBaseUrl('https://api.example.com', '/api')).toBe('https://api.example.com');
  });

  it('falls back to the Vite value', () => {
    expect(resolveApiBaseUrl(undefined, '/api')).toBe('/api');
  });

  it('trims a valid URL', () => {
    expect(resolveApiBaseUrl(' https://api.example.com ', '/api')).toBe('https://api.example.com');
  });

  it.each(['javascript:alert(1)', '//evil.example.com'])('rejects unsafe value %s', (value) => {
    expect(() => resolveApiBaseUrl(value, '/api')).toThrow('API 地址无效');
  });
});
