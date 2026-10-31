import { http } from '@/utils/request';

export type NotificationLevel = 'Strong' | 'ModerateStrong' | 'Moderate' | 'ModerateWeak' | 'Weak';

export interface NotificationChannel {
  enabled: boolean;
  available: boolean;
  level: NotificationLevel;
  sequence: number;
}

export interface NotificationChannels {
  bitpongo: NotificationChannel;
  email: NotificationChannel;
  message: NotificationChannel;
  call: NotificationChannel;
  dingding: NotificationChannel;
  feishu: NotificationChannel;
  telegram: NotificationChannel;
  confirmationEnabled: boolean;
}

export interface NotificationChannelUpdate {
  emailEnabled: boolean;
  messageEnabled: boolean;
  callEnabled: boolean;
  dingdingEnabled: boolean;
  feishuEnabled: boolean;
  telegramEnabled: boolean;
  confirmationEnabled: boolean;
}

export const getNotificationChannels = () => http.get<NotificationChannels>('/users/notifications/channels');
export const saveNotificationOrder = (order: string[]) => http.put<NotificationChannels>('/users/notifications/channels/order', order);

export const saveNotificationChannels = (data: NotificationChannelUpdate) =>
  http.put<NotificationChannels>('/users/notifications/channels', data);
