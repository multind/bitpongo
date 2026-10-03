import { http } from '@/utils/request';
export interface FearGreedPoint {
  value: number;
  classification: string;
  observedAt: string;
}
export interface FearGreedHistory {
  points: FearGreedPoint[];
  fetchedAt: string;
  stale: boolean;
  sourceUrl: string;
}
export function getFearGreed(limit = 30) {
  return http.get<FearGreedHistory>('/market/indicators/fear-greed', { params: { limit } });
}
