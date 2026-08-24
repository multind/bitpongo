import { http } from '@/utils/request';
import type { CheckExchangeData, CreateExchangeData, Exchange } from '@/views/list/types/exchange.ts';
import type { Strategy } from '@/views/list/types/strategy.ts';

export interface UserInfo {
  id: number;
  name: string;
  email: string;
}

export interface AuthSession {
  token: string;
  info: UserInfo;
}

export interface BarkSetting {
  configured: boolean;
  enabled: boolean;
  masked_push_url: string | null;
  locale: 'zh-CN' | 'zh-TW' | 'en-US';
  timezone: string;
  updated_at: string | null;
}

export interface BarkSettingRequest {
  push_url?: string;
  enabled?: boolean;
  locale?: BarkSetting['locale'];
  timezone?: string;
}

export interface BarkTestRequest {
  push_url?: string;
}

/**
 * 账号密码登录
 * @returns UseAxiosReturn
 */
export function loginPassword(data: { username: string; password: string }): Promise<AuthSession> {
  return http.post<AuthSession>('/users/login', data);
}

export function registerAccount(data: { name: string; email: string; password: string }): Promise<AuthSession> {
  return http.post<AuthSession>('/users/register', data);
}

export function deleteAccount(data: { password: string }): Promise<void> {
  return http.delete('/users/account', { data });
}

/**
 * 创建交易所连接
 * @param data - 交易所配置数据
 * @returns Promise<any>
 */
export function createExchange(data: CreateExchangeData) {
  return http.post('/exchanges/create', data);
}

export function getExchangeList() {
  return http.get<Exchange[]>('/exchanges/list');
}

export function deleteExchange(id: string) {
  return http.delete(`/exchanges/${id}`);
}

export function checkExchange(data: CheckExchangeData) {
  return http.post(`/exchanges/check`, data);
}

export function exchangeDetails(id: string) {
  return http.get(`/exchanges/${id}`);
}

export function minimumAmount(data: { exchange_id: number; coins: string[] }) {
  return http.post('/exchanges/minimumAmount', data);
}

export function createStrategy(data: Strategy) {
  return http.post('/strategies/create', data);
}

export function activePlanList() {
  return http.get('/plans/list/active');
}

export function updatePlanStatus(id: string, status: string) {
  return http.get(`/plans/${id}/${status}`);
}

export function getPlanInfo(id: string) {
  return http.get(`/plans/${id}`);
}

export function getBarkSetting(): Promise<BarkSetting> {
  return http.get<BarkSetting>('/users/notifications/bark');
}

export function saveBarkSetting(data: BarkSettingRequest): Promise<BarkSetting> {
  return http.put<BarkSetting>('/users/notifications/bark', data);
}

export function deleteBarkSetting(): Promise<void> {
  return http.delete<void>('/users/notifications/bark');
}

export function testBarkSetting(data: BarkTestRequest = {}): Promise<{ sent: boolean }> {
  return http.post<{ sent: boolean }>('/users/notifications/bark/test', data);
}
