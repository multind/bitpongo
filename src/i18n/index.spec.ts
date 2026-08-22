import { afterEach, describe, expect, it } from 'vitest';

import { currentLocale, i18n, isSupportedLocale, savedLocale, setLang } from './index';

afterEach(() => {
  localStorage.clear();
  setLang();
});

describe('i18n locale priority', () => {
  it('uses an App locale as a non-persistent default', () => {
    setLang('en-us', false);

    expect(i18n.global.locale.value).toBe('en-us');
    expect(localStorage.getItem('lang')).toBeNull();
  });

  it('keeps a valid manually saved locale ahead of the App default', () => {
    localStorage.setItem('lang', 'zh-tw');

    expect(savedLocale()).toBe('zh-tw');
    expect(currentLocale('en-us')).toBe('zh-tw');
    setLang('en-us', false);
    expect(i18n.global.locale.value).toBe('zh-tw');
  });

  it('ignores invalid saved and App locale values', () => {
    localStorage.setItem('lang', 'fr-fr');

    expect(savedLocale()).toBeNull();
    expect(currentLocale('fr-fr')).toBe('zh-cn');
    expect(isSupportedLocale('fr-fr')).toBe(false);
  });

  it('persists only a supported manual selection', () => {
    setLang('en-us', true);
    expect(localStorage.getItem('lang')).toBe('en-us');

    setLang('fr-fr', true);
    expect(localStorage.getItem('lang')).toBe('en-us');
  });
});
