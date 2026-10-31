import { mount, flushPromises, DOMWrapper } from '@vue/test-utils';
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
  document.body.innerHTML = '';
  vi.resetAllMocks();
});
async function mountList() {
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/alerts');
  const w = mount(AlertList, { attachTo: document.body, global: { plugins: [i18n, router] } });
  wrappers.push(w);
  await flushPromises();
  return w;
}
describe('alert management', () => {
  it('appends more reminders and exposes expired filtering above the list', async () => {
    vi.mocked(listAlerts)
      .mockResolvedValueOnce({ items: [rule], total: 2, page: 0, size: 20, hasMore: true })
      .mockResolvedValueOnce({ items: [{ ...rule, id: 2, name: 'ETH crossing' }], total: 2, page: 1, size: 20, hasMore: false })
      .mockResolvedValue({ items: [], total: 0, page: 0, size: 20, hasMore: false });
    const w = await mountList();
    expect(w.find('.alerts-heading').exists()).toBe(true);
    await w.get('.pagination button').trigger('click');
    await flushPromises();
    expect(w.findAll('.rule-entry')).toHaveLength(2);
    expect(w.find('.pagination').exists()).toBe(false);
    const expiredButton = w.findAll('.status-tabs button').find((button) => button.text() === 'Expired')!;
    await expiredButton.trigger('click');
    await flushPromises();
    expect(listAlerts).toHaveBeenLastCalledWith({ q: '', status: 'expired', page: 0, size: 20 });
  });
  it('keeps swipe actions open when the more button is clicked and closes the previous row', async () => {
    vi.mocked(listAlerts).mockResolvedValue({
      items: [rule, { ...rule, id: 2, name: 'ETH alert' }],
      total: 2,
      page: 0,
      size: 20,
      hasMore: false,
    });
    const w = await mountList();
    const buttons = w.findAll('.more-button');
    await buttons[0]!.trigger('click');
    expect(buttons[0]!.attributes('aria-expanded')).toBe('true');
    expect(w.findAll('.swipe-actions')[0]!.attributes('aria-hidden')).toBe('false');
    await buttons[1]!.trigger('click');
    expect(buttons[0]!.attributes('aria-expanded')).toBe('false');
    expect(buttons[1]!.attributes('aria-expanded')).toBe('true');
    await buttons[1]!.trigger('click');
    expect(buttons[1]!.attributes('aria-expanded')).toBe('false');
  });
  it('moves filters into a dismissible drawer and applies status without changing the search', async () => {
    vi.mocked(listAlerts).mockResolvedValue({ items: [rule], total: 1, page: 0, size: 20, hasMore: false });
    const w = await mountList();
    expect(w.find('[data-test="alert-filters"]').exists()).toBe(false);
    await w.get('input[type="search"]').setValue('BTC');
    await w.get('[data-test="alert-filter-toggle"]').trigger('click');
    await flushPromises();
    const drawer = new DOMWrapper(document.querySelector('[data-test="alert-filters"]')!);
    expect(drawer.isVisible()).toBe(true);
    await drawer.get('input[value="inactive"]').setValue();
    await flushPromises();
    expect(listAlerts).toHaveBeenLastCalledWith({ q: 'BTC', status: 'inactive', page: 0, size: 20 });
    await drawer.get('[data-test="alert-filter-close"]').trigger('click');
    expect(w.get('[data-test="alert-filter-toggle"]').attributes('aria-expanded')).toBe('false');
  });
  it('keeps creation links inside the add menu and closes it with Escape', async () => {
    vi.mocked(listAlerts).mockResolvedValue({ items: [rule], total: 21, page: 0, size: 20, hasMore: true });
    const w = await mountList();
    expect(w.get('[data-test="alert-count"]').text()).toBe('21');
    expect(w.find('a[href="/alerts/create"]').exists()).toBe(false);
    await w.get('[data-test="alert-add-toggle"]').trigger('click');
    expect(w.get('a[href="/alerts/create"]').text()).toContain('price');
    expect(w.find('a[href="/alerts/webhooks"]').exists()).toBe(false);
    await w.trigger('keydown', { key: 'Escape' });
    expect(w.find('a[href="/alerts/create"]').exists()).toBe(false);
  });
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
