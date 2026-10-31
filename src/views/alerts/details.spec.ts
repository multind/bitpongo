import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import Details from './details.vue';
const api = vi.hoisted(() => ({ getAlert: vi.fn(), setAlertEnabled: vi.fn() }));
vi.mock('@/api/alerts', () => api);
let wrapper: ReturnType<typeof mount>;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
const rule = {
  id: 4,
  name: 'Portfolio BTC',
  symbol: 'BTCUSDT',
  condition: 'ABOVE',
  target: '90000.123456789',
  lower: null,
  upper: null,
  frequency: 'EACH_CANDLE',
  interval: '1h',
  expiresAt: null,
  enabled: true,
  triggeredCount: 3,
  lastTriggeredAt: '2026-10-18T12:00:00Z',
  createdAt: '2026-10-01T12:00:00Z',
};
async function render() {
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/alerts/4');
  wrapper = mount(Details, { global: { plugins: [router, i18n] } });
  await flushPromises();
  return wrapper;
}
it('shows precise conditions, candle interval and dates in labeled details', async () => {
  api.getAlert.mockResolvedValue(rule);
  const view = await render();
  expect(view.get('h1').text()).toBe('Portfolio BTC');
  expect(view.get('dl').text()).toContain('90000.123456789');
  expect(view.get('dl').text()).toContain('1h');
  expect(view.findAll('time').map((t) => t.attributes('datetime'))).toEqual(['2026-10-18T12:00:00Z', '2026-10-01T12:00:00Z']);
  expect(view.find('a[href="/alerts/4/edit"]').exists()).toBe(true);
});
it('offers a retry after initial load fails', async () => {
  api.getAlert.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(rule);
  const view = await render();
  expect(view.find('[role="alert"]').exists()).toBe(true);
  await view.get('[data-test="detail-retry"]').trigger('click');
  await flushPromises();
  expect(view.get('h1').text()).toBe('Portfolio BTC');
  expect(view.find('[role="alert"]').exists()).toBe(false);
});
it('keeps range precision and prevents toggling an expired rule', async () => {
  api.getAlert.mockResolvedValue({
    ...rule,
    condition: 'CHANNEL_OUTSIDE',
    target: null,
    lower: '0.000000000000000001',
    upper: '0.000000000000000009',
    expiresAt: '2020-01-01T00:00:00Z',
  });
  const view = await render();
  expect(view.get('dl').text()).toContain('0.000000000000000001–0.000000000000000009');
  expect(view.get('[data-test="detail-status"]').text()).toBe('Expired');
  expect(view.get('[data-test="detail-toggle"]').attributes('disabled')).toBeDefined();
  await view.get('[data-test="detail-toggle"]').trigger('click');
  expect(api.setAlertEnabled).not.toHaveBeenCalled();
});
it('refreshes persisted status after pause and retains it when resume fails', async () => {
  api.getAlert.mockResolvedValueOnce(rule).mockResolvedValueOnce({ ...rule, enabled: false });
  api.setAlertEnabled.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('offline'));
  const view = await render();
  await view.get('[data-test="detail-toggle"]').trigger('click');
  await flushPromises();
  expect(api.setAlertEnabled).toHaveBeenLastCalledWith(4, false);
  expect(view.get('[data-test="detail-status"]').text()).toBe('Paused');
  await view.get('[data-test="detail-toggle"]').trigger('click');
  await flushPromises();
  expect(api.setAlertEnabled).toHaveBeenLastCalledWith(4, true);
  expect(view.get('[data-test="detail-status"]').text()).toBe('Paused');
  expect(view.find('[role="alert"]').exists()).toBe(true);
});
