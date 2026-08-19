// env.d.ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

interface ZhitoubaoAppConfig {
  apiBaseUrl?: string;
}

interface Window {
  __ZHITOUBAO_APP_CONFIG__?: ZhitoubaoAppConfig;
  ZhitoubaoBridge?: {
    postMessage(message: string): void;
  };
  flutter_inappwebview?: {
    callHandler?: (name: string, ...args: unknown[]) => void;
  };
  __ZHITOUBAO_NATIVE_RESOLVE__?: (requestId: string, result: unknown) => void;
}

declare module '@nutui/nutui/dist/packages/locale/lang/en-US.js' {
  const lang: Record<string, any>;
  export default lang;
}

declare module '@nutui/nutui/dist/packages/locale/lang/zh-CN.js' {
  const lang: Record<string, any>;
  export default lang;
}

declare module '@nutui/nutui/dist/packages/locale/lang/zh-TW.js' {
  const lang: Record<string, any>;
  export default lang;
}
