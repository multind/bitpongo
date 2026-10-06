import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, expect, it, vi } from 'vitest';
import type * as VueRouter from 'vue-router';
import { i18n } from '@/i18n';
import { useUserStore } from '@/store/modules/user';
import Security from './index.vue';
const api = vi.hoisted(() => ({
  changePassword: vi.fn(),
  requestEmailCode: vi.fn(),
  changeEmail: vi.fn(),
  resetPassword: vi.fn(),
  securityStatus: vi.fn(),
  replace: vi.fn(),
}));
vi.mock('@/api/security', () => api);
vi.mock('vue-router', async (original) => ({ ...(await original<typeof VueRouter>()), useRouter: () => ({ replace: api.replace }) }));
let view: ReturnType<typeof mount>;
afterEach(() => {
  view?.unmount();
  vi.resetAllMocks();
});
function render(recovery = false, emailEnabled = true) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setSession({ token: 'current', info: { id: 1, name: 'Alice', email: 'alice@example.com' } });
  api.securityStatus.mockResolvedValue({ emailEnabled });
  i18n.global.locale.value = 'en-us';
  view = mount(Security, { props: { recovery }, global: { plugins: [pinia, i18n] } });
}
it('keeps the login on failure and logs out only after a successful password change', async () => {
  render();
  await flushPromises();
  await view.get('#old-password').setValue('OriginalPass!1');
  await view.get('#new-password').setValue('ChangedPass!2');
  await view.get('#confirm-password').setValue('ChangedPass!2');
  api.changePassword.mockRejectedValueOnce(new Error('offline'));
  await view.get('[data-password-form]').trigger('submit');
  await flushPromises();
  expect(useUserStore().token).toBe('current');
  expect(view.find('[role="alert"]').exists()).toBe(true);
  api.changePassword.mockResolvedValueOnce(undefined);
  await view.get('[data-password-form]').trigger('submit');
  await flushPromises();
  expect(api.changePassword).toHaveBeenCalledWith({ oldPassword: 'OriginalPass!1', newPassword: 'ChangedPass!2' });
  expect(useUserStore().token).toBe('');
  expect(api.replace).toHaveBeenCalledWith('/login');
});
it('does not submit mismatching passwords', async () => {
  render();
  await flushPromises();
  await view.get('#old-password').setValue('OriginalPass!1');
  await view.get('#new-password').setValue('ChangedPass!2');
  await view.get('#confirm-password').setValue('DifferentPass!2');
  await view.get('[data-password-form]').trigger('submit');
  await flushPromises();
  expect(api.changePassword).not.toHaveBeenCalled();
  expect(view.find('[role="alert"]').exists()).toBe(true);
});
it('shows email unavailable and blocks requesting a code when SMTP is not configured', async () => {
  render(true, false);
  await flushPromises();
  await view.get('#security-email').setValue('alice@example.com');
  await view.get('[data-send-code]').trigger('click');
  expect(api.requestEmailCode).not.toHaveBeenCalled();
});
it('disables email verification until the current password is provided', async () => {
  render();
  await flushPromises();
  await view.get('#security-email').setValue('new@example.com');
  expect((view.get('[data-send-code]').element as HTMLButtonElement).disabled).toBe(true);
  await view.get('#old-password').setValue('OriginalPass!1');
  expect((view.get('[data-send-code]').element as HTMLButtonElement).disabled).toBe(false);
});
it('shows one recovery heading instead of duplicating the page title', async () => {
  render(true);
  await flushPromises();
  expect(view.get('h1').text()).toBe('Forgot password?');
  expect(view.find('h2').exists()).toBe(false);
});
it('requests a reset challenge and completes recovery using the returned opaque ID', async () => {
  render(true);
  await flushPromises();
  api.requestEmailCode.mockResolvedValue({ challengeId: 'opaque-id' });
  await view.get('#security-email').setValue('alice@example.com');
  await view.get('[data-send-code]').trigger('click');
  await flushPromises();
  expect(api.requestEmailCode).toHaveBeenCalledWith({ purpose: 'RESET', email: 'alice@example.com' });
  await view.get('#security-code').setValue('12345678');
  await view.get('#new-password').setValue('RecoveredPass!2');
  await view.get('#confirm-password').setValue('RecoveredPass!2');
  api.resetPassword.mockResolvedValue(undefined);
  await view.get('[data-email-form]').trigger('submit');
  await flushPromises();
  expect(api.resetPassword).toHaveBeenCalledWith({ challengeId: 'opaque-id', code: '12345678', newPassword: 'RecoveredPass!2' });
  expect(useUserStore().token).toBe('');
});
it('clears secrets and ignores a prior accounts successful request after switching sessions', async () => {
  render();
  await flushPromises();
  await view.get('#old-password').setValue('OriginalPass!1');
  await view.get('#new-password').setValue('ChangedPass!2');
  await view.get('#confirm-password').setValue('ChangedPass!2');
  let complete!: () => void;
  api.changePassword.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
  );
  await view.get('[data-password-form]').trigger('submit');
  useUserStore().setSession({ token: 'other-account', info: { id: 2, name: 'Bob', email: 'bob@example.com' } });
  complete();
  await flushPromises();
  expect(useUserStore().token).toBe('other-account');
  expect(api.replace).not.toHaveBeenCalled();
  expect((view.get('#old-password').element as HTMLInputElement).value).toBe('');
});
