import { afterAll, describe, expect, it } from 'vitest';
import { i18n, isSupportedLocale, setLang, supportedLocales } from './index';

afterAll(() => {
  localStorage.clear();
  setLang();
});

describe('released languages', () => {
  it('offers all fifteen languages in the language menu', () => {
    expect(supportedLocales).toHaveLength(15);
  });

  it.each(['ar', 'de', 'es-es', 'es-mx', 'fr', 'id', 'it', 'ja', 'ko', 'pt-br', 'th', 'vi'])(
    'loads the %s catalog as a saved locale',
    (locale) => {
      expect(isSupportedLocale(locale)).toBe(true);
      setLang(locale);
      expect(i18n.global.locale.value).toBe(locale);
      expect(localStorage.getItem('lang')).toBe(locale);
      expect(Object.keys(i18n.global.getLocaleMessage(locale))).not.toHaveLength(0);
      expect(i18n.global.t('security.resend', { seconds: 73 })).toContain('73');
    },
  );

  it('renders Arabic in RTL and restores LTR when changing language', () => {
    setLang('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(i18n.global.t('login.submit')).toBe('تسجيل الدخول');
    setLang('en-us');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en-US');
  });
});
