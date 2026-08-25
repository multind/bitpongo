import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/store/modules/user';
import RegisterView from './index.vue';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  toastHide: vi.fn(),
  showToastLoading: vi.fn(() => ({ hide: vi.fn() })),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
  };
});

vi.mock('@nutui/nutui', () => ({
  showToast: { loading: mocks.showToastLoading },
}));

const NutInputStub = defineComponent({
  inheritAttrs: false,
  props: { modelValue: { type: String, default: '' }, type: { type: String, default: 'text' } },
  emits: ['update:modelValue'],
  template: '<input v-bind="$attrs" :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

const NutCheckboxStub = defineComponent({
  inheritAttrs: false,
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  template: '<input v-bind="$attrs" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
});

const NutButtonStub = defineComponent({
  inheritAttrs: false,
  props: { disabled: Boolean, loading: Boolean },
  emits: ['click'],
  template: '<button v-bind="$attrs" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
});

const NutFormItemStub = defineComponent({
  inheritAttrs: false,
  props: { label: { type: String, default: '' } },
  template: '<div v-bind="$attrs"><span v-if="label" class="stub-label">{{ label }}</span><slot /></div>',
});

function mountView() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useUserStore();
  const wrapper = mount(RegisterView, {
    global: {
      plugins: [pinia, i18n],
      stubs: {
        'nut-form': { template: '<form><slot /></form>' },
        'nut-input': NutInputStub,
        'nut-checkbox': NutCheckboxStub,
        'nut-button': NutButtonStub,
        'nut-form-item': NutFormItemStub,
      },
    },
  });
  return { store, wrapper };
}

async function completeForm(wrapper: VueWrapper) {
  await wrapper.get('[data-test="register-name"]').setValue('新用户');
  await wrapper.get('[data-test="register-email"]').setValue('new@example.com');
  await wrapper.get('[data-test="register-password"]').setValue('abc12345');
  await wrapper.get('[data-test="register-confirm-password"]').setValue('abc12345');
  await wrapper.get('[data-test="register-agreement"]').setValue(true);
}

describe('registration view', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.push.mockReset();
    mocks.showToastLoading.mockClear();
  });

  it('renders four visible localized field labels', () => {
    const { wrapper } = mountView();
    const fields = wrapper.findAll('.register-field');

    expect(fields).toHaveLength(4);
    expect(fields.map((field) => field.find('.stub-label').text())).toEqual(['昵称', '邮箱', '密码', '确认密码']);
  });

  it('requires a matching strong password and agreement', async () => {
    const { wrapper } = mountView();
    const button = wrapper.get('[data-test="register-submit"]');

    expect(button.attributes('disabled')).toBeDefined();
    await completeForm(wrapper);
    expect(button.attributes('disabled')).toBeUndefined();
    await wrapper.get('[data-test="register-confirm-password"]').setValue('different1');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('toggles agreement from the whole row without changing it when opening the terms', async () => {
    const { wrapper } = mountView();
    const row = wrapper.find('[data-test="register-agreement-row"]');

    expect(row.exists()).toBe(true);
    const checkbox = wrapper.get('[data-test="register-agreement"]');
    expect((checkbox.element as HTMLInputElement).checked).toBe(false);

    await row.trigger('click');
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);

    await row.trigger('click');
    expect((checkbox.element as HTMLInputElement).checked).toBe(false);

    await row.trigger('keydown', { key: ' ' });
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);

    await wrapper.get('[data-test="register-agreement-link"]').trigger('click');
    expect(mocks.push).toHaveBeenCalledWith('/agreement');
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });

  it('keeps the agreement checkbox close to its text', () => {
    const { wrapper } = mountView();
    const row = wrapper.get('[data-test="register-agreement-row"]');
    const checkbox = wrapper.get('[data-test="register-agreement"]');
    const rowStyle = (row.element as HTMLElement).style;
    const checkboxStyle = (checkbox.element as HTMLElement).style;

    expect(rowStyle.gap).toBe('0.25rem');
    expect(checkboxStyle.getPropertyValue('--nut-checkbox-margin-right').trim()).toBe('0');
  });

  it('registers and enters the member page', async () => {
    const { store, wrapper } = mountView();
    const register = vi.spyOn(store, 'register').mockResolvedValue({
      token: 'token',
      info: { id: 8, name: '新用户', email: 'new@example.com' },
    });
    await completeForm(wrapper);

    await wrapper.get('[data-test="register-submit"]').trigger('click');
    await flushPromises();

    expect(register).toHaveBeenCalledWith('新用户', 'new@example.com', 'abc12345');
    expect(mocks.replace).toHaveBeenCalledWith('/member');
  });

  it('shows the backend error and keeps the form for retry', async () => {
    const { store, wrapper } = mountView();
    vi.spyOn(store, 'register').mockRejectedValue(new Error('用户已存在'));
    await completeForm(wrapper);

    await wrapper.get('[data-test="register-submit"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('用户已存在');
    expect(wrapper.get('[data-test="register-email"]').element).toHaveProperty('value', 'new@example.com');
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
