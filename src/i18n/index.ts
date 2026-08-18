import { createI18n } from 'vue-i18n';
import { Locale } from '@nutui/nutui';
import enUS from '@nutui/nutui/dist/packages/locale/lang/en-US.js';
import zhCN from '@nutui/nutui/dist/packages/locale/lang/zh-CN.js';
import zhTW from '@nutui/nutui/dist/packages/locale/lang/zh-TW.js';

export type LocaleKey = 'zh-cn' | 'zh-tw' | 'en-us';

const STORAGE_KEY = 'lang';
const SUPPORTED: LocaleKey[] = ['zh-cn', 'zh-tw', 'en-us'];

const NUTUI_LOCALES: Record<LocaleKey, [string, any]> = {
  'zh-cn': ['zh-CN', zhCN],
  'zh-tw': ['zh-TW', zhTW],
  'en-us': ['en-US', enUS],
};

export function loadLang() {
  const modules: Record<string, any> = import.meta.glob('./lang/*.ts', { eager: true });
  const langs: Record<string, any> = {};

  for (const path in modules) {
    const name = path.replace(/(\.\/lang\/|\.ts)/g, '');
    const lang = modules[path].lang;
    if (lang) {
      langs[name] = lang;
    }
  }
  return langs;
}

export const i18n = createI18n({
  // globalInjection: true,
  legacy: false,
  locale: 'zh-cn',
  fallbackLocale: 'zh-cn',
  messages: loadLang(),
});

function normalizeLocale(locale?: string | null): LocaleKey {
  if (locale && SUPPORTED.includes(locale as LocaleKey)) {
    return locale as LocaleKey;
  }
  return 'zh-cn';
}

export function currentLocale(): LocaleKey {
  return normalizeLocale(localStorage.getItem(STORAGE_KEY));
}

function applyNutuiLocale(locale: LocaleKey) {
  const [name, pack] = NUTUI_LOCALES[locale];
  Locale.use(name, pack);
}

export function setLang(locale?: string) {
  if (locale) {
    localStorage.setItem(STORAGE_KEY, locale);
  }
  const target = currentLocale();
  i18n.global.locale.value = target;
  applyNutuiLocale(target);
}

export function switchLang(locale: LocaleKey) {
  setLang(locale);
  window.location.reload();
}
