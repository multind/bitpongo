import { http } from '@/utils/request';

export interface FngStrategyInput {
  name: string;
  exchange: string;
  exchangeId: number | null;
  symbol: string;
  upperLimitValue: number;
  upperLimitInterval: number;
  lowerLimitValue: number;
  lowerLimitInterval: number;
  basicAmount: string;
  increaseRatio: string;
  leverage: number;
  bureauPeriod: number;
  direction: 'LONG' | 'SHORT';
  profitTargetPercent: string;
  profitDrawdownPercent: string;
  profitTargetType: 'PERCENT' | 'USDT';
  maxOrders: number;
  maxPositions: number;
}
export function fngStrategyPage(page = 0) {
  return http.get<{ items: FngStrategy[]; total: number; activeTotal: number; hasMore: boolean }>('/fng-strategies/page', {
    params: { page, size: 10 },
  });
}

export interface FngStrategy extends FngStrategyInput {
  id: number;
  enabled: boolean;
  createdAt: string;
}

export const getFngStrategies = () => http.get<FngStrategy[]>('/fng-strategies');

export const createFngStrategy = (data: FngStrategyInput) => http.post<number>('/fng-strategies', data);

export const updateFngStrategy = (id: number, data: FngStrategyInput) => http.put<void>(`/fng-strategies/${id}`, data);

export const setFngStrategyEnabled = (id: number, enabled: boolean) => http.put<void>(`/fng-strategies/${id}/enabled`, { enabled });

export const deleteFngStrategy = (id: number) => http.delete<void>(`/fng-strategies/${id}`);

export interface FngPosition {
  id: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  status: string;
  quantity: string;
  margin: string;
  entryPrice: string | null;
  exitPrice: string | null;
  realizedPnl: string | null;
  pnlPercent: string | null;
  leverage: number;
  closeReason: string | null;
  openedAt: string;
  closedAt: string | null;
}

export interface FngPositionPage {
  items: FngPosition[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
}

export interface FngExecution {
  id: number;
  positionId: number;
  event: 'ENTRY' | 'EXIT' | 'FAILED';
  status: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  price: string | null;
  quantity: string | null;
  reason: string | null;
  occurredAt: string;
}

export interface FngExecutionPage {
  items: FngExecution[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
}

export interface FngPerformance {
  totalMargin: string;
  realizedPnl: string;
  winRate: string;
  totalTrades: number;
  openPositions: number;
  closedPositions: number;
  curve: Array<{ time: string; pnl: string }>;
}

export const getFngStrategy = (id: number) => http.get<FngStrategy>(`/fng-strategies/${id}`);

export const getFngPositions = (id: number, page = 0, size = 20) =>
  http.get<FngPositionPage>(`/fng-strategies/${id}/positions`, { params: { page, size } });

export const getFngExecutions = (id: number, page = 0, size = 20) =>
  http.get<FngExecutionPage>(`/fng-strategies/${id}/executions`, { params: { page, size } });

export const getFngPerformance = (id: number) => http.get<FngPerformance>(`/fng-strategies/${id}/performance`);
