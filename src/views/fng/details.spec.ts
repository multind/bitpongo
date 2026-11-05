import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { i18n } from '@/i18n';
import FngDetails from './details.vue';
import { getFngExecutions, getFngPerformance, getFngPositions, getFngStrategy } from '@/api/fngStrategies';

vi.mock('@/api/fngStrategies', () => ({
  getFngStrategy: vi.fn(),
  getFngPerformance: vi.fn(),
  getFngPositions: vi.fn(),
  getFngExecutions: vi.fn(),
  setFngStrategyEnabled: vi.fn(),
  deleteFngStrategy: vi.fn(),
}));
vi.mock('@nutui/nutui', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showDialog: vi.fn(),
  showToast: { success: vi.fn(), fail: vi.fn() },
}));
vi.mock('@/api/presets', () => ({
  getPresetVisibility: vi.fn().mockResolvedValue({ public: false }),
  updatePresetVisibility: vi.fn(),
}));

const strategy = {
  id: 1,
  name: 'BTC F&G Alert',
  exchange: 'binance',
  exchangeId: 1,
  symbol: 'BTCUSDT',
  upperLimitValue: 75,
  upperLimitInterval: 5,
  lowerLimitValue: 25,
  lowerLimitInterval: 5,
  basicAmount: '100',
  increaseRatio: '10',
  leverage: 5,
  bureauPeriod: 7,
  direction: 'LONG' as const,
  profitTargetPercent: '10',
  profitDrawdownPercent: '5',
  profitTargetType: 'PERCENT' as const,
  maxOrders: 2,
  maxPositions: 2,
  enabled: true,
  createdAt: '2026-10-20T00:00:00Z',
};
let wrapper: ReturnType<typeof mount> | null = null;

async function mountView() {
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/fng/details/:id', component: { template: '<div />' } }],
  });
  await router.push('/fng/details/1');
  wrapper = mount(FngDetails, { global: { plugins: [i18n, router] } });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  vi.mocked(getFngStrategy).mockResolvedValue(strategy);
  vi.mocked(getFngPerformance).mockResolvedValue({
    totalMargin: '100',
    realizedPnl: '12.5',
    winRate: '66.67',
    totalTrades: 3,
    openPositions: 1,
    closedPositions: 2,
    curve: [
      { time: '2026-10-24T00:00:00Z', pnl: '5' },
      { time: '2026-10-25T00:00:00Z', pnl: '12.5' },
    ],
  });
  vi.mocked(getFngPositions).mockResolvedValue({
    items: [
      {
        id: 1,
        symbol: 'BTCUSDT',
        side: 'LONG',
        status: 'CLOSED',
        quantity: '0.01',
        margin: '100',
        entryPrice: '60000',
        exitPrice: '63000',
        realizedPnl: '30',
        pnlPercent: '30',
        leverage: 5,
        closeReason: 'TARGET',
        openedAt: '2026-10-23T00:00:00Z',
        closedAt: '2026-10-24T00:00:00Z',
      },
    ],
    page: 0,
    size: 20,
    total: 1,
    hasMore: false,
  });
  vi.mocked(getFngExecutions).mockResolvedValue({
    items: [
      {
        id: 1,
        positionId: 1,
        event: 'ENTRY',
        status: 'CLOSED',
        symbol: 'BTCUSDT',
        side: 'LONG',
        price: '60000',
        quantity: '0.01',
        reason: null,
        occurredAt: '2026-10-23T00:00:00Z',
      },
    ],
    page: 0,
    size: 20,
    total: 1,
    hasMore: false,
  });
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.resetAllMocks();
});

describe('F&G strategy details', () => {
  it('shows performance and the four unified tabs', async () => {
    const view = await mountView();
    expect(view.text()).toContain('BTC F&G Alert');
    expect(view.text()).toContain('12.5');
    expect(view.text()).toContain('66.67%');
    expect(view.findAll('.detail-tab')).toHaveLength(4);
    expect(view.findAll('.fng-action-bar .nut-button')).toHaveLength(3);
    await view.findAll('.detail-tab')[1].trigger('click');
    expect(view.text()).toContain('Upper limit');
    await view.findAll('.detail-tab')[2].trigger('click');
    expect(view.text()).toContain('60000');
    expect(view.text()).toContain('63000');
    await view.findAll('.detail-tab')[3].trigger('click');
    expect(view.text()).toContain('Entry');
  });
});
