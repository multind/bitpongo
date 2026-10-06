import { http } from '@/utils/request';
export interface LoginSession {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
}
export const getSessions = () => http.get<{ items: LoginSession[] }>('/users/sessions');
export const revokeSession = (id: string) => http.delete<void>(`/users/sessions/${encodeURIComponent(id)}`);
