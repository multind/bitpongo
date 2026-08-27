import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { i18n } from '@/i18n';
import CoinSelection from './CoinSelection.vue';

describe('CoinSelection', () => {
  afterEach(() => {
    i18n.global.locale.value = 'zh-cn';
  });

  it('lets the English action use its intrinsic width instead of a six-column grid width', () => {
    i18n.global.locale.value = 'en-us';
    const wrapper = mount(CoinSelection, {
      props: {
        strategy: {
          id: 0,
          name: '',
          exchange_id: 1,
          instalment: '10',
          cron: '',
          schedule_timezone: 'UTC',
          frequency: '',
          coins: [],
          condition: '0',
        },
      },
      global: {
        plugins: [i18n],
        stubs: {
          'nut-row': {
            template: '<div><slot /></div>',
          },
          'nut-col': {
            props: ['span'],
            template: '<div :data-span="span"><slot /></div>',
          },
          'nut-avatar-group': {
            template: '<div><slot /></div>',
          },
          'nut-avatar': {
            template: '<div><slot /></div>',
          },
          'nut-button': {
            template: '<button><slot /></button>',
          },
          CoinPicker: true,
        },
      },
    });

    const action = wrapper.get('[data-test="coin-selection-action"]');
    expect(action.attributes('data-span')).toBeUndefined();
    expect(action.get('button').text()).toBe('Assets to buy');
  });
});
