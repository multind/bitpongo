import { createI18n } from 'vue-i18n';
import { Locale } from '@nutui/nutui';
import enUS from '@nutui/nutui/dist/packages/locale/lang/en-US.js';
import zhCN from '@nutui/nutui/dist/packages/locale/lang/zh-CN.js';
import zhTW from '@nutui/nutui/dist/packages/locale/lang/zh-TW.js';
import idID from '@nutui/nutui/dist/packages/locale/lang/id-ID.js';

export type StableLocaleKey = 'zh-cn' | 'zh-tw' | 'en-us';

const LOCALE_NAMES = {
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  'en-us': 'English',
  'es-mx': 'Español (México)',
  'pt-br': 'Português (Brasil)',
  ja: '日本語',
  ko: '한국어',
  id: 'Bahasa Indonesia',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  ar: 'العربية',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  'es-es': 'Español (España)',
} as const;
export type LocaleKey = keyof typeof LOCALE_NAMES;

const STORAGE_KEY = 'lang';
export const supportedLocales: readonly LocaleKey[] = Object.keys(LOCALE_NAMES) as LocaleKey[];

const NUTUI_LOCALES: Partial<Record<LocaleKey, [string, any]>> = {
  'zh-cn': ['zh-CN', zhCN],
  'zh-tw': ['zh-TW', zhTW],
  'en-us': ['en-US', enUS],
  id: ['id-ID', idID],
};

export function languageName(locale: string) {
  return isSupportedLocale(locale) ? LOCALE_NAMES[locale] : LOCALE_NAMES['en-us'];
}

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

export function isSupportedLocale(value: unknown): value is LocaleKey {
  return typeof value === 'string' && supportedLocales.includes(value as LocaleKey);
}

export function isStableLocale(value: unknown): value is StableLocaleKey {
  return value === 'zh-cn' || value === 'zh-tw' || value === 'en-us';
}

function normalizeLocale(locale?: unknown): LocaleKey {
  return isSupportedLocale(locale) ? locale : 'zh-cn';
}

export function savedLocale(): LocaleKey | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isSupportedLocale(stored) ? stored : null;
}

export function currentLocale(defaultLocale?: unknown): LocaleKey {
  return savedLocale() ?? normalizeLocale(defaultLocale);
}

function applyNutuiLocale(locale: LocaleKey) {
  const [name, pack] = NUTUI_LOCALES[locale] ?? ['en-US', enUS];
  Locale.use(name, pack);
}

export function setLang(locale?: unknown, persist = locale !== undefined) {
  if (persist && isSupportedLocale(locale)) {
    localStorage.setItem(STORAGE_KEY, locale);
  }
  const target = currentLocale(locale);
  i18n.global.locale.value = target;
  document.documentElement.lang = Intl.getCanonicalLocales(target)[0]!;
  document.documentElement.dir = target === 'ar' ? 'rtl' : 'ltr';
  applyNutuiLocale(target);
}

export function switchLang(locale: LocaleKey) {
  setLang(locale, true);
  window.location.reload();
}
