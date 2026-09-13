import { watch } from 'vue';
import type { Router } from 'vue-router';
import { i18n } from '@/i18n';
import { getPlanInfo } from '@/api';
import { displayTimeZone } from './app-context';
import { pushClearSession, pushSyncSession, pushTakePendingOpen, type NotificationOpen } from './bridge';

export function notificationDestination(value: unknown, userId: string) {
  const open = value as Partial<NotificationOpen> | null;
  if (
    !open ||
    typeof open.eventId !== 'string' ||
    !open.eventId ||
    open.eventId.length > 200 ||
    open.userId !== userId ||
    typeof open.eventType !== 'string'
  )
    return null;
  if (open.planId !== undefined) {
    if (typeof open.planId !== 'string' || !/^[1-9]\d{0,18}$/.test(open.planId)) return null;
    return { path: '/details', query: { id: open.planId, tab: open.eventType === 'TRADE_SUCCEEDED' ? 'trades' : 'executions' } };
  }
  return { path: open.eventType === 'PUSH_TEST' ? '/member/notice' : '/list' };
}

export function installPushLifecycle(user: { token: string; info: { id?: number } }, router: Router) {
  let generation = 0;
  let pending: unknown = null;
  let ready = false;
  let processing = false;
  const seen = new Set<string>();
  const identity = () => (user.token && user.info.id ? String(user.info.id) : '');
  async function consume() {
    if (!ready || !identity() || processing) return;
    processing = true;
    const version = generation;
    const id = identity();
    try {
      const buffered = pending;
      pending = null;
      const candidate = buffered ?? (await pushTakePendingOpen());
      if (version !== generation || id !== identity()) return;
      const destination = notificationDestination(candidate, id);
      if (!destination) return;
      const event = candidate as NotificationOpen;
      if (seen.has(event.eventId)) return;
      if (event.planId) {
        try {
          await getPlanInfo(event.planId, false);
        } catch {
          return;
        }
      }
      if (version !== generation || id !== identity()) return;
      seen.add(event.eventId);
      if (seen.size > 100) seen.delete(seen.values().next().value!);
      await router.push(destination);
    } finally {
      processing = false;
      if (pending && identity()) void consume();
    }
  }
  async function sync() {
    const id = identity();
    if (!id) return;
    const locale = { 'en-us': 'en-US', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW' }[String(i18n.global.locale.value)] || 'en-US';
    await pushSyncSession({ accessToken: user.token, userId: id, locale, timezone: displayTimeZone() });
    void consume();
  }
  const stop = watch(
    () => [user.token, user.info.id, i18n.global.locale.value],
    (next, old) => {
      generation++;
      if (old?.[1] && old[1] !== next[1]) {
        pending = null;
        seen.clear();
      }
      if (!identity()) {
        if (old?.[0]) void pushClearSession();
        return;
      }
      void sync();
    },
    { immediate: true },
  );
  const onOpen = (event: Event) => {
    pending = (event as CustomEvent).detail;
    void consume();
  };
  const onResume = () => {
    if (document.visibilityState === 'visible') void sync();
  };
  window.addEventListener('bitpongo:notification-open', onOpen);
  window.addEventListener('bitpongo:timezone-change', sync);
  document.addEventListener('visibilitychange', onResume);
  void router.isReady().then(() => {
    ready = true;
    void consume();
  });
  return () => {
    stop();
    window.removeEventListener('bitpongo:notification-open', onOpen);
    window.removeEventListener('bitpongo:timezone-change', sync);
    document.removeEventListener('visibilitychange', onResume);
  };
}
