import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import type * as VueRouter from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import Devices from './index.vue';
const api = vi.hoisted(() => ({ getSessions: vi.fn(), revokeSession: vi.fn(), replace: vi.fn() }));
vi.mock('@/api/sessions', () => api);
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof VueRouter>()),
  useRouter: () => ({ replace: api.replace }),
}));
let view: ReturnType<typeof mount>;
afterEach(() => {
  view?.unmount();
  vi.resetAllMocks();
});
const session = {
  id: 'a',
  createdAt: '2026-10-06T00:00:00Z',
  lastSeenAt: '2026-10-06T00:00:00Z',
  expiresAt: '2026-11-05T00:00:00Z',
  current: false,
};
function render(current = false) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setSession({ token: 'token', info: { id: 1, name: 'Alice', email: 'alice@example.com' } });
  i18n.global.locale.value = 'en-us';
  api.getSessions.mockResolvedValue({ items: [{ ...session, current }] });
  view = mount(Devices, { global: { plugins: [pinia, i18n] } });
}
it('requires confirmation before removing the selected session', async () => {
  api.revokeSession.mockResolvedValue(undefined);
  render();
  await flushPromises();
  await view.get('[data-revoke]').trigger('click');
  expect(api.revokeSession).not.toHaveBeenCalled();
  await view.get('[data-confirm]').trigger('click');
  await flushPromises();
  expect(api.revokeSession).toHaveBeenCalledWith('a');
  expect(view.find('[data-revoke]').exists()).toBe(false);
  expect(useUserStore().token).toBe('token');
});
it('retains the row and reports failure when revocation fails', async () => {
  api.revokeSession.mockRejectedValue(new Error('offline'));
  render();
  await flushPromises();
  await view.get('[data-revoke]').trigger('click');
  await view.get('[data-confirm]').trigger('click');
  await flushPromises();
  expect(view.find('[data-revoke]').exists()).toBe(true);
  expect(view.find('[role="alert"]').exists()).toBe(true);
});
it('logs out locally only after the current session is revoked', async () => {
  api.revokeSession.mockResolvedValue(undefined);
  render(true);
  await flushPromises();
  await view.get('[data-revoke]').trigger('click');
  await view.get('[data-confirm]').trigger('click');
  await flushPromises();
  expect(useUserStore().token).toBe('');
  expect(api.replace).toHaveBeenCalledWith('/login');
});
