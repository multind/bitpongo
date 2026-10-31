import { describe, expect, it } from 'vitest';
import { chartPriceAt } from './chart-price';

describe('chart price selection', () => {
  it('maps a touch in the plot to its price and rejects touches outside the plot', () => {
    expect(chartPriceAt(150, 100, 300, 600, 100, 200)).toBeCloseTo(200 - (80 / 520) * 100);
    expect(chartPriceAt(105, 100, 300, 600, 100, 200)).toBeNull();
    expect(chartPriceAt(390, 100, 300, 600, 100, 200)).toBeNull();
    expect(chartPriceAt(150, 100, 0, 600, 100, 200)).toBeNull();
  });
});
