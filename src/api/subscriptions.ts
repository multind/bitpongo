import { http } from '@/utils/request';
export interface StrategySubscription {
  enabled: boolean;
  fearThreshold: number;
  greedThreshold: number;
}
export function getStrategySubscription() {
  return http.get<StrategySubscription | null>('/strategy-subscriptions/fear-greed');
}
export function saveStrategySubscription(data: StrategySubscription) {
  return http.put<void>('/strategy-subscriptions/fear-greed', data);
}
export function deleteStrategySubscription() {
  return http.delete<void>('/strategy-subscriptions/fear-greed');
}
