import { http } from '@/utils/request';
export interface AlertRule {
  id: number;
  name: string;
  symbol: string;
  condition: string;
  target: string | null;
  lower: string | null;
  upper: string | null;
  frequency: string;
  interval: string;
  expiresAt: string | null;
  enabled: boolean;
  triggeredCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
}
export interface AlertPage<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}
export interface AlertEvent {
  id: number;
  ruleId: number | null;
  type: string;
  title: string;
  body: string;
  symbol: string | null;
  price: string | null;
  occurredAt: string;
  readAt: string | null;
}
export type AlertCreate = Pick<
  AlertRule,
  'name' | 'symbol' | 'condition' | 'target' | 'lower' | 'upper' | 'frequency' | 'interval' | 'expiresAt'
>;
export function listAlerts(params: { q?: string; status?: string; page?: number; size?: number }) {
  return http.get<AlertPage<AlertRule>>('/alerts', { params });
}
export function createAlert(data: AlertCreate) {
  return http.post<number>('/alerts', data);
}
export function getAlert(id: number) {
  return http.get<AlertRule>(`/alerts/${id}`);
}
export function setAlertEnabled(id: number, enabled: boolean) {
  return http.put<void>(`/alerts/${id}/enabled`, { enabled });
}
export function deleteAlert(id: number) {
  return http.delete<void>(`/alerts/${id}`);
}
export function copyAlert(id: number) {
  return http.post<number>(`/alerts/${id}/copy`);
}
export function bulkAlerts(ids: number[], action: string) {
  return http.post<void>('/alerts/bulk', { ids, action });
}
export function listAlertEvents(params: { unreadOnly?: boolean; page?: number; size?: number }) {
  return http.get<AlertPage<AlertEvent>>('/alerts/events', { params });
}
export function readAlertEvent(id: number) {
  return http.put<void>(`/alerts/events/${id}/read`);
}
export function readAllAlertEvents() {
  return http.put<void>('/alerts/events/read-all');
}
export function deleteAlertEvent(id: number) {
  return http.delete<void>(`/alerts/events/${id}`);
}
export function clearAlertEvents() {
  return http.delete<void>('/alerts/events');
}
