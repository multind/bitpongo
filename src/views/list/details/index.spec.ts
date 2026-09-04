import { defineComponent, nextTick } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { i18n } from '@/i18n';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import tabPaneCss from '@nutui/nutui/dist/packages/tabpane/index.css?inline';

import PlanDetails from './index.vue';

const tabPaneStyle = document.createElement('style');
tabPaneStyle.textContent = tabPaneCss;

beforeAll(() => document.head.append(tabPaneStyle));
afterAll(() => tabPaneStyle.remove());

const mocks = vi.hoisted(() => ({
  getPlanInfo: vi.fn(),
  getPlanOrders: vi.fn(),
  updatePlanStatus: vi.fn(),
  routerBack: vi.fn(),
  connect: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { planId: '7' } }),
  useRouter: () => ({ back: mocks.routerBack }),
}));

vi.mock('@/api', () => ({
  getPlanInfo: mocks.getPlanInfo,
  getPlanOrders: mocks.getPlanOrders,
  updatePlanStatus: mocks.updatePlanStatus,
}));

vi.mock('@/utils/useWebSocket', () => ({
  useWebSocketBase: () => ({ currentPrices: {}, connect: mocks.connect }),
}));

vi.mock('chart.js/auto', () => ({
  Chart: class {},
}));

const PassthroughStub = defineComponent({
  template: '<div><slot name="titles" /><slot name="icon" /><slot name="image" /><slot /></div>',
});

const TabPaneStub = defineComponent({
  template: '<section class="nut-tab-pane"><slot /></section>',
});

const NutButtonStub = defineComponent({
  props: { disabled: Boolean, loading: Boolean },
  emits: ['click'],
  template:
    '<button :disabled="disabled || loading" :data-loading="String(loading)" @click="$emit(\'click\')"><slot name="icon" /><slot /></button>',
});

const PullRefreshStub = defineComponent({
  emits: ['refresh'],
  template: '<div><button data-test="pull-refresh" @click="$emit(\'refresh\')">refresh</button><slot /></div>',
});

const InfiniteLoadingStub = defineComponent({
  emits: ['load-more'],
  template: '<div><slot /><button data-test="load-more" @click="$emit(\'load-more\')">more</button></div>',
});

function planFixture(status = 'active') {
  return {
    id: 7,
    status,
    created_at: '2026-08-24T08:00:00Z',
    next_time: '2026-08-25T08:00:00Z',
    total_revenue: 0,
    total_ratio: 0,
    total_value: 100,
    total_funds: 100,
    triggered_count: 0,
    strategy: {
      name: '测试策略',
      frequency: '每天',
      instalment: 10,
    },
    coins: [],
    snapshots: [],
    orders: [],
  };
}

function mountDetails() {
  return mount(PlanDetails, {
    global: {
      plugins: [i18n],
      stubs: {
        'nut-row': PassthroughStub,
        'nut-col': PassthroughStub,
        'nut-space': PassthroughStub,
        'nut-tag': PassthroughStub,
        'nut-tabs': PassthroughStub,
        'nut-tab-pane': TabPaneStub,
        'nut-divider': PassthroughStub,
        'nut-sticky': PassthroughStub,
        'nut-popup': PassthroughStub,
        'nut-pull-refresh': PullRefreshStub,
        'nut-infinite-loading': InfiniteLoadingStub,
        'nut-empty': PassthroughStub,
        'nut-input': PassthroughStub,
        'nut-button': NutButtonStub,
        PlayStop: true,
        PlayStart: true,
        CheckDisabled: true,
        Edit: true,
        MoreX: true,
      },
    },
  });
}

function buttonByText(wrapper: ReturnType<typeof mountDetails>, label: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes(label));
  if (!button) throw new Error(`Missing button: ${label}`);
  return button;
}

function deferredPromise() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('plan details actions', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'zh-cn';
    vi.clearAllMocks();
    mocks.getPlanInfo.mockResolvedValue(planFixture());
    mocks.getPlanOrders.mockResolvedValue({ items: [], page: 0, size: 20, total: 0, has_more: false });
    mocks.updatePlanStatus.mockResolvedValue(undefined);
  });

  it('shows progress and immediately renders the paused state after the request succeeds', async () => {
    const pending = deferredPromise();
    mocks.updatePlanStatus.mockReturnValueOnce(pending.promise);
    const wrapper = mountDetails();
    await flushPromises();

    const pause = buttonByText(wrapper, '暂停');
    await pause.trigger('click');
    await nextTick();

    expect(pause.attributes('data-loading')).toBe('true');
    expect(mocks.updatePlanStatus).toHaveBeenCalledWith(7, 'stop');

    pending.resolve();
    await flushPromises();

    expect(wrapper.text()).toContain('已暂停');
    expect(wrapper.text()).toContain('恢复');
    expect(wrapper.text()).not.toContain('planCard.resume');
  });

  it('closes the plan and returns to the previous page after the request succeeds', async () => {
    const wrapper = mountDetails();
    await flushPromises();

    await buttonByText(wrapper, '停止').trigger('click');
    await flushPromises();

    expect(mocks.updatePlanStatus).toHaveBeenCalledWith(7, 'close');
    expect(mocks.routerBack).toHaveBeenCalledOnce();
  });

  it('keeps a 16px horizontal safe margin around the details content', async () => {
    const wrapper = mountDetails();
    await flushPromises();

    const style = getComputedStyle(wrapper.get('.details-page').element);
    expect(style.paddingLeft).toBe('16px');
    expect(style.paddingRight).toBe('16px');
  });

  it('keeps trade history panes in the WebView scroll flow instead of creating a nested scroller', async () => {
    const wrapper = mountDetails();
    await flushPromises();

    const paneStyle = getComputedStyle(wrapper.findAll('.nut-tab-pane')[2].element);
    expect(paneStyle.height).toBe('auto');
    expect(paneStyle.overflow).toBe('visible');
  });

  it('replaces trade history on pull refresh and appends the next page at the bottom', async () => {
    mocks.getPlanOrders
      .mockResolvedValueOnce({
        items: [{ id: 1, symbol: 'BTC/USDT', created_at: '2026-08-24T08:00:00Z' }],
        page: 0,
        size: 20,
        total: 2,
        has_more: true,
      })
      .mockResolvedValueOnce({
        items: [{ id: 2, symbol: 'ETH/USDT', created_at: '2026-08-23T08:00:00Z' }],
        page: 1,
        size: 20,
        total: 2,
        has_more: false,
      })
      .mockResolvedValueOnce({
        items: [{ id: 3, symbol: 'SOL/USDT', created_at: '2026-08-25T08:00:00Z' }],
        page: 0,
        size: 20,
        total: 1,
        has_more: false,
      });
    const wrapper = mountDetails();
    await flushPromises();

    expect(mocks.getPlanInfo).toHaveBeenCalledWith('7', false);
    expect(mocks.getPlanOrders).toHaveBeenCalledWith('7', 0, 20);
    expect(wrapper.text()).toContain('BTC/USDT');

    await wrapper.get('[data-test="load-more"]').trigger('click');
    await flushPromises();
    expect(mocks.getPlanOrders).toHaveBeenCalledWith('7', 1, 20);
    expect(wrapper.text()).toContain('ETH/USDT');

    await wrapper.get('[data-test="pull-refresh"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('SOL/USDT');
    expect(wrapper.text()).not.toContain('BTC/USDT');
  });
});
