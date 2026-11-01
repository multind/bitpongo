import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import { useUserStore } from '@/store/modules/user';
import { getAvatar } from '@/api/avatar';
import SharePoster from './SharePoster.vue';
vi.mock('@/api/avatar', () => ({ getAvatar: vi.fn(), uploadAvatar: vi.fn(), deleteAvatar: vi.fn() }));

it('shows negative returns and keeps the download control accessible in English', () => {
  const pinia = createPinia();
  i18n.global.locale.value = 'en-us';
  const view = mount(SharePoster, {
    props: {
      plan: { total_ratio: -3.1379, total_revenue: -4, status: 'active', coins: [], strategy: { name: 'BTC DCA', frequency: 'Daily' } },
      username: 'Alice',
      average: 'BTC 100',
      date: '2026-11-01',
      time: '12:00',
    },
    global: { plugins: [i18n, pinia] },
  });
  expect(view.get('[data-test="share-return"]').text()).toContain('-3.1379%');
  expect(view.get('[data-test="share-return"]').classes()).toContain('negative');
  expect(view.get('button').text()).toContain('Download');
  view.get('button').trigger('click');
  expect(view.emitted('download')).toHaveLength(1);
});
it('uses the signed-in user avatar on the share poster', async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setSession({ token: 'test', info: { id: 1, name: 'Alice', email: 'a@example.com' } });
  vi.mocked(getAvatar).mockResolvedValue({ imageData: 'data:image/png;base64,aGVsbG8=' });
  const view = mount(SharePoster, {
    props: { plan: { total_ratio: 0, coins: [], strategy: {} }, username: 'Alice', average: '', date: '', time: '' },
    global: { plugins: [i18n, pinia] },
  });
  await flushPromises();
  expect(view.get('.author-avatar img').attributes('src')).toBe('data:image/png;base64,aGVsbG8=');
});
