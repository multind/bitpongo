import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import NotificationMethods from './index.vue';
import { getNotificationChannels, saveNotificationChannels, saveNotificationOrder } from '@/api/notificationChannels';

vi.mock('@/api/notificationChannels', () => ({
  getNotificationChannels: vi.fn(),
  saveNotificationChannels: vi.fn(),
  saveNotificationOrder: vi.fn(),
}));

const channels = {
  bitpongo: { enabled: true, available: true, level: 'ModerateWeak' as const, sequence: 1 },
  email: { enabled: false, available: false, level: 'Weak' as const, sequence: 1 },
  message: { enabled: false, available: false, level: 'ModerateStrong' as const, sequence: 1 },
  call: { enabled: false, available: false, level: 'Strong' as const, sequence: 1 },
  dingding: { enabled: false, available: false, level: 'Moderate' as const, sequence: 1 },
  feishu: { enabled: false, available: false, level: 'Moderate' as const, sequence: 2 },
  telegram: { enabled: false, available: false, level: 'Moderate' as const, sequence: 3 },
  confirmationEnabled: false,
};
let wrapper: ReturnType<typeof mount> | null = null;

beforeEach(() => {
  i18n.global.locale.value = 'en-us';
  vi.mocked(getNotificationChannels).mockResolvedValue(structuredClone(channels));
  vi.mocked(saveNotificationOrder).mockResolvedValue(structuredClone(channels));
  vi.mocked(saveNotificationChannels).mockImplementation(async (update) => ({
    ...structuredClone(channels),
    email: { enabled: update.emailEnabled, available: false, level: 'Weak', sequence: 1 },
    confirmationEnabled: update.confirmationEnabled,
  }));
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.resetAllMocks();
});

describe('notification methods', () => {
  it('replaces the legacy platform placeholders with one Webhook entry', async () => {
    wrapper = mount(NotificationMethods, { global: { plugins: [i18n], stubs: { RouterLink: true } } });
    await flushPromises();
    expect(wrapper.findAll('[data-test="webhook-configure"]')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('DingTalk reminders');
    expect(wrapper.text()).not.toContain('Feishu reminders');
  });
  it('hides perception settings without saving a new channel order', async () => {
    wrapper = mount(NotificationMethods, { global: { plugins: [i18n], stubs: { RouterLink: true } } });
    await flushPromises();
    expect(wrapper.find('#perception-heading').exists()).toBe(false);
    await wrapper.get('[data-test="notification-methods-save"]').trigger('click');
    await flushPromises();
    expect(saveNotificationOrder).not.toHaveBeenCalled();
  });
  it('loads channel preferences and saves toggles in camelCase', async () => {
    wrapper = mount(NotificationMethods, {
      global: { plugins: [i18n], stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Email reminders');
    expect(wrapper.text()).toContain('Not connected');
    expect(wrapper.find('a[href="/member/notice"]').exists()).toBe(true);
    await wrapper.get('input[aria-label="Email reminders"]').setValue(true);
    await wrapper.get('[data-test="notification-methods-save"]').trigger('click');
    await flushPromises();
    expect(saveNotificationChannels).toHaveBeenCalledWith(
      expect.objectContaining({ emailEnabled: true, messageEnabled: false, callEnabled: false, confirmationEnabled: false }),
    );
    expect(wrapper.text()).toContain('Notification methods saved');
  });

  it('disables SMS and phone switches while preserving existing preferences', async () => {
    vi.mocked(getNotificationChannels).mockResolvedValue({
      ...structuredClone(channels),
      message: { ...channels.message, enabled: true },
      call: { ...channels.call, enabled: true },
      confirmationEnabled: true,
    });
    wrapper = mount(NotificationMethods, {
      global: { plugins: [i18n], stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
    });
    await flushPromises();
    expect(
      wrapper
        .findAll('.channel-row input')
        .slice(1, 3)
        .map((input) => (input.element as HTMLInputElement).disabled),
    ).toEqual([true, true]);
    await wrapper.get('[data-test="notification-methods-save"]').trigger('click');
    await flushPromises();
    expect(saveNotificationChannels).toHaveBeenCalledWith(
      expect.objectContaining({ messageEnabled: true, callEnabled: true, confirmationEnabled: true }),
    );
  });
});
