import { http } from '@/utils/request';
export type MarketColorMode = 'GREEN_UP' | 'RED_UP';
export interface UserProfile {
  name: string;
  country: string;
  introduction: string;
  upDownColor: MarketColorMode;
}
export function getUserProfile() {
  return http.get<UserProfile>('/users/profile/details');
}
export function saveUserProfile(profile: UserProfile) {
  return http.put<UserProfile>('/users/profile/details', profile);
}
