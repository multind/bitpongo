import { isSupportedLocale, type LocaleKey } from '@/i18n';

import { getNativeContext, type NativeContext } from './bridge';

const TIME_ZONE_STORAGE_KEY = 'timeZone';
const TIME_ZONE_OFFSET_STORAGE_KEY = 'timeZoneOffsetMinutes';

export interface AppRuntimeContext {
  locale?: LocaleKey;
  timeZone: string;
  timeZoneOffsetMinutes: number;
}

interface AppContextDependencies {
  loadNativeContext?: () => Promise<NativeContext | null>;
  browserTimeZone?: () => string;
  browserOffsetMinutes?: () => number;
}

let appContext: AppRuntimeContext | null = null;
let fixedDisplayTimeZone: string | null = null;

function defaultBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function defaultBrowserOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export async function initializeAppContext(dependencies: AppContextDependencies = {}): Promise<AppRuntimeContext> {
  const loadNativeContext = dependencies.loadNativeContext ?? getNativeContext;
  let nativeContext: NativeContext | null = null;
  try {
    nativeContext = await loadNativeContext();
  } catch {
    nativeContext = null;
  }

  const browserTimeZone = dependencies.browserTimeZone ?? defaultBrowserTimeZone;
  const browserOffsetMinutes = dependencies.browserOffsetMinutes ?? defaultBrowserOffsetMinutes;
  const nativeTimeZone = nativeContext?.timeZone?.trim();
  const nativeOffset = nativeContext?.timeZoneOffsetMinutes;
  const timeZone = nativeTimeZone || browserTimeZone() || 'UTC';
  const timeZoneOffsetMinutes = Number.isFinite(nativeOffset) ? (nativeOffset as number) : browserOffsetMinutes();
  const locale = isSupportedLocale(nativeContext?.locale) ? nativeContext.locale : undefined;

  appContext = { locale, timeZone, timeZoneOffsetMinutes };
  localStorage.setItem(TIME_ZONE_STORAGE_KEY, timeZone);
  localStorage.setItem(TIME_ZONE_OFFSET_STORAGE_KEY, String(timeZoneOffsetMinutes));
  return appContext;
}

export function getAppContext(): AppRuntimeContext | null {
  return appContext;
}

export function setDisplayTimeZonePreference(mode: 'FOLLOW_DEVICE' | 'FIXED', timeZone: string | null): void {
  fixedDisplayTimeZone = mode === 'FIXED' && timeZone?.trim() ? timeZone.trim() : null;
}

export function displayTimeZone(): string {
  return fixedDisplayTimeZone || appContext?.timeZone || 'UTC';
}
