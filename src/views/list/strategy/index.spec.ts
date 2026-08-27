import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n';
import { createStrategy } from '@/api';
import StrategyPage from './index.vue';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/api', () => ({
  checkExchange: vi.fn(),
  createStrategy: vi.fn(),
}));

vi.mock('@/mobile/app-context', () => ({
  getAppContext: () => ({ timeZone: 'America/New_York', timeZoneOffsetMinutes: -240 }),
}));

vi.mock('@/views/list/components/ExchangeSelection.vue', () => ({
  default: { template: '<div />' },
}));

describe('strategy creation page', () => {
  beforeEach(() => vi.mocked(createStrategy).mockReset());

  it('writes the average-down confirmation back to the strategy', async () => {
    const wrapper = mount(StrategyPage, {
      global: {
        plugins: [i18n],
        stubs: {
          CoinSelection: true,
          ExchangeSelection: true,
          StrategyBasicInfo: true,
          FrequencySetting: true,
          PriceRangeSetting: true,
          CoinDistribution: true,
          CoinAverageDown: {
            props: ['strategy'],
            emits: ['confirm'],
            template: `<button data-test="confirm-average-down"
              @click="$emit('confirm', { ...strategy, condition: 'last_average' })">confirm</button>`,
          },
          StrategyCreation: {
            props: ['strategy'],
            template: '<div data-test="strategy-condition">{{ strategy.condition }}</div>',
          },
          'nut-divider': true,
          'nut-row': true,
          'nut-col': true,
          'nut-cell': true,
        },
      },
    });

    await wrapper.get('[data-test="confirm-average-down"]').trigger('click');

    expect(wrapper.get('[data-test="strategy-condition"]').text()).toBe('last_average');
  });

  it('initializes and submits the exact native IANA schedule zone', async () => {
    const wrapper = mount(StrategyPage, {
      global: {
        plugins: [i18n],
        stubs: {
          CoinSelection: true,
          ExchangeSelection: true,
          StrategyBasicInfo: true,
          FrequencySetting: true,
          PriceRangeSetting: true,
          CoinDistribution: true,
          CoinAverageDown: true,
          StrategyCreation: {
            props: ['strategy'],
            emits: ['create', 'update:strategy'],
            template: `<div>
              <span data-test="schedule-zone">{{ strategy.schedule_timezone }}</span>
              <button data-test="prepare" @click="$emit('update:strategy', {
                exchange_id: 1, instalment: '10', cron: '0 21 * * *',
                schedule_timezone: 'America/New_York'
              })">prepare</button>
              <button data-test="create" @click="$emit('create')">create</button>
            </div>`,
          },
          'nut-divider': true,
          'nut-row': true,
          'nut-col': true,
          'nut-cell': true,
        },
      },
    });

    expect(wrapper.get('[data-test="schedule-zone"]').text()).toBe('America/New_York');
    await wrapper.get('[data-test="prepare"]').trigger('click');
    await wrapper.get('[data-test="create"]').trigger('click');
    await flushPromises();

    expect(createStrategy).toHaveBeenCalledWith(
      expect.objectContaining({
        schedule_timezone: 'America/New_York',
      }),
    );
  });
});
