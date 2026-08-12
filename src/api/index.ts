import { http } from '@/utils/request';
import type { CheckExchangeData, CreateExchangeData } from '@/views/list/types/exchange.ts';
import type { Strategy } from '@/views/list/types/strategy.ts';

/**
 * 账号密码登录
 * @returns UseAxiosReturn
 */
export function loginPassword(data: { username: string; password: string }) {
  return http.post('/users/login', data);
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
  return http.get('/exchanges/list');
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

export function ding(data: any) {
  return http.post('/users/ding', data);
}

export function noticeInfo() {
  return http.get('/users/notices');
}
