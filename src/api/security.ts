import { http } from '@/utils/request';
export const securityStatus = () => http.get<{ emailEnabled: boolean }>('/users/security/status');
export const changePassword = (body: { oldPassword: string; newPassword: string }) => http.post<void>('/users/security/password', body);
export const requestEmailCode = (body: { purpose: 'RESET' | 'EMAIL'; email: string; oldPassword?: string }) =>
  http.post<{ challengeId: string }>('/users/security/code', body);
export const resetPassword = (body: { challengeId: string; code: string; newPassword: string }) =>
  http.post<void>('/users/security/reset', body);
export const changeEmail = (body: { challengeId: string; code: string; oldPassword: string }) =>
  http.post<void>('/users/security/email', body);
