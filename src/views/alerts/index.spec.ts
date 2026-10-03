import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { i18n } from '@/i18n';
import AlertList from './index.vue';
import { listAlerts, setAlertEnabled } from '@/api/alerts';
vi.mock('@/api/alerts', () => ({
  listAlerts: vi.fn(),
  setAlertEnabled: vi.fn(),
  deleteAlert: vi.fn(),
  copyAlert: vi.fn(),
  bulkAlerts: vi.fn(),
}));
const rule = {
  id: 1,
  name: 'BTC crossing',
  symbol: 'BTCUSDT',
  condition: 'CROSS',
  target: '60000',
  lower: null,
  upper: null,
  frequency: 'ONCE',
  interval: '1h',
  expiresAt: null,
  enabled: true,
  triggeredCount: 0,
  lastTriggeredAt: null,
  createdAt: '2026-10-03T00:00:00Z',
};
const wrappers: ReturnType<typeof mount>[] = [];
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount());
  vi.resetAllMocks();
});
async function mountList() {
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/alerts');
  const w = mount(AlertList, { global: { plugins: [i18n, router] } });
  wrappers.push(w);
  await flushPromises();
  return w;
}
describe('alert management', () => {
  it('shows an expired rule as expired and disables resuming it', async () => {
    vi.mocked(listAlerts).mockResolvedValue({
      items: [{ ...rule, expiresAt: '2000-01-01T00:00:00Z' }],
      total: 1,
      page: 0,
      size: 20,
      hasMore: false,
    });
    const w = await mountList();
    expect(w.get('[data-test="alert-status"]').text()).toBe('Expired');
    expect(w.get('[data-test="alert-toggle"]').attributes('disabled')).toBeDefined();
  });
  it('updates pause status after the server succeeds', async () => {
    vi.mocked(listAlerts)
      .mockResolvedValueOnce({ items: [rule], total: 1, page: 0, size: 20, hasMore: false })
      .mockResolvedValue({ items: [{ ...rule, enabled: false }], total: 1, page: 0, size: 20, hasMore: false });
    vi.mocked(setAlertEnabled).mockResolvedValue(undefined);
    const w = await mountList();
    await w.get('[data-test="alert-toggle"]').trigger('click');
    await flushPromises();
    expect(w.get('[data-test="alert-status"]').text()).toBe('Paused');
  });
  it('retains rule state when the server rejects pausing', async () => {
    vi.mocked(listAlerts).mockResolvedValue({ items: [rule], total: 1, page: 0, size: 20, hasMore: false });
    vi.mocked(setAlertEnabled).mockRejectedValue(new Error('network'));
    const w = await mountList();
    await w.get('[data-test="alert-toggle"]').trigger('click');
    await flushPromises();
    expect(w.get('[data-test="alert-status"]').text()).toBe('Active');
    expect(w.find('[role="alert"]').exists()).toBe(true);
  });
});
