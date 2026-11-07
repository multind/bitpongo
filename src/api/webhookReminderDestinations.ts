import { http } from '@/utils/request';

export const webhookProviders = ['DINGTALK', 'FEISHU', 'SLACK', 'DISCORD'] as const;
export type WebhookProvider = (typeof webhookProviders)[number];
export type WebhookDestination = { id: number; provider: WebhookProvider; name: string; enabled: boolean; maskedUrl: string };
export type WebhookDraft = Partial<Pick<WebhookDestination, 'provider' | 'name' | 'enabled'>> & { url?: string; signingSecret?: string };
const path = '/users/notifications/webhook-destinations';
export const getWebhookDestinations = () => http.get<{ available: boolean; enabled?: boolean; items: WebhookDestination[] }>(path);
export const setWebhookReminderEnabled = (enabled: boolean) => http.put<void>(`${path}/preference`, { enabled });
export const createWebhookDestination = (draft: WebhookDraft) => http.post<{ id: number }>(path, draft);
export const updateWebhookDestination = (id: number, draft: WebhookDraft) => http.put<void>(`${path}/${id}`, draft);
export const deleteWebhookDestination = (id: number) => http.delete<void>(`${path}/${id}`);
export const testWebhookDestination = (id: number) => http.post<void>(`${path}/${id}/test`);
