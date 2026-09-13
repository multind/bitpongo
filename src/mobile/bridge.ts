import type { LocaleKey } from '@/i18n';

export interface NativeContext {
  appVersion: string;
  platform: 'android' | 'ios';
  systemVersion: string;
  safeArea: { top: number; right: number; bottom: number; left: number };
  locale?: LocaleKey;
  timeZone?: string;
  timeZoneOffsetMinutes?: number;
}

export interface ImageRequest {
  url: string;
  title?: string;
}

type NativeCommand =
  | 'getContext'
  | 'saveImage'
  | 'shareImage'
  | 'saveCanvasImage'
  | 'pushGetStatus'
  | 'pushRequestPermission'
  | 'pushSyncSession'
  | 'pushClearSession'
  | 'pushOpenSettings'
  | 'pushTakePendingOpen';

interface PendingRequest {
  resolve: (result: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface NativeChannel {
  send(message: string): void;
}

const pendingRequests = new Map<string, PendingRequest>();
const requestTimeoutMs = 10_000;

window.__ZHITOUBAO_NATIVE_RESOLVE__ = (requestId, result) => {
  const pending = pendingRequests.get(requestId);
  if (!pending) return;

  clearTimeout(pending.timeoutId);
  pendingRequests.delete(requestId);
  pending.resolve(result);
};

function findChannel(): NativeChannel | null {
  const flutter = window.flutter_inappwebview;
  if (flutter?.callHandler) {
    return {
      send: (message) => {
        void flutter.callHandler?.('ZhitoubaoBridge', message);
      },
    };
  }
  const bridge = window.ZhitoubaoBridge;
  if (bridge) {
    return {
      send: (message) => bridge.postMessage(message),
    };
  }
  return null;
}

function invokeNative<T>(command: NativeCommand, payload: object, fallback: T, timeout = requestTimeoutMs): Promise<T> {
  const channel = findChannel();
  if (!channel) return Promise.resolve(fallback);

  const requestId = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      resolve(fallback);
    }, timeout);

    pendingRequests.set(requestId, {
      resolve: (result) => resolve(result as T),
      timeoutId,
    });

    try {
      channel.send(JSON.stringify({ version: 1, command, requestId, payload }));
    } catch (error) {
      clearTimeout(timeoutId);
      pendingRequests.delete(requestId);
      reject(error);
    }
  });
}

function validateImageRequest(request: ImageRequest): ImageRequest {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    throw new Error('图片地址无效');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('图片地址无效');
  return { ...request, url: url.toString() };
}

export function hasNativeChannel(): boolean {
  return findChannel() !== null;
}

export function getNativeContext(): Promise<NativeContext | null> {
  return invokeNative('getContext', {}, null);
}

export async function saveImage(request: ImageRequest): Promise<boolean> {
  return invokeNative('saveImage', validateImageRequest(request), false);
}

export async function shareImage(request: ImageRequest): Promise<boolean> {
  return invokeNative('shareImage', validateImageRequest(request), false);
}

export async function saveCanvasImage(dataUrl: string): Promise<boolean> {
  return invokeNative('saveCanvasImage', { dataUrl }, false);
}

export interface PushStatus {
  supported: boolean;
  configured: boolean;
  permission: 'authorized' | 'provisional' | 'denied' | 'notDetermined' | 'unavailable';
  registered: boolean;
  installationId: string | null;
  error: string | null;
}
export interface NotificationOpen {
  eventId: string;
  userId: string;
  planId?: string;
  eventType: string;
}
export const unsupportedPush: PushStatus = {
  supported: false,
  configured: false,
  permission: 'unavailable',
  registered: false,
  installationId: null,
  error: null,
};
async function pushStatus(
  command: 'pushGetStatus' | 'pushRequestPermission' | 'pushSyncSession',
  payload: object = {},
): Promise<PushStatus> {
  try {
    const result = await invokeNative<PushStatus>(command, payload, unsupportedPush, command === 'pushGetStatus' ? 1500 : 45000);
    return result && typeof result.supported === 'boolean' && typeof result.permission === 'string' ? result : unsupportedPush;
  } catch {
    return { ...unsupportedPush, error: 'bridge_unavailable' };
  }
}
export const pushGetStatus = () => pushStatus('pushGetStatus');
export const pushRequestPermission = () => pushStatus('pushRequestPermission');
export const pushSyncSession = (session: { accessToken: string; userId: string; locale: string; timezone: string }) =>
  pushStatus('pushSyncSession', session);
export const pushClearSession = (payload: { revokeDevice?: boolean } = {}) =>
  invokeNative('pushClearSession', payload, { cleared: false }, 45000).catch(() => ({ cleared: false }));
export const pushOpenSettings = () => invokeNative('pushOpenSettings', {}, { opened: false }, 1500).catch(() => ({ opened: false }));
export const pushTakePendingOpen = () => invokeNative<NotificationOpen | null>('pushTakePendingOpen', {}, null, 1500).catch(() => null);
