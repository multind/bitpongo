import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NoticeView from './index.vue';

const mocks = vi.hoisted(() => ({
  getBarkSetting: vi.fn(),
  saveBarkSetting: vi.fn(),
  deleteBarkSetting: vi.fn(),
  testBarkSetting: vi.fn(),
  success: vi.fn(),
  fail: vi.fn(),
  showDialog: vi.fn(),
}));

vi.mock('@/api', () => ({
  getBarkSetting: mocks.getBarkSetting,
  saveBarkSetting: mocks.saveBarkSetting,
  deleteBarkSetting: mocks.deleteBarkSetting,
  testBarkSetting: mocks.testBarkSetting,
}));

vi.mock('@/mobile/app-context', () => ({
  getAppContext: () => ({ locale: 'zh-cn', timeZone: 'Asia/Shanghai', timeZoneOffsetMinutes: 480 }),
}));

vi.mock('@nutui/nutui', () => ({
  showDialog: mocks.showDialog,
  showToast: { success: mocks.success, fail: mocks.fail },
}));

const NutInputStub = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

const NutButtonStub = defineComponent({
  props: { disabled: Boolean, loading: Boolean },
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
});

const NutSwitchStub = defineComponent({
  props: { modelValue: { type: Boolean, default: false }, disabled: Boolean },
  emits: ['update:modelValue'],
  template:
    '<input type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
});

const examplePushUrl = ['https://api.day.app', 'example'].join('/');

function mountView() {
  return mount(NoticeView, {
    global: {
      plugins: [i18n],
      stubs: {
        'nut-input': NutInputStub,
        'nut-button': NutButtonStub,
        'nut-switch': NutSwitchStub,
      },
    },
  });
}

describe('Bark notification settings view', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'zh-cn';
    vi.clearAllMocks();
    mocks.getBarkSetting.mockResolvedValue({
      configured: false,
      enabled: true,
      masked_push_url: null,
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
      updated_at: null,
    });
    mocks.saveBarkSetting.mockResolvedValue(undefined);
    mocks.deleteBarkSetting.mockResolvedValue(undefined);
    mocks.testBarkSetting.mockResolvedValue({ sent: true });
  });

  it('renders only the Bark settings flow and a secret address input', async () => {
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('Bark 推送');
    for (const removedLabel of [['钉', '钉'].join(''), ['Tele', 'gram'].join(''), ['Em', 'ail'].join('')]) {
      expect(wrapper.text()).not.toContain(removedLabel);
    }
    expect(wrapper.get('[data-test="bark-push-url"]').attributes('type')).toBe('password');
    expect(wrapper.find('[data-test="bark-save"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="bark-test"]').exists()).toBe(true);
  });

  it('saves the input with current locale and App timezone', async () => {
    const wrapper = mountView();
    await flushPromises();
    await wrapper.get('[data-test="bark-push-url"]').setValue(examplePushUrl);
    await wrapper.get('[data-test="bark-save"]').trigger('click');
    await flushPromises();

    expect(mocks.saveBarkSetting).toHaveBeenCalledWith({
      push_url: examplePushUrl,
      enabled: true,
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
    });
  });

  it('tests an unsaved address without persisting it', async () => {
    const wrapper = mountView();
    await flushPromises();
    await wrapper.get('[data-test="bark-push-url"]').setValue(examplePushUrl);
    await wrapper.get('[data-test="bark-test"]').trigger('click');
    await flushPromises();

    expect(mocks.testBarkSetting).toHaveBeenCalledWith({ push_url: examplePushUrl });
    expect(mocks.saveBarkSetting).not.toHaveBeenCalled();
  });

  it('saves a configured target as disabled without replacing its secret address', async () => {
    mocks.getBarkSetting.mockResolvedValue({
      configured: true,
      enabled: true,
      masked_push_url: 'https://api.day.app/****-key',
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
      updated_at: null,
    });
    const wrapper = mountView();
    await flushPromises();
    await wrapper.get('input[type="checkbox"]').setValue(false);
    await wrapper.get('[data-test="bark-save"]').trigger('click');
    await flushPromises();

    expect(mocks.saveBarkSetting).toHaveBeenCalledWith({
      enabled: false,
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
    });
    expect(mocks.saveBarkSetting.mock.calls[0]?.[0]).not.toHaveProperty('push_url');
  });

  it('tests a configured target without sending a replacement secret address', async () => {
    mocks.getBarkSetting.mockResolvedValue({
      configured: true,
      enabled: true,
      masked_push_url: 'https://api.day.app/****-key',
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
      updated_at: null,
    });
    const wrapper = mountView();
    await flushPromises();
    await wrapper.get('[data-test="bark-test"]').trigger('click');
    await flushPromises();

    expect(mocks.testBarkSetting).toHaveBeenCalledWith({});
  });

  it.each([
    ['zh-cn', '显示 Bark 推送地址', '隐藏 Bark 推送地址'],
    ['zh-tw', '顯示 Bark 推播地址', '隱藏 Bark 推播地址'],
    ['en-us', 'Show Bark push URL', 'Hide Bark push URL'],
  ])('exposes the visibility state to assistive technology in %s', async (language, showLabel, hideLabel) => {
    i18n.global.locale.value = language as 'zh-cn' | 'zh-tw' | 'en-us';
    const wrapper = mountView();
    await flushPromises();

    const button = wrapper.get('[data-test="bark-visibility"]');
    expect(button.attributes('aria-label')).toBe(showLabel);
    expect(button.attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('[data-test="bark-push-url"]').attributes('type')).toBe('password');

    await button.trigger('click');

    expect(button.attributes('aria-label')).toBe(hideLabel);
    expect(button.attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('[data-test="bark-push-url"]').attributes('type')).toBe('text');
  });

  it('deletes the configured target only after confirmation', async () => {
    mocks.getBarkSetting.mockResolvedValue({
      configured: true,
      enabled: true,
      masked_push_url: 'https://api.day.app/****-key',
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
      updated_at: null,
    });
    const wrapper = mountView();
    await flushPromises();
    await wrapper.get('[data-test="bark-remove"]').trigger('click');

    const dialog = mocks.showDialog.mock.calls[0]?.[0];
    expect(dialog?.title).toBe('删除 Bark 配置');
    expect(mocks.deleteBarkSetting).not.toHaveBeenCalled();
    await dialog.onOk();
    await flushPromises();
    expect(mocks.deleteBarkSetting).toHaveBeenCalledOnce();
  });
});
