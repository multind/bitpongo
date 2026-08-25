import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { i18n } from '@/i18n';
import CoinAverageDown from './CoinAverageDown.vue';

const global = {
  plugins: [i18n],
  stubs: {
    'nut-row': { template: '<div><slot /></div>' },
    'nut-col': { template: '<div><slot /></div>' },
    'nut-cell': { template: '<div><slot name="desc" /></div>' },
    'nut-popup': { template: '<div><slot /></div>' },
    'nut-switch': {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template: '<button data-test="average-down-switch" @click="$emit(\'update:modelValue\', !modelValue)" />',
    },
    'nut-radio-group': { template: '<div><slot /></div>' },
    'nut-radio': { template: '<div><slot /></div>' },
    'nut-button': {
      emits: ['click'],
      template: '<button data-test="confirm-average-down" @click="$emit(\'click\')"><slot /></button>',
    },
  },
};

function strategy(averageDown: boolean) {
  return {
    id: 0,
    name: 'test',
    exchange_id: 1,
    instalment: '100',
    frequency: 'daily',
    condition: '',
    cron: '0 8 * * *',
    coins: [
      {
        symbol: 'BTC',
        icon: '',
        checked: true,
        min: 0,
        max: 0,
        proportion: 100,
        average_down: averageDown,
      },
    ],
  };
}

describe('CoinAverageDown', () => {
  it('keeps edits local until the user confirms them', async () => {
    const original = strategy(false);
    const wrapper = mount(CoinAverageDown, {
      props: { strategy: original },
      global,
    });

    await wrapper.get('[data-test="average-down-switch"]').trigger('click');

    expect(original.coins[0].average_down).toBe(false);
  });

  it('defaults to total average when average-down is enabled without a condition', async () => {
    const wrapper = mount(CoinAverageDown, {
      props: { strategy: strategy(true) },
      global,
    });

    await wrapper.get('[data-test="confirm-average-down"]').trigger('click');

    const [confirmed] = wrapper.emitted('confirm')?.[0] ?? [];
    expect(confirmed).toMatchObject({ condition: 'total_average' });
  });
});
