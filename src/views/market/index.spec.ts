import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { i18n } from '@/i18n';
import MarketView from './index.vue';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { getMarketCandles, getMarketSymbols, getMarketTickers } from '@/api/market';

vi.mock('@/api/market', () => ({ getMarketCandles: vi.fn(), getMarketSymbols: vi.fn(), getMarketTickers: vi.fn() }));
const candle = {
  openTime: 1790985600000,
  closeTime: 1790989199999,
  open: '60000',
  high: '61000',
  low: '59000',
  close: '60500',
  volume: '10',
};
const wrappers: ReturnType<typeof mount>[] = [];
async function createView() {
  i18n.global.locale.value = 'en-us';
  vi.mocked(getMarketSymbols).mockResolvedValue([
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
  ]);
  vi.mocked(getMarketTickers).mockResolvedValue([
    { symbol: 'BTCUSDT', lastPrice: '60500', changePercent: '2', volume: '10', updatedAt: '2026-10-03T00:00:00Z' },
    { symbol: 'ETHUSDT', lastPrice: '2500', changePercent: '-1', volume: '8', updatedAt: '2026-10-03T00:00:00Z' },
  ]);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/market');
  const wrapper = mount(MarketView, { global: { plugins: [i18n, createPinia(), router] } });
  wrappers.push(wrapper);
  await flushPromises();
  return wrapper;
}
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount());
  vi.resetAllMocks();
});

describe('market browsing', () => {
  it('shows a price list linking each asset to its own chart rather than an embedded chart form', async () => {
    vi.mocked(getMarketCandles).mockResolvedValue([candle]);
    const view = await createView();
    expect(view.text()).toContain('60,500');
    expect(view.text()).toContain('2,500');
    expect(view.get('a[href="/market/BTCUSDT"]').text()).toContain('BTC');
    expect(view.get('a[href="/market/ETHUSDT"]').text()).toContain('-1%');
    expect(view.find('select').exists()).toBe(false);
    expect(view.findAll('[data-test="candle"]')).toHaveLength(0);
  });
  it('filters the asset list without losing the other assets when the search is cleared', async () => {
    vi.mocked(getMarketCandles).mockResolvedValue([candle]);
    const view = await createView();
    await view.get('input[type="search"]').setValue(' eth ');
    expect(view.find('a[href="/market/BTCUSDT"]').exists()).toBe(false);
    expect(view.find('a[href="/market/ETHUSDT"]').exists()).toBe(true);
    await view.get('input[type="search"]').setValue('');
    expect(view.find('a[href="/market/BTCUSDT"]').exists()).toBe(true);
  });
  it('never fabricates a trend when candle history is unavailable', async () => {
    vi.mocked(getMarketCandles).mockRejectedValue(new Error('unavailable'));
    const view = await createView();
    expect(view.get('a[href="/market/BTCUSDT"]').text()).toContain('60,500');
    expect(view.findAll('[data-test="market-sparkline"]')).toHaveLength(0);
  });
  it('offers retry when ticker loading fails', async () => {
    vi.mocked(getMarketCandles).mockResolvedValue([candle]);
    const view = await createView();
    vi.mocked(getMarketTickers).mockRejectedValueOnce(new Error('offline'));
    await view.get('[data-test="market-refresh"]').trigger('click');
    await flushPromises();
    expect(view.find('[data-test="market-error"]').exists()).toBe(true);
    await view.get('[data-test="market-retry"]').trigger('click');
    await flushPromises();
    expect(view.find('[data-test="market-error"]').exists()).toBe(false);
    expect(view.get('a[href="/market/BTCUSDT"]').text()).toContain('60,500');
  });
});
