import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MemberView from './index.vue';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual as object), useRouter: () => ({ push: mocks.push }) };
});

vi.mock('@nutui/nutui', () => ({ showDialog: vi.fn() }));

const ButtonStub = defineComponent({
  inheritAttrs: false,
  emits: ['click'],
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
});

function mountGuestView() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(MemberView, {
    global: {
      plugins: [pinia, i18n],
      stubs: {
        'nut-button': ButtonStub,
        'nut-popup': { template: '<div><slot /></div>' },
        'nut-row': { template: '<div><slot /></div>' },
        'nut-col': { template: '<div><slot /></div>' },
        'nut-cell-group': { template: '<div><slot /></div>' },
        'nut-cell': { template: '<button><slot name="icon" /><slot />{{ title }}</button>', props: ['title'] },
        Setting: true,
        Link: true,
        Notice: true,
        Message: true,
      },
    },
  });
}

describe('guest member view', () => {
  beforeEach(() => mocks.push.mockReset());

  it('renders the welcome card and three core capabilities', () => {
    const wrapper = mountGuestView();

    expect(wrapper.get('[data-test="guest-welcome"]').text()).toContain('让自动化交易更简单');
    expect(wrapper.findAll('[data-test="guest-feature"]')).toHaveLength(3);
    expect(wrapper.text()).toContain('自动化策略');
    expect(wrapper.text()).toContain('安全连接交易所');
    expect(wrapper.text()).toContain('实时运行提醒');
  });

  it('opens login and registration from distinct actions', async () => {
    const wrapper = mountGuestView();

    await wrapper.get('[data-test="guest-login"]').trigger('click');
    await wrapper.get('[data-test="guest-register"]').trigger('click');

    expect(mocks.push).toHaveBeenNthCalledWith(1, '/login');
    expect(mocks.push).toHaveBeenNthCalledWith(2, '/register');
  });

  it('keeps a visible language action', async () => {
    const wrapper = mountGuestView();
    expect(wrapper.get('[data-test="guest-language"]').text()).toContain('语言');
  });
});
