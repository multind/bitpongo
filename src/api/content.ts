import { http } from '@/utils/request';
export interface ArticleSummary {
  slug: string;
  kind: 'HELP' | 'ARTICLE';
  title: string;
  summary: string;
  publishedAt: string;
}
export interface Article extends ArticleSummary {
  body: string;
}
export interface ContentPage {
  items: ArticleSummary[];
  hasMore: boolean;
}
export interface SearchEntry {
  id: number;
  query: string;
  searchedAt: string;
}
export function listArticles(params: { kind: 'HELP' | 'ARTICLE'; locale: string; q: string; page: number }) {
  return http.get<ContentPage>('/content/articles', { params });
}
export function getArticle(slug: string, locale: string) {
  return http.get<Article>(`/content/articles/${encodeURIComponent(slug)}`, { params: { locale } });
}
export function getSearchHistory() {
  return http.get<SearchEntry[]>('/content/search-history');
}
export function saveSearchHistory(query: string) {
  return http.post<void>('/content/search-history', { query });
}
export function deleteSearchHistory(id: number) {
  return http.delete<void>(`/content/search-history/${id}`);
}
export function clearSearchHistory() {
  return http.delete<void>('/content/search-history');
}
export interface AppRelease {
  available: boolean;
  updateAvailable: boolean;
  latestVersion: string;
  latestBuild: number;
  storeUrl: string;
  releaseNotes: string;
}
export function getAppRelease(params: { platform: 'ios' | 'android'; version: string; build?: number }) {
  return http.get<AppRelease>('/content/app-version', { params });
}
