import { flushPromises, mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import { getReminderEmail, requestEmailCode, verifyReminderEmail } from '@/api/security';
import Sheet from './ReminderEmailSheet.vue';

vi.mock('@/api/security', () => ({
  getReminderEmail: vi.fn(),
  requestEmailCode: vi.fn(),
  verifyReminderEmail: vi.fn(),
  useDefaultReminderEmail: vi.fn(),
}));

it('shows the account email and requires verification before saving a custom recipient', async () => {
  const settings = { accountEmail: 'account@example.com', customEmail: null, available: true };
  vi.mocked(getReminderEmail).mockResolvedValue(settings);
  vi.mocked(requestEmailCode).mockResolvedValue({ challengeId: 'challenge' });
  vi.mocked(verifyReminderEmail).mockResolvedValue({ ...settings, customEmail: 'other@example.com' });
  const wrapper = mount(Sheet, { global: { plugins: [i18n] } });
  await flushPromises();
  expect(wrapper.text()).toContain('account@example.com');
  await wrapper.get('input[value="custom"]').setValue(true);
  await wrapper.get('input[type="email"]').setValue('other@example.com');
  expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  await wrapper.get('form button[type="button"]').trigger('click');
  await flushPromises();
  expect(requestEmailCode).toHaveBeenCalledWith({ purpose: 'REMINDER_EMAIL', email: 'other@example.com' });
  await wrapper.get('input[autocomplete="one-time-code"]').setValue('12345678');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(verifyReminderEmail).toHaveBeenCalledWith({ challengeId: 'challenge', code: '12345678' });
  expect(wrapper.emitted('close')).toHaveLength(1);
  wrapper.unmount();
});

it('points accounts without email to the binding flow', async () => {
  vi.mocked(getReminderEmail).mockResolvedValue({ accountEmail: null, customEmail: null, available: true });
  const wrapper = mount(Sheet, { global: { plugins: [i18n], stubs: { RouterLink: true } } });
  await flushPromises();
  expect(wrapper.get('router-link-stub').attributes('to')).toBe('/member/security?bindEmail=1');
  expect(wrapper.find('form').exists()).toBe(false);
  wrapper.unmount();
});
