// env.d.ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ZhitoubaoAppConfig {
  apiBaseUrl?: string;
}

interface Window {
  __ZHITOUBAO_APP_CONFIG__?: ZhitoubaoAppConfig;
}
