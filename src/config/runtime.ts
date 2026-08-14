function normalizeApiBaseUrl(value: unknown): string | null {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error('API 地址无效');
  }

  const candidate = value.trim();
  if (/^\/(?!\/)/.test(candidate)) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return candidate;
    }
  } catch {
    // The common error below intentionally avoids exposing the supplied value.
  }
  throw new Error('API 地址无效');
}

export function resolveApiBaseUrl(runtimeValue: unknown, viteValue: unknown): string {
  const runtimeUrl = normalizeApiBaseUrl(runtimeValue);
  if (runtimeUrl) {
    return runtimeUrl;
  }

  const viteUrl = normalizeApiBaseUrl(viteValue);
  if (viteUrl) {
    return viteUrl;
  }
  throw new Error('API 地址无效');
}

const runtimeValue = typeof window === 'undefined' ? undefined : window.__ZHITOUBAO_APP_CONFIG__?.apiBaseUrl;

export const runtimeConfig = {
  apiBaseUrl: resolveApiBaseUrl(runtimeValue, import.meta.env.VITE_URL_PREFIX),
};
