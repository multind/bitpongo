import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { i18n } from '@/i18n';
import FngDetails from './details.vue';
import { getFngExecutions, getFngPerformance, getFngPositions, getFngStrategy, setFngTradeRoundLimit } from '@/api/fngStrategies';

vi.mock('@/api/fngStrategies', () => ({
  getFngStrategy: vi.fn(),
  getFngPerformance: vi.fn(),
  getFngPositions: vi.fn(),
  getFngExecutions: vi.fn(),
  setFngStrategyEnabled: vi.fn(),
  setFngTradeRoundLimit: vi.fn(),
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
  maxTradeRounds: 7,
  completedTradeRounds: 2,
  direction: 'LONG' as const,
  profitTargetPercent: '10',
  profitDrawdownPercent: '5',
  stopLossPercent: '30',
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
  wrapper = mount(FngDetails, { attachTo: document.body, global: { plugins: [i18n, router] } });
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
  it('swipes between adjacent tabs in either direction without wrapping', async () => {
    const view = await mountView();
    const selected = () => view.get('.detail-tab[aria-pressed="true"]').text();
    const swipe = async (from: number, to: number) => {
      const panel = view.get('.detail-panel');
      await panel.trigger('touchstart', { touches: [{ identifier: 1, clientX: from, clientY: 120 }] });
      await panel.trigger('touchend', { touches: [], changedTouches: [{ identifier: 1, clientX: to, clientY: 126 }] });
    };
    await swipe(120, 220);
    expect(selected()).toBe('Returns');
    await swipe(240, 120);
    expect(selected()).toBe('Strategy info');
    await swipe(240, 120);
    expect(selected()).toBe('Trade history');
    await swipe(240, 120);
    expect(selected()).toBe('Executions');
    await swipe(240, 120);
    expect(selected()).toBe('Executions');
    await swipe(120, 240);
    expect(selected()).toBe('Trade history');
  });

  it('keeps the current tab on vertical, cancelled, and screen-edge gestures', async () => {
    const view = await mountView();
    const panel = () => view.get('.detail-panel');
    const selected = () => view.get('.detail-tab[aria-pressed="true"]').text();
    const start = (x: number) => panel().trigger('touchstart', { touches: [{ identifier: 1, clientX: x, clientY: 120 }] });
    const end = (x: number, y: number) =>
      panel().trigger('touchend', { touches: [], changedTouches: [{ identifier: 1, clientX: x, clientY: y }] });
    await start(240);
    await end(160, 250);
    expect(selected()).toBe('Returns');
    await start(240);
    await panel().trigger('touchcancel');
    await end(120, 126);
    expect(selected()).toBe('Returns');
    await view.findAll('.detail-tab')[1].trigger('click');
    await start(4);
    await end(124, 126);
    expect(selected()).toBe('Strategy info');
  });

  it('prioritizes realized returns and groups strategy settings without mislabeling a USDT target', async () => {
    vi.mocked(getFngStrategy).mockResolvedValue({ ...strategy, profitTargetType: 'USDT' });
    vi.mocked(getFngPerformance).mockResolvedValue({
      totalMargin: '0',
      realizedPnl: '0',
      winRate: '0',
      totalTrades: 0,
      openPositions: 0,
      closedPositions: 0,
      curve: [],
    });
    const view = await mountView();
    expect(view.get('.heading-title .run-state').text()).toBe('Active');
    expect(view.get('.returns-primary').text()).toMatch(/0\s*USDT/);
    expect(view.find('.returns-primary .positive').exists()).toBe(false);
    expect(view.find('.returns-card .empty-state').exists()).toBe(true);
    const info = view.findAll('.detail-tab')[1];
    await info.trigger('click');
    expect(info.attributes('aria-pressed')).toBe('true');
    expect(view.findAll('.info-group h2').map((heading) => heading.text())).toEqual([
      'Entry conditions',
      'Take profit & stop loss',
      'Trade rounds',
    ]);
    expect(view.findAll('.info-group')[1].text()).toMatch(/10\s*USDT/);
    expect(view.findAll('.info-group')[1].text()).toContain('30%');
  });

  it('lets a paused legacy strategy set an explicit round limit without resuming it', async () => {
    vi.mocked(getFngStrategy)
      .mockResolvedValueOnce({ ...strategy, maxTradeRounds: null, enabled: false })
      .mockResolvedValueOnce({ ...strategy, maxTradeRounds: 4, enabled: false });
    const view = await mountView();
    expect(view.text()).toContain('Set a round limit in Strategy info before resuming.');
    await view.findAll('.detail-tab')[1].trigger('click');
    await view.get('[data-test="fng-round-limit"]').setValue('4');
    await view.get('.round-limit-form button[type="submit"]').trigger('click');
    await flushPromises();
    expect(setFngTradeRoundLimit).toHaveBeenCalledWith(1, 4);
    expect(view.text()).toContain('2 / 4');
    expect(view.text()).toContain('Paused');
  });

  it('shows remaining quantity and manual review for a partial close', async () => {
    const fixture = await getFngPositions(1);
    fixture.items[0] = {
      ...fixture.items[0],
      status: 'CLOSE_REVIEW',
      remainingQuantity: '0.006',
      closedAt: null,
    };
    const view = await mountView();
    await view.findAll('.detail-tab')[2].trigger('click');
    expect(view.text()).toContain('Close needs review');
    expect(view.text()).toContain('Remaining to close');
    expect(view.text()).toContain('0.006');
  });

  it('shows performance and the four unified tabs', async () => {
    const view = await mountView();
    expect(view.text()).toContain('BTC F&G Alert');
    expect(view.text()).toContain('12.5');
    expect(view.text()).toContain('66.67%');
    expect(view.findAll('.detail-tab')).toHaveLength(4);
    expect(view.findAll('.fng-action-bar .nut-button')).toHaveLength(3);
    await view.findAll('.detail-tab')[1].trigger('click');
    expect(view.text()).toContain('Upper limit');
    expect(view.text()).toContain('2 / 7');
    await view.findAll('.detail-tab')[2].trigger('click');
    expect(view.text()).toContain('60000');
    expect(view.text()).toContain('63000');
    await view.findAll('.detail-tab')[3].trigger('click');
    expect(view.text()).toContain('Entry');
  });
});
