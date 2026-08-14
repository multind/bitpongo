import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/store/modules/user';
import AccountView from './index.vue';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  showDialog: vi.fn(),
  showToastFail: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useRouter: () => ({ replace: mocks.replace }),
  };
});

vi.mock('@nutui/nutui', () => ({
  showDialog: mocks.showDialog,
  showToast: { fail: mocks.showToastFail },
}));

const NutInputStub = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

const NutCheckboxStub = defineComponent({
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
});

const NutButtonStub = defineComponent({
  props: { disabled: Boolean, loading: Boolean },
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
});

function mountView() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useUserStore();
  const wrapper = mount(AccountView, {
    global: {
      plugins: [pinia],
      stubs: {
        'nut-cell': { props: ['title'], template: '<div>{{ title }}<slot name="title" /><slot /></div>' },
        'nut-cell-group': { template: '<div><slot /></div>' },
        'nut-input': NutInputStub,
        'nut-checkbox': NutCheckboxStub,
        'nut-button': NutButtonStub,
      },
    },
  });
  return { store, wrapper };
}

async function completeForm(wrapper: ReturnType<typeof mount>['wrapper']) {
  await wrapper.get('[data-test="account-password"]').setValue('secret');
  await wrapper.get('[data-test="account-confirmation"]').setValue(true);
}

describe('account deletion view', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.showDialog.mockReset();
    mocks.showToastFail.mockReset();
  });

  it('explains every account deletion consequence', () => {
    const { wrapper } = mountView();

    expect(wrapper.text()).toContain('停止全部运行中的策略');
    expect(wrapper.text()).toContain('删除交易所 API 密钥');
    expect(wrapper.text()).toContain('匿名保留历史记录');
  });

  it('requires both a password and explicit acknowledgement', async () => {
    const { wrapper } = mountView();
    const button = wrapper.get('[data-test="delete-account"]');

    expect(button.attributes('disabled')).toBeDefined();
    await wrapper.get('[data-test="account-password"]').setValue('secret');
    expect(button.attributes('disabled')).toBeDefined();
    await wrapper.get('[data-test="account-confirmation"]').setValue(true);
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('keeps the page available for retry when deletion fails', async () => {
    const { store, wrapper } = mountView();
    vi.spyOn(store, 'deleteAccount').mockRejectedValue(new Error('密码错误'));
    await completeForm(wrapper);

    await wrapper.get('[data-test="delete-account"]').trigger('click');
    const dialog = mocks.showDialog.mock.calls[0][0];
    await dialog.onOk();
    await flushPromises();

    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.showToastFail).toHaveBeenCalledWith('密码错误');
    expect(wrapper.get('[data-test="account-password"]').element).toHaveProperty('value', 'secret');
  });

  it('navigates to login only after confirmed deletion succeeds', async () => {
    const { store, wrapper } = mountView();
    const deleteAccount = vi.spyOn(store, 'deleteAccount').mockResolvedValue(undefined);
    await completeForm(wrapper);

    await wrapper.get('[data-test="delete-account"]').trigger('click');
    expect(mocks.showDialog.mock.calls[0][0].title).toBe('确认注销账号');
    expect(deleteAccount).not.toHaveBeenCalled();

    await mocks.showDialog.mock.calls[0][0].onOk();
    await flushPromises();

    expect(deleteAccount).toHaveBeenCalledWith('secret');
    expect(mocks.replace).toHaveBeenCalledWith('/login');
  });
});
