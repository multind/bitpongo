import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { i18n } from '@/i18n';
import FngCreate from './create.vue';
import { createFngStrategy } from '@/api/fngStrategies';
import { getExchangeList } from '@/api';
import { getMarketSymbols, getMarketTickers } from '@/api/market';
import { getFearGreed } from '@/api/indicators';
import { getPreset } from '@/api/presets';

vi.mock('@/api/fngStrategies', () => ({ createFngStrategy: vi.fn() }));
vi.mock('@/api', () => ({ getExchangeList: vi.fn() }));
vi.mock('@/api/market', () => ({ getMarketSymbols: vi.fn(), getMarketTickers: vi.fn() }));
vi.mock('@/api/indicators', () => ({ getFearGreed: vi.fn() }));
vi.mock('@/api/presets', () => ({ getPreset: vi.fn() }));
vi.mock('@nutui/nutui', () => ({ showToast: { success: vi.fn(), fail: vi.fn() } }));

let wrapper: ReturnType<typeof mount> | null = null;

beforeEach(() => {
  vi.mocked(getExchangeList).mockResolvedValue([
    { id: 1, name: 'Binance', exchange: 'binance', access_key: '', secret_key: '', password: '', status: 'active', created_at: '' },
  ]);
  vi.mocked(getMarketSymbols).mockResolvedValue([]);
  vi.mocked(getMarketTickers).mockResolvedValue([]);
  vi.mocked(getFearGreed).mockResolvedValue({ points: [], fetchedAt: '', stale: false, sourceUrl: '' });
  vi.mocked(createFngStrategy).mockResolvedValue(1);
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.resetAllMocks();
});

describe('F&G strategy creation', () => {
  it('submits valid defaults with a name', async () => {
    i18n.global.locale.value = 'en-us';
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/fng/create', component: { template: '<div />' } },
        { path: '/list', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
      ],
    });
    await router.push('/fng/create');
    wrapper = mount(FngCreate, {
      global: {
        plugins: [i18n, router],
        stubs: { SheetSelect: { props: ['modelValue', 'label', 'options'], template: '<div />' } },
      },
    });
    await flushPromises();
    await wrapper.get('[data-test="fng-name"]').setValue('BTC F&G Alert');
    await wrapper.get('[data-test="fng-save"]').trigger('click');
    await flushPromises();
    expect(createFngStrategy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'BTC F&G Alert', exchangeId: 1, symbol: 'BTCUSDT', upperLimitValue: 75, lowerLimitValue: 25 }),
    );
    expect(router.currentRoute.value.path).toBe('/list');
  });

  it('shows the suggested amount for the lower trigger band', async () => {
    vi.mocked(getFearGreed).mockResolvedValue({
      points: [{ value: 22, classification: 'Fear', observedAt: '2026-10-25T00:00:00Z' }],
      fetchedAt: '2026-10-25T00:00:00Z',
      stale: false,
      sourceUrl: '',
    });
    i18n.global.locale.value = 'en-us';
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/fng/create', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
      ],
    });
    await router.push('/fng/create');
    wrapper = mount(FngCreate, {
      global: {
        plugins: [i18n, router],
        stubs: { SheetSelect: { props: ['modelValue', 'label', 'options'], template: '<div />' } },
      },
    });
    await flushPromises();
    expect(wrapper.get('[data-test="fng-suggested"]').text()).toContain('110 USDT');
    expect(wrapper.get('[data-test="fng-suggested"]').text()).toContain('1.10x');
  });

  it('applies a preset loaded from the strategy square', async () => {
    vi.mocked(getPreset).mockResolvedValue({
      key: 'fng:9',
      type: 'FNG',
      name: 'Copied F&G',
      author: 'Bitpongo',
      official: true,
      recommended: true,
      followers: 0,
      favorite: false,
      totalRevenue: null,
      totalRatio: null,
      exchange: 'binance',
      symbols: ['BTC'],
      runtimeDays: 1,
      sparkline: [],
      params: {
        name: 'Copied F&G',
        symbol: 'BTCUSDT',
        upperLimitValue: 80,
        upperLimitInterval: 4,
        lowerLimitValue: 20,
        lowerLimitInterval: 6,
        basicAmount: '250',
        increaseRatio: '15',
        leverage: 3,
        bureauPeriod: 9,
        direction: 'SHORT',
        profitTargetPercent: '12',
        profitDrawdownPercent: '6',
        profitTargetType: 'PERCENT',
        maxOrders: 4,
        maxPositions: 2,
      },
    });
    i18n.global.locale.value = 'en-us';
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/fng/create', component: { template: '<div />' } },
        { path: '/list', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
      ],
    });
    await router.push('/fng/create?presetKey=fng:9');
    wrapper = mount(FngCreate, {
      global: {
        plugins: [i18n, router],
        stubs: { SheetSelect: { props: ['modelValue', 'label', 'options'], template: '<div />' } },
      },
    });
    await flushPromises();
    expect(getPreset).toHaveBeenCalledWith('fng:9');
    await wrapper.get('[data-test="fng-save"]').trigger('click');
    await flushPromises();
    expect(createFngStrategy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Copied F&G',
        upperLimitValue: 80,
        lowerLimitValue: 20,
        basicAmount: '250',
        leverage: 3,
        bureauPeriod: 9,
        direction: 'SHORT',
        maxOrders: 4,
        maxPositions: 2,
      }),
    );
  });

  it('does not submit without a name', async () => {
    i18n.global.locale.value = 'en-us';
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/fng/create', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
      ],
    });
    await router.push('/fng/create');
    wrapper = mount(FngCreate, {
      global: {
        plugins: [i18n, router],
        stubs: { SheetSelect: { props: ['modelValue', 'label', 'options'], template: '<div />' } },
      },
    });
    await flushPromises();
    await wrapper.get('[data-test="fng-save"]').trigger('click');
    await flushPromises();
    expect(createFngStrategy).not.toHaveBeenCalled();
  });
});
