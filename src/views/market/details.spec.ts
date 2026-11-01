import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { i18n } from '@/i18n';
import MarketView from './details.vue';
import CandleChart from './components/CandleChart.vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia } from 'pinia';
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
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', priceTickSize: '0.01000000' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
  ]);
  vi.mocked(getMarketTickers).mockResolvedValue([
    { symbol: 'BTCUSDT', lastPrice: '60500', changePercent: '2', volume: '10', updatedAt: '2026-10-03T00:00:00Z' },
  ]);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/market/:symbol', component: { template: '<div/>' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div/>' } },
    ],
  });
  await router.push('/market/BTCUSDT');
  const wrapper = mount(MarketView, { global: { plugins: [i18n, createPinia(), router] } });
  wrappers.push(wrapper);
  return wrapper;
}
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount());
  vi.resetAllMocks();
});

describe('market browsing', () => {
  it('carries a chart-selected price into the alert creation link', async () => {
    vi.mocked(getMarketCandles).mockResolvedValue([candle]);
    const view = await createView();
    await flushPromises();
    view.findComponent(CandleChart).vm.$emit('selectPrice', 60500);
    await view.vm.$nextTick();
    expect(view.get('.create-alert').attributes('href')).toContain('price=60500.00');
  });
  it('shows real ticker and candles', async () => {
    vi.mocked(getMarketCandles).mockResolvedValue([candle]);
    const view = await createView();
    await flushPromises();
    expect(view.text()).toContain('60,500');
    expect(view.findAll('[data-test="candle"]')).toHaveLength(1);
  });
  it('keeps the chart footprint while candles are loading', async () => {
    let finish!: (v: (typeof candle)[]) => void;
    vi.mocked(getMarketCandles).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const view = await createView();
    await flushPromises();
    expect(view.find('[data-test="candle-skeleton"]').exists()).toBe(true);
    finish([candle]);
    await flushPromises();
    expect(view.find('[data-test="candle-skeleton"]').exists()).toBe(false);
    expect(view.findAll('[data-test="candle"]')).toHaveLength(1);
  });
  it('refreshes candles in place without replacing the chart with a skeleton', async () => {
    vi.mocked(getMarketCandles).mockResolvedValueOnce([candle]);
    const view = await createView();
    await flushPromises();
    expect(view.findAll('[data-test="candle"]')).toHaveLength(1);
    let finish!: (v: (typeof candle)[]) => void;
    vi.mocked(getMarketCandles).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await view.get('[data-test="market-refresh"]').trigger('click');
    await flushPromises();
    expect(view.find('[data-test="candle-skeleton"]').exists()).toBe(false);
    expect(view.findAll('[data-test="candle"]')).toHaveLength(1);
    finish([{ ...candle, close: '61000' }]);
    await flushPromises();
    expect(view.get('[data-test="chart-summary"]').text()).toContain('61,000');
    expect(view.findAll('[data-test="candle"]')).toHaveLength(1);
  });
  it('keeps the selected pair when an old request finishes later', async () => {
    let finish!: (v: (typeof candle)[]) => void;
    vi.mocked(getMarketCandles).mockImplementation((symbol) =>
      symbol === 'BTCUSDT'
        ? new Promise((r) => {
            finish = r;
          })
        : Promise.resolve([{ ...candle, close: '2500' }]),
    );
    const view = await createView();
    await flushPromises();
    await view.get('[data-test="market-symbol"]').trigger('click');
    await view.get('input[value="ETHUSDT"]').setValue(true);
    await view.get('[data-test="sheet-confirm"]').trigger('click');
    await flushPromises();
    finish([candle]);
    await flushPromises();
    expect(view.get('[data-test="chart-summary"]').text()).toContain('2,500');
    expect(view.get('[data-test="market-symbol"]').text()).toContain('ETH/USDT');
    expect(view.vm.$router.currentRoute.value.path).toBe('/market/ETHUSDT');
  });
  it('offers retry after a candle load fails', async () => {
    vi.mocked(getMarketCandles).mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue([candle]);
    const view = await createView();
    await flushPromises();
    expect(view.find('[data-test="market-error"]').exists()).toBe(true);
    await view.get('[data-test="market-retry"]').trigger('click');
    await flushPromises();
    expect(view.find('[data-test="market-error"]').exists()).toBe(false);
    expect(view.findAll('[data-test="candle"]')).toHaveLength(1);
  });
});
