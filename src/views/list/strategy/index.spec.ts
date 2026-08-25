import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n';
import StrategyPage from './index.vue';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/api', () => ({
  checkExchange: vi.fn(),
  createStrategy: vi.fn(),
}));

vi.mock('@/views/list/components/ExchangeSelection.vue', () => ({
  default: { template: '<div />' },
}));

describe('strategy creation page', () => {
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
});
