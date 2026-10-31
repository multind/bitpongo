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
  confirmAlertEvent: vi.fn(),
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

it('groups inbox rows by displayed date and distinguishes unread notifications', async () => {
  api.listAlertEvents.mockResolvedValue({
    items: [
      {
        id: 1,
        ruleId: 4,
        type: 'PRICE',
        title: 'Unread BTC',
        body: 'Crossed target',
        symbol: 'BTCUSDT',
        price: '90000',
        occurredAt: '2026-10-04T12:00:00Z',
        readAt: null,
      },
      {
        id: 2,
        ruleId: null,
        type: 'PRICE',
        title: 'Read ETH',
        body: 'Reached target',
        symbol: 'ETHUSDT',
        price: '3000',
        occurredAt: '2026-10-04T13:00:00Z',
        readAt: '2026-10-04T14:00:00Z',
      },
    ],
    page: 0,
    total: 2,
    size: 20,
    hasMore: false,
  });
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/alerts/events');
  wrapper = mount(Events, { global: { plugins: [router, i18n] } });
  await flushPromises();
  expect(wrapper.findAll('[data-test="event-date"]')).toHaveLength(1);
  expect(wrapper.findAll('[data-test="unread-marker"]')).toHaveLength(1);
  expect(wrapper.get('time').attributes('datetime')).toBe('2026-10-04T12:00:00Z');
  expect(wrapper.find('a[href="/alerts/4"]').exists()).toBe(true);
  await wrapper.get('input[type="checkbox"]').setValue(true);
  await flushPromises();
  expect(api.listAlertEvents).toHaveBeenLastCalledWith({ page: 0, size: 20, unreadOnly: true });
});

it('confirms an escalation-pending alert from the inbox', async () => {
  api.listAlertEvents.mockResolvedValue({
    items: [
      {
        id: 9,
        ruleId: null,
        type: 'STRATEGY_SIGNAL',
        title: 'Needs confirmation',
        body: 'BTC crossed',
        symbol: 'BTCUSDT',
        price: null,
        occurredAt: '2026-10-04T12:00:00Z',
        readAt: null,
        confirmedAt: null,
        confirmationRequired: true,
      },
    ],
    page: 0,
    total: 1,
    size: 20,
    hasMore: false,
  });
  api.confirmAlertEvent.mockResolvedValue(undefined);
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/alerts/events');
  wrapper = mount(Events, { global: { plugins: [router, i18n] } });
  await flushPromises();
  expect(wrapper.get('[data-test="alert-confirm"]').text()).toBe('Confirm');
  await wrapper.get('[data-test="alert-confirm"]').trigger('click');
  await flushPromises();
  expect(api.confirmAlertEvent).toHaveBeenCalledWith(9);
});
