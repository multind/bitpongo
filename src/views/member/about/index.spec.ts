import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  Object.assign(globalThis, { __APP_VERSION__: '1.0.0', __BUILD_TIME__: '2026-01-01T00:00:00.000Z' });
});

import AboutView from './index.vue';

const NutCellStub = defineComponent({
  props: {
    title: { type: String, default: '' },
    subTitle: { type: String, default: '' },
  },
  template: '<div><span>{{ title }}</span><span>{{ subTitle }}</span></div>',
});

function mountView() {
  return mount(AboutView, {
    global: {
      plugins: [i18n],
      stubs: {
        'nut-row': { template: '<div><slot /></div>' },
        'nut-col': { template: '<div><slot /></div>' },
        'nut-cell-group': { template: '<div><slot /></div>' },
        'nut-cell': NutCellStub,
      },
    },
  });
}

describe('About view', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'en-us';
  });

  it('links the open-source project to its MIT-licensed GitHub repository', () => {
    const wrapper = mountView();
    const sourceLink = wrapper.get('[data-test="about-source"]');

    expect(sourceLink.attributes('href')).toBe('https://github.com/multind/bitpongo');
    expect(sourceLink.text()).toContain('Open Source');
    expect(sourceLink.text()).toContain('MIT License');
    expect(sourceLink.text()).toContain('github.com/multind/bitpongo');
  });

  it('links to the public privacy policy', () => {
    const wrapper = mountView();
    const privacyLink = wrapper.get('[data-test="about-privacy"]');

    expect(privacyLink.attributes('href')).toBe('/privacy');
    expect(privacyLink.text()).toContain('Privacy Policy');
  });
});
