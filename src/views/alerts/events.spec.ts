import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { i18n } from '@/i18n';
import Events from './events.vue';
const api = vi.hoisted(() => ({
  listAlertEvents: vi.fn(),
  listAlertLogs: vi.fn(),
  readAlertEvent: vi.fn(),
  readAllAlertEvents: vi.fn(),
  deleteAlertEvent: vi.fn(),
  clearAlertEvents: vi.fn(),
  deleteAlertLog: vi.fn(),
  clearAlertLogs: vi.fn(),
}));
vi.mock('@/api/alerts', () => api);
let wrapper: ReturnType<typeof mount> | undefined;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
it('shows independent logs without inbox read controls', async () => {
  const data = {
    items: [{ id: 1, ruleId: null, title: 'Logged signal', body: 'BTC crossed', occurredAt: '2026-10-04T00:00:00Z', readAt: null }],
    page: 0,
    total: 1,
    size: 20,
    hasMore: false,
  };
  api.listAlertLogs.mockResolvedValue(data);
  api.listAlertEvents.mockResolvedValue({ ...data, items: [] });
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/alerts/logs');
  wrapper = mount(Events, { global: { plugins: [router, i18n] } });
  await flushPromises();
  expect(wrapper.text()).toContain('Logged signal');
  expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
  expect(wrapper.text()).not.toContain('Mark all as read');
  expect(wrapper.text()).not.toContain('Mark as read');
});
