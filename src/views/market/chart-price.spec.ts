import { describe, expect, it } from 'vitest';
import { chartPriceAt, formatChartPrice } from './chart-price';

describe('chart price selection', () => {
  it('rounds the selected price to the pair tick size without floating point tails', () => {
    expect(formatChartPrice(123.456789, '0.01000000')).toBe('123.46');
    expect(formatChartPrice(1.2345, '0.05000000')).toBe('1.25');
    expect(formatChartPrice(0.0000123456, '0.00000001')).toBe('0.00001235');
    expect(formatChartPrice(12, null)).toBeNull();
  });
  it('maps a touch in the plot to its price and rejects touches outside the plot', () => {
    expect(chartPriceAt(150, 100, 300, 600, 100, 200)).toBeCloseTo(200 - (80 / 520) * 100);
    expect(chartPriceAt(105, 100, 300, 600, 100, 200)).toBeNull();
    expect(chartPriceAt(390, 100, 300, 600, 100, 200)).toBeNull();
    expect(chartPriceAt(150, 100, 0, 600, 100, 200)).toBeNull();
  });
});
