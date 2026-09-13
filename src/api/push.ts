import { http } from '@/utils/request';
export const pushLocale = (locale: string) => ({ 'en-us': 'en-US', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW' })[locale.toLowerCase()] || 'en-US';
export interface PushSettings {
  available: boolean;
  enabled: boolean;
  tradeSucceeded: boolean;
  tradeFailed: boolean;
  planAlerts: boolean;
  systemAlerts: boolean;
  soundEnabled: boolean;
  locale: string;
  timezone: string;
  deviceCount: number;
}
export type PushPreferences = Omit<PushSettings, 'available' | 'deviceCount'>;
export interface PushDevice {
  installationId: string;
  platform: string;
  appVersion: string;
  enabled: boolean;
  lastSeenAt: string;
  createdAt: string;
}
export const getPushSettings = () => http.get<PushSettings>('/users/notifications/push');
export const savePushSettings = (settings: PushPreferences) => http.put<PushSettings>('/users/notifications/push', settings);
export const getPushDevices = () => http.get<PushDevice[]>('/users/notifications/push/devices');
export const revokePushDevice = (id: string) => http.delete<void>(`/users/notifications/push/devices/${encodeURIComponent(id)}`);
export const testPush = (installationId: string) => http.post<{ queued: true }>('/users/notifications/push/test', { installationId });
