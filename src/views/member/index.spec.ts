import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/store/modules/user';
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

const PopupStub = defineComponent({
  props: { visible: Boolean },
  template: '<section v-if="visible" data-test="language-popup"><slot /></section>',
});

function mountMemberView(userInfo: { name?: string; email?: string } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setInfo(userInfo);

  return mount(MemberView, {
    global: {
      plugins: [pinia, i18n],
      stubs: {
        'nut-button': ButtonStub,
        'nut-popup': PopupStub,
        'nut-avatar': { template: '<div><slot /></div>' },
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
  beforeEach(() => {
    mocks.push.mockReset();
    i18n.global.locale.value = 'zh-cn';
  });

  it('renders the welcome card and three core capabilities', () => {
    const wrapper = mountMemberView();

    expect(wrapper.get('[data-test="guest-welcome"]').text()).toContain('让自动化交易更简单');
    expect(wrapper.findAll('[data-test="guest-feature"]')).toHaveLength(3);
    expect(wrapper.text()).toContain('自动化策略');
    expect(wrapper.text()).toContain('安全连接交易所');
    expect(wrapper.text()).toContain('实时运行提醒');
  });

  it('opens login and registration from distinct actions', async () => {
    const wrapper = mountMemberView();

    await wrapper.get('[data-test="guest-login"]').trigger('click');
    await wrapper.get('[data-test="guest-register"]').trigger('click');

    expect(mocks.push).toHaveBeenNthCalledWith(1, '/login');
    expect(mocks.push).toHaveBeenNthCalledWith(2, '/register');
  });

  it('opens the language popup with all three supported languages', async () => {
    const wrapper = mountMemberView();

    expect(wrapper.find('[data-test="language-popup"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="guest-language"]').text()).toContain('语言');

    await wrapper.get('[data-test="guest-language"]').trigger('click');

    const popup = wrapper.get('[data-test="language-popup"]');
    expect(popup.text()).toContain('简体中文');
    expect(popup.text()).toContain('繁體中文');
    expect(popup.text()).toContain('English');
  });

  it('keeps the authenticated member view instead of replacing it with guest content', () => {
    const wrapper = mountMemberView({ name: 'Member', email: 'member@example.com' });

    expect(wrapper.text()).toContain('me***@example.com');
    expect(wrapper.find('[data-test="guest-welcome"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="guest-login"]').exists()).toBe(false);
  });
});
