import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { i18n } from '@/i18n';
import AlertForm from './create.vue';
import { getAlert, createAlert, updateAlert, getAlertCapabilities } from '@/api/alerts';
import { getMarketSymbols } from '@/api/market';
import { getNotificationChannels } from '@/api/notificationChannels';
vi.mock('@/api/alerts', () => ({
  getAlert: vi.fn(),
  createAlert: vi.fn(),
  updateAlert: vi.fn(),
  getAlertCapabilities: vi.fn().mockResolvedValue({ perAlertChannels: true }),
}));
vi.mock('@/api/market', () => ({ getMarketSymbols: vi.fn() }));
vi.mock('@/api/notificationChannels', () => ({ getNotificationChannels: vi.fn() }));
let wrapper: ReturnType<typeof mount>;
const existing = {
  id: 1,
  name: 'Existing alert',
  symbol: 'BTCUSDT',
  condition: 'ABOVE',
  target: '123',
  lower: null,
  upper: null,
  frequency: 'ONCE',
  interval: '1h',
  expiresAt: null,
  enabled: false,
  triggeredCount: 2,
  lastTriggeredAt: null,
  createdAt: '2026-10-03T00:00:00Z',
};
beforeEach(() => {
  vi.mocked(getAlertCapabilities).mockResolvedValue({ perAlertChannels: true });
  const channel = { enabled: true, available: true, level: 'Weak' as const, sequence: 0 };
  vi.mocked(getNotificationChannels).mockResolvedValue({
    bitpongo: channel,
    email: channel,
    message: channel,
    call: channel,
    dingding: channel,
    feishu: channel,
    telegram: channel,
    confirmationEnabled: true,
  });
  vi.mocked(getMarketSymbols).mockResolvedValue([
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
  ]);
  vi.mocked(createAlert).mockResolvedValue(2);
});
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
async function open(path = '/alerts/new') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/alerts/new', component: AlertForm },
      { path: '/alerts/:id/edit', component: AlertForm },
      { path: '/alerts/:id', component: { template: '<div />' } },
      { path: '/alerts', component: { template: '<div />' } },
    ],
  });
  await router.push(path);
  wrapper = mount(AlertForm, { global: { plugins: [router, i18n] } });
  await flushPromises();
  return router;
}
async function next() {
  await wrapper.get('[data-test="wizard-next"]').trigger('click');
  await flushPromises();
}
async function toReview() {
  await next();
  await next();
  await next();
}
it('separates the trading pair selector from the alert name input', async () => {
  await open();
  const selector = wrapper.get('#alert-symbol').element.closest('section')!.parentElement!;
  expect(parseFloat(getComputedStyle(selector).marginTop)).toBeGreaterThan(0);
});
it('prefills an editable target price passed from the chart', async () => {
  await open('/alerts/new?symbol=ETHUSDT&price=2450.25');
  await wrapper.get('#alert-name').setValue('ETH price');
  await next();
  expect((wrapper.get('#alert-target').element as HTMLInputElement).value).toBe('2450.25');
});
it('saves a per-alert selection of available notification channels', async () => {
  await open();
  await wrapper.get('#alert-name').setValue('Email alert');
  await next();
  await wrapper.get('#alert-target').setValue('100');
  await next();
  await wrapper.get('[data-test="channel-bitpongo"]').setValue(false);
  await wrapper.get('[data-test="channel-email"]').setValue(true);
  await next();
  await next();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(createAlert).toHaveBeenCalledWith(expect.objectContaining({ channels: ['email'] }));
});
it('shows contextual guidance throughout the price alert wizard', async () => {
  await open();
  expect(wrapper.get('[data-test="wizard-help"]').text()).not.toBe('');
  await wrapper.get('#alert-name').setValue('BTC alert');
  await next();
  expect(wrapper.get('[data-test="wizard-help"]').text()).not.toBe('');
  await wrapper.get('#alert-target').setValue('100');
  await next();
  expect(wrapper.get('[data-test="wizard-help"]').text()).not.toBe('');
  await next();
  expect(wrapper.get('[data-test="wizard-help"]').text()).not.toBe('');
  await next();
  expect(wrapper.get('[data-test="wizard-help"]').text()).not.toBe('');
});
it('gates the name, preserves the selected market pair and back navigation, and never writes before review', async () => {
  await open('/alerts/new?symbol=ETHUSDT');
  expect(wrapper.find('#alert-condition').exists()).toBe(false);
  await next();
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  expect(wrapper.find('#alert-name').exists()).toBe(true);
  await wrapper.get('#alert-name').setValue('ETH price');
  await next();
  await wrapper.get('#alert-target').setValue('2000');
  await wrapper.get('[data-test="wizard-back"]').trigger('click');
  expect((wrapper.get('#alert-name').element as HTMLInputElement).value).toBe('ETH price');
  expect(wrapper.get('#alert-symbol').text()).toContain('ETH/USDT');
  await next();
  expect((wrapper.get('#alert-target').element as HTMLInputElement).value).toBe('2000');
  await toReview();
  expect(wrapper.get('[data-test="wizard-review"]').text()).toContain('ETHUSDT');
  expect(createAlert).not.toHaveBeenCalled();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(createAlert).toHaveBeenCalledWith(expect.objectContaining({ name: 'ETH price', symbol: 'ETHUSDT', target: '2000' }));
});
it('blocks reversed bounds but submits distinct channel bounds at the eighteenth decimal', async () => {
  await open();
  await wrapper.get('#alert-name').setValue('Precise range');
  await next();
  await wrapper.get('#alert-condition').trigger('click');
  await wrapper.get('input[value="CHANNEL_OUTSIDE"]').setValue(true);
  await wrapper.get('[data-test="sheet-confirm"]').trigger('click');
  await wrapper.get('#alert-lower').setValue('100.123456789012345678');
  await wrapper.get('#alert-upper').setValue('100.123456789012345677');
  await next();
  expect(wrapper.find('#alert-lower').exists()).toBe(true);
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  await wrapper.get('#alert-lower').setValue('100.123456789012345677');
  await wrapper.get('#alert-upper').setValue('100.123456789012345678');
  await toReview();
  expect(createAlert).not.toHaveBeenCalled();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(createAlert).toHaveBeenCalledWith(
    expect.objectContaining({ target: null, lower: '100.123456789012345677', upper: '100.123456789012345678' }),
  );
});
it('blocks past expiry and retains candle interval and future expiry on submission', async () => {
  await open();
  await wrapper.get('#alert-name').setValue('Candle');
  await next();
  await wrapper.get('#alert-target').setValue('50');
  await next();
  await next();
  await wrapper.get('#alert-frequency').trigger('click');
  await wrapper.get('input[value="CANDLE_CLOSE"]').setValue(true);
  await wrapper.get('[data-test="sheet-confirm"]').trigger('click');
  await wrapper.get('#alert-interval').trigger('click');
  await wrapper.get('input[value="4h"]').setValue(true);
  await wrapper.get('#alert-interval').element.closest('section')!.querySelector<HTMLButtonElement>('[data-test="sheet-confirm"]')!.click();
  await wrapper.get('#alert-expiry').setValue('2000-01-01T00:00');
  await next();
  expect(wrapper.find('#alert-expiry').exists()).toBe(true);
  expect(createAlert).not.toHaveBeenCalled();
  await wrapper.get('#alert-expiry').setValue('2099-01-01T12:00');
  await next();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(createAlert).toHaveBeenCalledWith(
    expect.objectContaining({ frequency: 'CANDLE_CLOSE', interval: '4h', expiresAt: new Date('2099-01-01T12:00').toISOString() }),
  );
});
it('keeps review data after a failed write and permits a deliberate retry', async () => {
  vi.mocked(createAlert).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(2);
  const router = await open();
  await wrapper.get('#alert-name').setValue('Retry');
  await next();
  await wrapper.get('#alert-target').setValue('100');
  await toReview();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(wrapper.get('[data-test="wizard-review"]').text()).toContain('Retry');
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  expect(router.currentRoute.value.path).toBe('/alerts/new');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(createAlert).toHaveBeenCalledTimes(2);
  expect(router.currentRoute.value.path).toBe('/alerts');
});
it('prefills editing and uses update only after review', async () => {
  vi.mocked(getAlert).mockResolvedValue(existing);
  await open('/alerts/1/edit');
  expect((wrapper.get('#alert-name').element as HTMLInputElement).value).toBe('Existing alert');
  await next();
  expect((wrapper.get('#alert-target').element as HTMLInputElement).value).toBe('123');
  await toReview();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(updateAlert).toHaveBeenCalledWith(1, expect.objectContaining({ target: '123', name: 'Existing alert' }));
  expect(createAlert).not.toHaveBeenCalled();
});
it('does not advance or save a failed edit load until a successful retry', async () => {
  vi.mocked(getAlert).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(existing);
  await open('/alerts/1/edit');
  expect(wrapper.get('[data-test="wizard-next"]').attributes('disabled')).toBeDefined();
  await wrapper.get('form').trigger('submit');
  expect(updateAlert).not.toHaveBeenCalled();
  await wrapper.get('[data-test="wizard-reload"]').trigger('click');
  await flushPromises();
  expect((wrapper.get('#alert-name').element as HTMLInputElement).value).toBe('Existing alert');
  expect(wrapper.get('[data-test="wizard-next"]').attributes('disabled')).toBeUndefined();
});
