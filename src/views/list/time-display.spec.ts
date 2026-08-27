import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n';
import { setDisplayTimeZonePreference } from '@/mobile/app-context';
import PlanCard from './components/PlanCard.vue';

vi.mock('chart.js/auto', () => ({ Chart: vi.fn() }));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() }),
}));

const ContainerStub = defineComponent({ template: '<div><slot /></div>' });

afterEach(() => setDisplayTimeZonePreference('FOLLOW_DEVICE', null));

describe('plan time display', () => {
  it('shows schedule time first and fixed display time second', () => {
    setDisplayTimeZonePreference('FIXED', 'Asia/Tokyo');
    const wrapper = mount(PlanCard, {
      props: {
        plan: {
          id: 1,
          status: 'active',
          created_at: '2026-08-25T13:00:00Z',
          next_time: '2026-08-25T13:00:00Z',
          total_funds: 0,
          total_revenue: 0,
          total_ratio: 0,
          total_value: 0,
          triggered_count: 0,
          snapshots: [],
          coins: [],
          strategy: {
            name: 'Plan',
            frequency: 'daily',
            instalment: 10,
            schedule_timezone: 'America/New_York',
          },
        },
      },
      global: {
        plugins: [i18n],
        stubs: {
          'nut-row': ContainerStub,
          'nut-col': ContainerStub,
          'nut-space': ContainerStub,
          'nut-avatar-group': ContainerStub,
          'nut-avatar': ContainerStub,
          'nut-button': ContainerStub,
          Share: true,
          PlayStop: true,
          PlayStart: true,
          CheckDisabled: true,
          Order: true,
        },
      },
    });

    const text = wrapper.get('[data-test="next-buy-time"]').text();
    expect(text).toContain('2026-08-25 09:00 America/New_York');
    expect(wrapper.text()).toContain('2026-08-25 22:00 Asia/Tokyo');
  });
});
