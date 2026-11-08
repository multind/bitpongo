import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import NotificationMethods from './index.vue';
import type * as NotificationChannelsApi from '@/api/notificationChannels';
import {
  getNotificationChannels,
  saveNotificationChannels,
  getPerceptionStrengths,
  savePerceptionStrengths,
} from '@/api/notificationChannels';
import { getWebhookDestinations, setWebhookReminderEnabled } from '@/api/webhookReminderDestinations';

vi.mock('@/api/webhookReminderDestinations', () => ({
  getWebhookDestinations: vi.fn(),
  setWebhookReminderEnabled: vi.fn(),
}));

vi.mock('@/api/notificationChannels', async (original) => ({
  ...(await original<typeof NotificationChannelsApi>()),
  getNotificationChannels: vi.fn(),
  saveNotificationChannels: vi.fn(),
  getPerceptionStrengths: vi.fn(),
  savePerceptionStrengths: vi.fn(),
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
  vi.mocked(getWebhookDestinations).mockResolvedValue({ available: true, enabled: true, items: [] });
  vi.mocked(getNotificationChannels).mockResolvedValue(structuredClone(channels));
  vi.mocked(getPerceptionStrengths).mockResolvedValue({
    email: 'WEAK',
    bitpongo: 'MODERATE_WEAK',
    telegram: 'MODERATE',
    webhook: 'MODERATE',
  });
  vi.mocked(savePerceptionStrengths).mockImplementation(async (value) => ({ ...value }));
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
    const row = wrapper.get('[data-test="webhook-configure"]').element.closest('.channel-row')!;
    expect(row.querySelector('.channel-meta .channel-status.available')).not.toBeNull();
    await wrapper.get('input[aria-label="Webhook reminders"]').setValue(false);
    expect(setWebhookReminderEnabled).not.toHaveBeenCalled();
    await wrapper.get('[data-test="notification-methods-save"]').trigger('click');
    await flushPromises();
    expect(setWebhookReminderEnabled).toHaveBeenCalledWith(false);
    expect(wrapper.text()).not.toContain('DingTalk reminders');
    expect(wrapper.text()).not.toContain('Feishu reminders');
  });
  it('orders channels by strength and saves the selected Webhook tier', async () => {
    wrapper = mount(NotificationMethods, { global: { plugins: [i18n], stubs: { RouterLink: true } } });
    await flushPromises();
    expect(wrapper.find('#perception-heading').exists()).toBe(true);
    expect(wrapper.findAll('[data-channel]').map((row) => row.attributes('data-channel'))).toEqual([
      'email',
      'bitpongo',
      'telegram',
      'webhook',
    ]);
    await wrapper.get('[data-test="notification-methods-save"]').trigger('click');
    await flushPromises();
    expect(savePerceptionStrengths).not.toHaveBeenCalled();
    await wrapper.get('#perception-webhook').setValue('WEAK');
    expect(wrapper.findAll('[data-channel]').map((row) => row.attributes('data-channel'))).toEqual([
      'email',
      'webhook',
      'bitpongo',
      'telegram',
    ]);
    await wrapper.get('[data-test="notification-methods-save"]').trigger('click');
    await flushPromises();
    expect(savePerceptionStrengths).toHaveBeenCalledWith({
      email: 'WEAK',
      bitpongo: 'MODERATE_WEAK',
      telegram: 'MODERATE',
      webhook: 'WEAK',
    });
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

  it('hides SMS and phone switches while preserving existing preferences', async () => {
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
    expect(wrapper.findAll('.channel-row input')).toHaveLength(3);
    await wrapper.get('[data-test="notification-methods-save"]').trigger('click');
    await flushPromises();
    expect(saveNotificationChannels).toHaveBeenCalledWith(
      expect.objectContaining({ messageEnabled: true, callEnabled: true, confirmationEnabled: true }),
    );
  });
});
