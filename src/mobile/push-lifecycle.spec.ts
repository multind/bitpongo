import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import type { Router } from 'vue-router';
const native = vi.hoisted(() => ({ pushClearSession: vi.fn(), pushSyncSession: vi.fn(), pushTakePendingOpen: vi.fn() }));
const api = vi.hoisted(() => ({ getPlanInfo: vi.fn() }));
vi.mock('./bridge', () => native);
vi.mock('@/api', () => api);
vi.mock('@/i18n', () => ({ i18n: { global: { locale: { value: 'en-us' } } } }));
vi.mock('./app-context', () => ({ displayTimeZone: () => 'UTC' }));
import { installPushLifecycle, notificationDestination } from './push-lifecycle';
describe('native notification navigation', () => {
  let stop: (() => void) | undefined;
  beforeEach(() => {
    vi.clearAllMocks();
    native.pushSyncSession.mockResolvedValue({});
    native.pushTakePendingOpen.mockResolvedValue(null);
    api.getPlanInfo.mockResolvedValue({ id: 12 });
  });
  afterEach(() => stop?.());
  const event = { eventId: 'event-1', userId: '7', planId: '12', eventType: 'TRADE_SUCCEEDED' };
  function setup(token = 'jwt') {
    const user = reactive({ token, info: { id: token ? 7 : (undefined as number | undefined) } });
    const router = { isReady: () => Promise.resolve(), push: vi.fn().mockResolvedValue(undefined) };
    stop = installPushLifecycle(user, router as unknown as Router);
    return { user, router };
  }
  it('rejects other accounts, unsafe ids and malformed events', () => {
    expect(notificationDestination(event, '8')).toBeNull();
    for (const planId of ['../1', '0', '-1', '1&action=trade', 'https://evil.test'])
      expect(notificationDestination({ ...event, planId }, '7')).toBeNull();
    expect(notificationDestination({}, '7')).toBeNull();
    expect(notificationDestination({ ...event, planId: undefined, eventType: 'PUSH_TEST' }, '7')).toEqual({ path: '/member/notice' });
  });
  it('waits for login without consuming cold start, checks ownership and deduplicates', async () => {
    native.pushTakePendingOpen.mockResolvedValue(event);
    const { user, router } = setup('');
    await flushPromises();
    expect(native.pushTakePendingOpen).not.toHaveBeenCalled();
    expect(native.pushClearSession).not.toHaveBeenCalled();
    user.info.id = 7;
    user.token = 'jwt';
    await nextTick();
    await flushPromises();
    expect(api.getPlanInfo).toHaveBeenCalledWith('12', false);
    expect(router.push).toHaveBeenCalledWith({ path: '/details', query: { id: '12', tab: 'trades' } });
    window.dispatchEvent(new CustomEvent('bitpongo:notification-open', { detail: event }));
    await flushPromises();
    expect(router.push).toHaveBeenCalledTimes(1);
  });
  it('does not navigate when ownership lookup fails', async () => {
    api.getPlanInfo.mockRejectedValue(new Error('403'));
    native.pushTakePendingOpen.mockResolvedValue(event);
    const { router } = setup();
    await flushPromises();
    expect(router.push).not.toHaveBeenCalled();
  });
  it('invalidates pending lookup on logout and clears native state', async () => {
    let resolve!: () => void;
    api.getPlanInfo.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    native.pushTakePendingOpen.mockResolvedValue(event);
    const { user, router } = setup();
    await flushPromises();
    user.token = '';
    user.info = { id: undefined };
    await nextTick();
    resolve();
    await flushPromises();
    expect(native.pushClearSession).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});
