import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { i18n } from '@/i18n';
import MarketView from './index.vue';
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
function createView() {
  i18n.global.locale.value = 'en-us';
  vi.mocked(getMarketSymbols).mockResolvedValue([
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
  ]);
  vi.mocked(getMarketTickers).mockResolvedValue([
    { symbol: 'BTCUSDT', lastPrice: '60500', changePercent: '2', volume: '10', updatedAt: '2026-10-03T00:00:00Z' },
  ]);
  const wrapper = mount(MarketView, { global: { plugins: [i18n] } });
  wrappers.push(wrapper);
  return wrapper;
}
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount());
  vi.resetAllMocks();
});

describe('market browsing', () => {
  it('shows real ticker and candles', async () => {
    vi.mocked(getMarketCandles).mockResolvedValue([candle]);
    const view = createView();
    await flushPromises();
    expect(view.text()).toContain('60,500');
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
    const view = createView();
    await flushPromises();
    await view.get('[data-test="market-symbol"]').setValue('ETHUSDT');
    await flushPromises();
    finish([candle]);
    await flushPromises();
    expect(view.get('[data-test="chart-summary"]').text()).toContain('2,500');
    expect(view.get('[data-test="market-symbol"]').element).toHaveProperty('value', 'ETHUSDT');
  });
  it('offers retry after a candle load fails', async () => {
    vi.mocked(getMarketCandles).mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue([candle]);
    const view = createView();
    await flushPromises();
    expect(view.find('[data-test="market-error"]').exists()).toBe(true);
    await view.get('[data-test="market-retry"]').trigger('click');
    await flushPromises();
    expect(view.find('[data-test="market-error"]').exists()).toBe(false);
    expect(view.findAll('[data-test="candle"]')).toHaveLength(1);
  });
});
