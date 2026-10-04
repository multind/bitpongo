import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import Details from './details.vue';
const api = vi.hoisted(() => ({ getArticle: vi.fn() }));
vi.mock('@/api/content', () => api);
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { slug: 'notifications' } }) }));
let wrapper: ReturnType<typeof mount>;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
it('renders content as text rather than executing stored HTML', async () => {
  api.getArticle.mockResolvedValue({
    slug: 'notifications',
    kind: 'HELP',
    title: 'Notifications',
    summary: 'Help',
    body: '<img src=x onerror=alert(1)>',
    publishedAt: '2026-10-04T00:00:00Z',
  });
  wrapper = mount(Details, { global: { plugins: [i18n] } });
  await flushPromises();
  expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>');
  expect(wrapper.find('img').exists()).toBe(false);
});
