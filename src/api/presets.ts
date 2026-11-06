import { http } from '@/utils/request';

export type PresetType = 'FNG' | 'DCA';

export interface PresetParams {
  name?: string;
  instalment?: number;
  frequency?: string;
  cron?: string;
  condition?: string;
  scheduleTimezone?: string;
  fearThreshold?: number;
  greedThreshold?: number;
  coins?: Array<{
    symbol: string;
    proportion: string;
    min: string | null;
    max: string | null;
    averageDown: boolean;
  }>;
  symbol?: string;
  upperLimitValue?: number;
  upperLimitInterval?: number;
  lowerLimitValue?: number;
  lowerLimitInterval?: number;
  basicAmount?: string;
  increaseRatio?: string;
  leverage?: number;
  maxTradeRounds?: number | null;
  direction?: 'LONG' | 'SHORT';
  profitTargetPercent?: string;
  profitDrawdownPercent?: string;
  stopLossPercent?: string | null;
  profitTargetType?: 'PERCENT' | 'USDT';
  maxOrders?: number;
  maxPositions?: number;
}

export interface PresetItem {
  authorAvatar?: string | null;
  key: string;
  type: PresetType;
  name: string;
  author: string;
  official: boolean;
  recommended: boolean;
  followers: number;
  favorite: boolean;
  totalRevenue: string | null;
  totalRatio: string | null;
  exchange: string;
  symbols: string[];
  runtimeDays: number | null;
  sparkline: string[];
  params: PresetParams;
}

export interface PresetPage {
  items: PresetItem[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
}

export interface PresetQuery {
  q?: string;
  sort?: 'comprehensive' | 'return' | 'followers';
  owner?: 'all' | 'official' | 'user';
  exchange?: 'all' | 'binance' | 'okx';
  runtime?: 'all' | '1-50' | '51-100' | '100+';
  type?: 'all' | 'dca' | 'fng';
  page?: number;
  size?: number;
}

export const listPresets = (params: PresetQuery) => http.get<PresetPage>('/presets', { params });

export const getPreset = (key: string) => http.get<PresetItem>(`/presets/${encodeURIComponent(key)}`);

export const togglePresetFavorite = (key: string) =>
  http.post<{ favorite: boolean; followers: number }>(`/presets/${encodeURIComponent(key)}/favorite`);

export interface PresetVisibility {
  public: boolean;
}

/** Whether one of the current user's own strategies is listed in the strategy plaza (opt-in). */
export function getPresetVisibility(type: PresetType, strategyId: number | string): Promise<PresetVisibility> {
  return http.get<PresetVisibility>(`/presets/visibility/${type}/${strategyId}`);
}

export function updatePresetVisibility(type: PresetType, strategyId: number | string, visible: boolean): Promise<PresetVisibility> {
  return http.put<PresetVisibility>(`/presets/visibility/${type}/${strategyId}`, { public: visible });
}
