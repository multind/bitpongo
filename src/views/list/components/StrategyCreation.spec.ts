import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n';
import StrategyCreation from './StrategyCreation.vue';

describe('StrategyCreation timezone preview', () => {
  afterEach(() => {
    vi.useRealTimers();
    i18n.global.locale.value = 'zh-cn';
  });

  it('renders the cron wall clock in the strategy schedule zone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-25T12:00:00Z'));
    const wrapper = mount(StrategyCreation, {
      props: {
        strategy: {
          id: 0,
          name: '',
          exchange_id: 1,
          instalment: '10',
          frequency: 'Daily at 21:00',
          cron: '0 21 * * *',
          schedule_timezone: 'America/New_York',
          condition: '',
          coins: [],
        },
      },
      global: {
        plugins: [i18n],
        stubs: {
          'nut-row': { template: '<div><slot /></div>' },
          'nut-col': { template: '<div><slot /></div>' },
          'nut-button': { template: '<button><slot /></button>' },
          'nut-popup': { template: '<div><slot /></div>' },
          'nut-avatar': { template: '<div><slot /></div>' },
          'nut-avatar-group': { template: '<div><slot /></div>' },
          'nut-divider': { template: '<div />' },
        },
      },
    });

    expect(wrapper.get('[data-test="next-buy-time"]').text()).toContain('21:00 America/New_York');
  });
});
