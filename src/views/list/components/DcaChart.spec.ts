import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DcaChart from './DcaChart.vue';

describe('DcaChart', () => {
  it('renders a filled smooth curve with sparse axis labels', () => {
    const wrapper = mount(DcaChart, {
      props: {
        values: [0, 10, 20, 30],
        labels: ['17/13:00', '18/13:00', '19/13:00', '20/13:00'],
        ariaLabel: 'Return curve',
      },
    });

    expect(wrapper.find('.chart-svg').exists()).toBe(true);
    expect(wrapper.findAll('path')).toHaveLength(2);
    expect(wrapper.find('circle').exists()).toBe(true);
    expect(wrapper.findAll('.chart-axis span').map((item) => item.text())).toEqual(['17/13:00', '18/13:00', '20/13:00']);
  });

  it('shows an empty state when there is not enough data', () => {
    const wrapper = mount(DcaChart, {
      props: { values: [10], labels: ['17/13:00'], emptyText: 'No return curve yet' },
    });

    expect(wrapper.find('.chart-svg').exists()).toBe(false);
    expect(wrapper.text()).toContain('No return curve yet');
  });
});
