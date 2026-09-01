import { mount } from '@vue/test-utils';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it } from 'vitest';

import PrivacyView from './index.vue';

function mountView() {
  return mount(PrivacyView, {
    global: {
      plugins: [i18n],
    },
  });
}

describe('Privacy policy view', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'zh-cn';
  });

  it('renders the policy in the current language', () => {
    const chinese = mountView();

    expect(chinese.get('h1').text()).toBe('隐私政策');
    expect(chinese.text()).toContain('交易所 API 凭据');

    i18n.global.locale.value = 'en-us';
    const english = mountView();

    expect(english.get('h1').text()).toBe('Privacy Policy');
    expect(english.text()).toContain('exchange API credentials');
  });

  it('provides a public contact link', () => {
    const contact = mountView().get('[data-test="privacy-contact"]');

    expect(contact.attributes('href')).toBe('https://imastermind.io');
    expect(contact.text()).toBe('https://iMastermind.io');
    expect(mountView().text()).toContain('iMastermind.io 网站');
  });
});
