import { http } from '@/utils/request';

export interface MarketSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}
export interface MarketTicker {
  symbol: string;
  lastPrice: string;
  changePercent: string;
  volume: string;
  updatedAt: string;
}
export interface MarketCandle {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}
export function getMarketSymbols(q = '') {
  return http.get<MarketSymbol[]>('/market/symbols', { params: { q } });
}
export function getMarketTickers() {
  return http.get<MarketTicker[]>('/market/tickers');
}
export function getMarketCandles(symbol: string, interval: string, limit = 120) {
  return http.get<MarketCandle[]>('/market/candles', { params: { symbol, interval, limit } });
}
