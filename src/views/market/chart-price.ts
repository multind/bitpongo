export function chartPriceAt(y: number, top: number, height: number, chartHeight: number, low: number, high: number): number | null {
  if (![y, top, height, chartHeight, low, high].every(Number.isFinite) || height <= 0 || chartHeight <= 80 || low >= high) return null;
  const plotY = ((y - top) / height) * chartHeight - 20;
  const plotHeight = chartHeight - 80;
  if (plotY < 0 || plotY > plotHeight) return null;
  const price = high - (plotY / plotHeight) * (high - low);
  return price > 0 ? price : null;
}
