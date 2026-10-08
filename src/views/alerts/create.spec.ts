import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { i18n } from '@/i18n';
import AlertForm from './create.vue';
import { getAlert, createAlert } from '@/api/alerts';
import { getMarketSymbols } from '@/api/market';
vi.mock('@/api/alerts', () => ({ getAlert: vi.fn(), createAlert: vi.fn(), updateAlert: vi.fn() }));
vi.mock('@/api/market', () => ({ getMarketSymbols: vi.fn() }));
let wrapper: ReturnType<typeof mount>;
it('submits distinct channel bounds differing only at the eighteenth decimal', async () => {
  vi.mocked(getMarketSymbols).mockResolvedValue([{ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }]);
  vi.mocked(createAlert).mockResolvedValue(2);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/alerts/new', component: AlertForm },
      { path: '/alerts', component: { template: '<div />' } },
    ],
  });
  await router.push('/alerts/new');
  wrapper = mount(AlertForm, { global: { plugins: [router, i18n] } });
  await flushPromises();
  await wrapper.get('#alert-name').setValue('Precise range');
  await wrapper.get('#alert-condition').setValue('CHANNEL_OUTSIDE');
  await wrapper.get('#alert-lower').setValue('100.123456789012345677');
  await wrapper.get('#alert-upper').setValue('100.123456789012345678');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(createAlert).toHaveBeenCalledWith(expect.objectContaining({ lower: '100.123456789012345677', upper: '100.123456789012345678' }));
});
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
it('loads existing rule fields for editing instead of an empty creation form', async () => {
  vi.mocked(getMarketSymbols).mockResolvedValue([{ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }]);
  vi.mocked(getAlert).mockResolvedValue({
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
  });
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/alerts/:id/edit', component: AlertForm }] });
  await router.push('/alerts/1/edit');
  wrapper = mount(AlertForm, { global: { plugins: [router, i18n] } });
  await flushPromises();
  expect((wrapper.get('#alert-name').element as HTMLInputElement).value).toBe('Existing alert');
  expect((wrapper.get('#alert-target').element as HTMLInputElement).value).toBe('123');
});
