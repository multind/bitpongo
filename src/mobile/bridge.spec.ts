import { afterEach, describe, expect, it, vi } from 'vitest';

import { getNativeContext, saveCanvasImage, saveImage, shareImage, type NativeContext } from './bridge';

const nativeContext: NativeContext = {
  appVersion: '1.0.0',
  platform: 'ios' as const,
  systemVersion: '18.0',
  safeArea: { top: 47, right: 0, bottom: 34, left: 0 },
  locale: 'zh-tw',
  timeZone: 'Asia/Taipei',
  timeZoneOffsetMinutes: 480,
};

afterEach(() => {
  delete window.ZhitoubaoBridge;
  delete window.flutter_inappwebview;
  vi.restoreAllMocks();
});

describe('native bridge', () => {
  it('posts a versioned getContext request and resolves the native reply', async () => {
    window.ZhitoubaoBridge = {
      postMessage: vi.fn((message: string) => {
        const request = JSON.parse(message);
        window.__ZHITOUBAO_NATIVE_RESOLVE__?.(request.requestId, nativeContext);
      }),
    };

    await expect(getNativeContext()).resolves.toEqual(nativeContext);
    expect(window.ZhitoubaoBridge.postMessage).toHaveBeenCalledWith(expect.stringContaining('"version":1'));
    expect(window.ZhitoubaoBridge.postMessage).toHaveBeenCalledWith(expect.stringContaining('"command":"getContext"'));
  });

  it('returns browser fallbacks when the native channel is missing', async () => {
    await expect(getNativeContext()).resolves.toBeNull();
    await expect(saveImage({ url: 'https://example.com/poster.png' })).resolves.toBe(false);
    await expect(shareImage({ url: 'https://example.com/poster.png' })).resolves.toBe(false);
  });

  it.each([saveImage, shareImage])('rejects unsafe image URLs before posting', async (command) => {
    const postMessage = vi.fn();
    window.ZhitoubaoBridge = { postMessage };

    await expect(command({ url: 'file:///private/poster.png' })).rejects.toThrow('图片地址无效');
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('sends through the flutter_inappwebview handler when available', async () => {
    const callHandler = vi.fn((_name: string, message: string) => {
      const request = JSON.parse(message);
      window.__ZHITOUBAO_NATIVE_RESOLVE__?.(request.requestId, true);
    });
    window.flutter_inappwebview = { callHandler: callHandler as unknown as (name: string, ...args: unknown[]) => void };

    await expect(saveCanvasImage('data:image/jpeg;base64,/9j/4AAQ')).resolves.toBe(true);
    expect(callHandler).toHaveBeenCalledWith('ZhitoubaoBridge', expect.stringContaining('"command":"saveCanvasImage"'));
  });

  it('expires an unanswered request after ten seconds', async () => {
    vi.useFakeTimers();
    window.ZhitoubaoBridge = { postMessage: vi.fn() };

    const result = getNativeContext();
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(result).resolves.toBeNull();
    vi.useRealTimers();
  });
});
