export function chartPriceAt(y: number, top: number, height: number, chartHeight: number, low: number, high: number): number | null {
  if (![y, top, height, chartHeight, low, high].every(Number.isFinite) || height <= 0 || chartHeight <= 80 || low >= high) return null;
  const plotY = ((y - top) / height) * chartHeight - 20;
  const plotHeight = chartHeight - 80;
  if (plotY < 0 || plotY > plotHeight) return null;
  const price = high - (plotY / plotHeight) * (high - low);
  return price > 0 ? price : null;
}
export function formatChartPrice(price: number, tickSize: string | null | undefined): string | null {
  if (!Number.isFinite(price) || price <= 0 || price >= 1e20 || !tickSize || !/^\d+(?:\.\d{1,18})?$/.test(tickSize)) return null;
  const normalized = tickSize.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  const decimals = normalized.split('.')[1]?.length ?? 0;
  const toUnits = (value: string) => BigInt(value.replace('.', ''));
  const tick = toUnits(Number(tickSize).toFixed(18));
  if (tick <= 0n) return null;
  const units = toUnits(price.toFixed(18));
  const rounded = ((units + tick / 2n) / tick) * tick;
  if (rounded <= 0n) return null;
  const digits = rounded.toString().padStart(19, '0');
  return decimals ? `${digits.slice(0, -18)}.${digits.slice(-18).slice(0, decimals)}` : digits.slice(0, -18);
}
