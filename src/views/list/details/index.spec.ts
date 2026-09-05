import { defineComponent, nextTick } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlanDetails from './index.vue';

const mocks = vi.hoisted(() => ({
  getPlanInfo: vi.fn(),
  getPlanOrders: vi.fn(),
  updatePlanName: vi.fn(),
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
  updatePlanName: mocks.updatePlanName,
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

const TabsStub = defineComponent({
  props: { autoHeight: Boolean },
  template: '<div class="nut-tabs" :data-auto-height="String(autoHeight)"><slot name="titles" /><slot /></div>',
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

const NutInputStub = defineComponent({
  props: { modelValue: String },
  emits: ['update:modelValue'],
  template: '<input data-test="strategy-name-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

const EditStub = defineComponent({
  emits: ['click'],
  template: '<button data-test="edit-strategy-name" @click="$emit(\'click\')">edit</button>',
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
        'nut-tabs': TabsStub,
        'nut-tab-pane': TabPaneStub,
        'nut-divider': PassthroughStub,
        'nut-sticky': PassthroughStub,
        'nut-popup': PassthroughStub,
        'nut-pull-refresh': PullRefreshStub,
        'nut-infinite-loading': InfiniteLoadingStub,
        'nut-empty': PassthroughStub,
        'nut-input': NutInputStub,
        'nut-button': NutButtonStub,
        PlayStop: true,
        PlayStart: true,
        CheckDisabled: true,
        Edit: EditStub,
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
    mocks.updatePlanName.mockResolvedValue(undefined);
    mocks.updatePlanStatus.mockResolvedValue(undefined);
  });

  it('persists a renamed strategy before updating the displayed name', async () => {
    const wrapper = mountDetails();
    await flushPromises();

    await wrapper.get('.nut-icon-edit').trigger('click');
    await wrapper.get('[data-test="strategy-name-input"]').setValue('新的策略名称');
    await buttonByText(wrapper, '保存').trigger('click');
    await flushPromises();

    expect(mocks.updatePlanName).toHaveBeenCalledWith(7, '新的策略名称');
    expect(wrapper.text()).toContain('新的策略名称');
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

  it('sizes the tabs to the active pane while keeping trade history in the WebView scroll flow', async () => {
    const wrapper = mountDetails();
    await flushPromises();

    expect(wrapper.get('.nut-tabs').attributes('data-auto-height')).toBe('true');

    let panes = wrapper.findAll('.nut-tab-pane');
    expect(panes[0].attributes('style')).toContain('height: auto');
    expect(panes[0].attributes('style')).toContain('overflow: visible');
    expect(panes[1].attributes('style')).toMatch(/height: 0(?:px)?/);
    expect(panes[2].attributes('style')).toMatch(/height: 0(?:px)?/);

    await wrapper.findAll('.custom-tab-item')[2].trigger('click');
    await nextTick();

    expect(wrapper.findAll('.custom-title')[2].classes()).toContain('active');
    panes = wrapper.findAll('.nut-tab-pane');
    expect(panes[0].attributes('style')).toMatch(/height: 0(?:px)?/);
    expect(panes[2].attributes('style')).toContain('height: auto');
    expect(panes[2].attributes('style')).toContain('overflow: visible');
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
