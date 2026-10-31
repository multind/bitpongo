import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import CandleChart from './CandleChart.vue';
it('uses the taller detail plot without clipping candle bodies or the time labels', () => {
  const view = mount(CandleChart, {
    props: {
      label: 'detail',
      height: 600,
      candles: [{ openTime: 1790985600000, closeTime: 1790989199999, open: '100', high: '110', low: '90', close: '105', volume: '1' }],
    },
  });
  expect(view.get('svg').attributes('viewBox')).toBe('0 0 640 600');
  const rect = view.get('rect');
  expect(Number(rect.attributes('height'))).toBeGreaterThan(100);
  expect(Number(rect.attributes('y')) + Number(rect.attributes('height'))).toBeLessThan(540);
  expect(view.findAll('text').at(-1)!.attributes('y')).toBe('598');
  view.unmount();
});
it('renders bullish and bearish candles using the selected color convention', () => {
  const candle = { openTime: 1790985600000, closeTime: 1790989199999, open: '100', high: '110', low: '90', close: '105', volume: '1' };
  const view = mount(CandleChart, {
    props: { label: 'chart', colorMode: 'RED_UP', candles: [candle, { ...candle, openTime: candle.openTime + 3600000, close: '95' }] },
  });
  expect(view.findAll('rect').map((r) => r.attributes('fill'))).toEqual(['#dc2626', '#16a34a']);
  view.unmount();
});
