import { http } from '@/utils/request';
export interface Avatar {
  imageData: string | null;
}
export const getAvatar = () => http.get<Avatar>('/users/profile/avatar');
export function uploadAvatar(file: File) {
  const data = new FormData();
  data.append('file', file);
  return http.post<Avatar>('/users/profile/avatar', data);
}
export const deleteAvatar = () => http.delete<Avatar>('/users/profile/avatar');
