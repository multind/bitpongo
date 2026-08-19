export interface NativeContext {
  appVersion: string;
  platform: 'android' | 'ios';
  systemVersion: string;
  safeArea: { top: number; right: number; bottom: number; left: number };
}

export interface ImageRequest {
  url: string;
  title?: string;
}

type NativeCommand = 'getContext' | 'saveImage' | 'shareImage' | 'saveCanvasImage';

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

function invokeNative<T>(command: NativeCommand, payload: object, fallback: T): Promise<T> {
  const channel = findChannel();
  if (!channel) return Promise.resolve(fallback);

  const requestId = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      resolve(fallback);
    }, requestTimeoutMs);

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
