import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import Profile from './index.vue';
import { useUserStore } from '@/store/modules/user';
const api = vi.hoisted(() => ({ getUserProfile: vi.fn(), saveUserProfile: vi.fn() }));
vi.mock('@/api/profile', () => api);
let wrapper: ReturnType<typeof mount> | undefined;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
const initial = { name: 'Alice', country: 'HK', introduction: 'Hello', upDownColor: 'GREEN_UP' };
function render() {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setSession({ token: 'session', info: { id: 1, name: 'Alice', email: 'alice@example.com' } });
  i18n.global.locale.value = 'en-us';
  wrapper = mount(Profile, { global: { plugins: [pinia, i18n] } });
  return wrapper;
}
it('persists allowed profile fields and updates the logged-in nickname only after success', async () => {
  api.getUserProfile.mockResolvedValue({ ...initial });
  api.saveUserProfile.mockResolvedValue({ ...initial, name: 'Bob', upDownColor: 'RED_UP' });
  const view = render();
  await flushPromises();
  await view.get('#profile-name').setValue('Bob');
  await view.get('#profile-color').setValue('RED_UP');
  await view.get('form').trigger('submit');
  await flushPromises();
  expect(api.saveUserProfile).toHaveBeenCalledWith({ ...initial, name: 'Bob', upDownColor: 'RED_UP' });
  expect(useUserStore().info.name).toBe('Bob');
  expect(useUserStore().info.email).toBe('alice@example.com');
  expect(view.get('[role="status"]').text()).toMatch(/saved/i);
});
it('keeps unsaved edits and previous account state when save fails', async () => {
  api.getUserProfile.mockResolvedValue({ ...initial });
  api.saveUserProfile.mockRejectedValue(new Error('offline'));
  const view = render();
  await flushPromises();
  await view.get('#profile-name').setValue('Bob');
  await view.get('form').trigger('submit');
  await flushPromises();
  expect(useUserStore().info.name).toBe('Alice');
  expect(view.get('#profile-name').element).toHaveProperty('value', 'Bob');
  expect(view.find('[role="alert"]').exists()).toBe(true);
});
it('prevents submitting an empty nickname or default data when initial loading fails', async () => {
  api.getUserProfile.mockRejectedValue(new Error('offline'));
  const view = render();
  await flushPromises();
  expect(view.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  await view.get('form').trigger('submit');
  expect(api.saveUserProfile).not.toHaveBeenCalled();
});
it('does not submit the previous account draft after switching accounts', async () => {
  api.getUserProfile.mockResolvedValue({ ...initial });
  api.saveUserProfile.mockResolvedValue({ ...initial });
  const view = render();
  await flushPromises();
  useUserStore().setSession({ token: 'another-session', info: { id: 2, name: 'Other', email: 'other@example.com' } });
  await view.get('form').trigger('submit');
  await flushPromises();
  expect(api.saveUserProfile).not.toHaveBeenCalled();
});
