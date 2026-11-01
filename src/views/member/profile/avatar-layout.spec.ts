import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import { useUserStore } from '@/store/modules/user';
import Avatar from './Avatar.vue';

vi.mock('@/api/avatar', () => ({
  getAvatar: vi.fn().mockResolvedValue({ imageData: 'data:image/png;base64,aGVsbG8=' }),
  uploadAvatar: vi.fn(),
  deleteAvatar: vi.fn(),
}));
vi.mock('@/mobile/bridge', () => ({ hasNativeChannel: () => true, pickNativeAvatar: vi.fn() }));

it('groups the two avatar choices and separates the remove action', async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setSession({ token: 'test', info: { id: 1, name: 'A', email: 'a@example.com' } });
  const view = mount(Avatar, { props: { editable: true }, global: { plugins: [pinia, i18n] } });
  await flushPromises();
  expect(view.get('.avatar-actions').findAll('button')).toHaveLength(2);
  expect(view.get('[data-remove]').element.closest('.avatar-actions')).toBeNull();
});
