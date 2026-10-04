import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import { useUserStore } from '@/store/modules/user';
import Help from './index.vue';
const api = vi.hoisted(() => ({
  listArticles: vi.fn(),
  getSearchHistory: vi.fn(),
  saveSearchHistory: vi.fn(),
  deleteSearchHistory: vi.fn(),
  clearSearchHistory: vi.fn(),
}));
vi.mock('@/api/content', () => api);
let wrapper: ReturnType<typeof mount>;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
const entry = {
  slug: 'notifications',
  kind: 'HELP',
  title: 'Receiving notifications',
  summary: 'Enable notifications',
  publishedAt: '2026-10-04T00:00:00Z',
};
function render() {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setSession({ token: 'session', info: { id: 1, name: 'Alice', email: 'alice@example.com' } });
  i18n.global.locale.value = 'en-us';
  wrapper = mount(Help, {
    global: { plugins: [pinia, i18n], stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
  });
  return wrapper;
}
it('searches in the selected language and offers real article routes', async () => {
  api.listArticles.mockResolvedValue({ items: [entry], hasMore: false });
  api.getSearchHistory.mockResolvedValue([]);
  api.saveSearchHistory.mockResolvedValue(null);
  const view = render();
  await flushPromises();
  await view.get('input').setValue('notification');
  await view.get('form').trigger('submit');
  await flushPromises();
  expect(api.listArticles).toHaveBeenLastCalledWith({ kind: 'HELP', locale: 'en-us', q: 'notification', page: 0 });
  expect(view.get('[data-test="article-link"]').attributes('href')).toBe('/articles/notifications');
  expect(api.saveSearchHistory).toHaveBeenCalledWith('notification');
});
it('keeps results when loading more fails and offers a retry', async () => {
  api.listArticles.mockResolvedValueOnce({ items: [entry], hasMore: true }).mockRejectedValueOnce(new Error('offline'));
  api.getSearchHistory.mockResolvedValue([]);
  const view = render();
  await flushPromises();
  await view.get('[data-test="more"]').trigger('click');
  await flushPromises();
  expect(view.text()).toContain('Receiving notifications');
  expect(view.find('[role="alert"]').exists()).toBe(true);
  expect(view.get('[data-test="more"]').attributes('disabled')).toBeUndefined();
});
it('reloads content when switching from help to articles and hides another account history', async () => {
  api.listArticles.mockResolvedValue({ items: [entry], hasMore: false });
  api.getSearchHistory.mockResolvedValue([{ id: 1, query: 'Private search', searchedAt: '2026-10-04T00:00:00Z' }]);
  const view = render();
  await flushPromises();
  await view.setProps({ kind: 'ARTICLE' });
  await flushPromises();
  expect(api.listArticles).toHaveBeenLastCalledWith({ kind: 'ARTICLE', locale: 'en-us', q: '', page: 0 });
  await view.setProps({ kind: 'HELP' });
  await flushPromises();
  useUserStore().setSession({ token: 'other', info: { id: 2, name: 'Bob', email: 'bob@example.com' } });
  await flushPromises();
  expect(view.text()).not.toContain('Private search');
});
