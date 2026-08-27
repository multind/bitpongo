import { mount } from '@vue/test-utils';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it } from 'vitest';

import AgreementView from './agreement.vue';

function mountView() {
  return mount(AgreementView, { global: { plugins: [i18n] } });
}

describe('Terms of Service view', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'zh-cn';
  });

  it.each([
    ['zh-cn', '服务条款', '数字资产交易具有高风险'],
    ['zh-tw', '服務條款', '數位資產交易具有高度風險'],
    ['en-us', 'Terms of Service', 'Digital-asset trading is highly risky'],
  ] as const)('renders all sections in %s', (locale, title, riskText) => {
    i18n.global.locale.value = locale;
    const wrapper = mountView();

    expect(wrapper.get('h1').text()).toBe(title);
    expect(wrapper.text()).toContain(riskText);
    expect(wrapper.findAll('section')).toHaveLength(8);
  });
});
