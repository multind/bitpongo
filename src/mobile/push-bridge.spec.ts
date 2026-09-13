import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushClearSession, pushGetStatus } from './bridge';
afterEach(() => {
  delete window.ZhitoubaoBridge;
  vi.useRealTimers();
});
describe('push bridge compatibility', () => {
  it('returns unsupported on web', async () => {
    expect((await pushGetStatus()).supported).toBe(false);
  });
  it('settles within 1.5 seconds when an older app ignores the command', async () => {
    vi.useFakeTimers();
    window.ZhitoubaoBridge = { postMessage: vi.fn() };
    const status = pushGetStatus();
    await vi.advanceTimersByTimeAsync(1500);
    expect((await status).supported).toBe(false);
  });
  it.each([{ revokeDevice: true }, { preservePendingOpen: true }, {}])('preserves clear intent %j in the bridge envelope', async (payload) => {
    window.ZhitoubaoBridge = {
      postMessage: (raw) => {
        const request = JSON.parse(raw);
        expect(request.payload).toEqual(payload);
        window.__ZHITOUBAO_NATIVE_RESOLVE__?.(request.requestId, { cleared: true });
      },
    };
    expect(await pushClearSession(payload)).toEqual({ cleared: true });
  });
});
