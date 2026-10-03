import { http } from '@/utils/request';
export interface WebhookDraft {
  name: string;
  description: string;
  keywords: string;
  allowedIps: string;
}
export interface WebhookRule extends WebhookDraft {
  id: number;
  status: string;
  publicId: string;
}
export interface WebhookActivation {
  publicId: string;
  signingKey: string;
}
export const getWebhooks = () => http.get<WebhookRule[]>('/webhooks');
export const webhookAvailable = () => http.get<boolean>('/webhooks/available');
export const createWebhook = (data: WebhookDraft) => http.post<number>('/webhooks', data);
export const saveWebhook = (id: number, data: WebhookDraft) => http.put<void>(`/webhooks/${id}`, data);
export const activateWebhook = (id: number) => http.post<WebhookActivation>(`/webhooks/${id}/activate`);
export const revokeWebhook = (id: number) => http.delete<void>(`/webhooks/${id}`);
