<template>
  <main class="alerts-page events-page"
    ><div class="events-toolbar"
      ><span class="events-total">{{ total }}</span
      ><div class="toolbar-actions"
        ><button :disabled="loading" @click="load(0)"><PageIcon name="refresh" />{{ t('market.refresh') }}</button>
        <details class="action-menu"
          ><summary :aria-label="t('alerts.actions')"><PageIcon name="more" /></summary
          ><div class="menu-items"
            ><button v-if="!logs" :disabled="loading" @click="markAll">{{ t('alerts.readAll') }}</button>
            <button :disabled="loading" class="danger" @click="clear">{{ t('alerts.clear') }}</button></div
          ></details
        ></div
      ></div
    >
    <label v-if="!logs"><input v-model="unread" type="checkbox" @change="load(0)" /> {{ t('alerts.unreadOnly') }}</label
    ><p v-if="error" role="alert">{{ t('alerts.failed') }}</p
    ><p v-if="loading">{{ t('common.loading') }}</p>
    <section v-for="group in groups" :key="group.date" class="event-group" :aria-label="group.date">
      <h2 data-test="event-date">{{ group.date }}</h2>
      <SwipeCell v-for="event in group.items" :key="event.id" :disabled="loading">
        <article class="event-row">
          <span class="event-icon"><PageIcon :name="logs ? 'log' : 'bell'" /></span>
          <div class="event-content">
            <div class="event-heading"
              ><h3>{{ event.title }}</h3
              ><span v-if="!logs && !event.readAt" class="unread-marker" data-test="unread-marker" aria-hidden="true"
            /></div>
            <details v-if="event.body.length > 160" class="body-details"
              ><summary>{{ event.body.slice(0, 140) }}…</summary><p class="event-body">{{ event.body }}</p></details
            >
            <p v-else class="event-body">{{ event.body }}</p>
            <time class="meta" :datetime="event.occurredAt">{{ formatInstant(event.occurredAt) }}</time>
            <div class="event-actions">
              <button
                v-if="!logs && event.confirmationRequired && !event.confirmedAt"
                :disabled="loading"
                data-test="alert-confirm"
                @click="confirmEvent(event.id)"
                >{{ t('alerts.confirm') }}</button
              >
              <span v-else-if="!logs && event.confirmedAt" class="confirmed-state" data-test="alert-confirmed">{{
                t('alerts.confirmed')
              }}</span>
              <RouterLink v-if="event.ruleId" :to="`/alerts/${event.ruleId}`">{{ t('common.details') }}</RouterLink>
              <details class="action-menu"
                ><summary :aria-label="t('alerts.actions')"><PageIcon name="more" /></summary
                ><div class="menu-items"
                  ><button v-if="!logs && !event.readAt" :disabled="loading" @click="mark(event.id)">{{ t('alerts.markRead') }}</button
                  ><button :disabled="loading" class="danger" @click="remove(event.id)">{{ t('common.delete') }}</button></div
                ></details
              >
            </div>
          </div>
        </article>
        <template #right
          ><button class="swipe-delete" :disabled="loading" tabindex="-1" @click="remove(event.id)"
            ><PageIcon name="trash" />{{ t('common.delete') }}</button
          ></template
        >
      </SwipeCell>
    </section>
    <p v-if="!events.length && !loading && !error">{{ t(logs ? 'alerts.noLogs' : 'alerts.noEvents') }}</p
    ><div class="actions"
      ><button v-if="hasMore" class="load-more" :disabled="loading" @click="load(page + 1, true)">{{ t('fng.loadMore') }}</button></div
    >
  </main>
</template>
<script setup lang="ts">
  import { computed, ref, watch, onUnmounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { showDialog } from '@nutui/nutui';
  import { SwipeCell } from 'vant';
  import 'vant/es/swipe-cell/index.css';
  import PageIcon from '@/components/PageIcon.vue';
  import {
    listAlertEvents,
    readAlertEvent,
    readAllAlertEvents,
    confirmAlertEvent,
    deleteAlertEvent,
    clearAlertEvents,
    listAlertLogs,
    deleteAlertLog,
    clearAlertLogs,
  } from '@/api/alerts';
  import type { AlertEvent } from '@/api/alerts';
  import { formatInstant } from '@/utils/timeUtils';
  const { t } = useI18n();
  const route = useRoute();
  const logs = computed(() => route.path === '/alerts/logs');
  const events = ref<AlertEvent[]>([]);
  const groups = computed(() => {
    const grouped = new Map<string, AlertEvent[]>();
    for (const event of events.value) {
      const date = formatInstant(event.occurredAt).slice(0, 10);
      const items = grouped.get(date) ?? [];
      items.push(event);
      grouped.set(date, items);
    }
    return Array.from(grouped, ([date, items]) => ({ date, items }));
  });
  const unread = ref(false);
  const page = ref(0);
  const total = ref(0);
  const hasMore = ref(false);
  const loading = ref(false);
  const error = ref(false);
  let request = 0;
  async function load(p: number, append = false) {
    const current = ++request;
    loading.value = true;
    error.value = false;
    try {
      const result = await (logs.value
        ? listAlertLogs({ page: p, size: 20 })
        : listAlertEvents({ page: p, size: 20, unreadOnly: unread.value }));
      if (current === request) {
        events.value = append
          ? [...events.value, ...result.items.filter((item) => !events.value.some((existing) => existing.id === item.id))]
          : result.items;
        total.value = result.total;
        page.value = result.page;
        hasMore.value = result.hasMore;
      }
    } catch {
      if (current === request) error.value = true;
    } finally {
      if (current === request) loading.value = false;
    }
  }
  async function run(action: () => Promise<void>) {
    if (loading.value) return;
    loading.value = true;
    error.value = false;
    const current = request;
    try {
      await action();
      if (current === request) await load(0);
    } catch {
      if (current === request) error.value = true;
    } finally {
      if (current === request) loading.value = false;
    }
  }
  const mark = (id: number) => run(() => readAlertEvent(id));
  const confirmEvent = (id: number) => run(() => confirmAlertEvent(id));
  const markAll = () => run(readAllAlertEvents);
  function remove(id: number) {
    showDialog({
      title: t('common.delete'),
      content: t('alerts.deleteConfirm'),
      onOk: () => run(() => (logs.value ? deleteAlertLog(id) : deleteAlertEvent(id))),
    });
  }
  function clear() {
    showDialog({
      title: t('alerts.clear'),
      content: t('alerts.clearConfirm'),
      onOk: () => run(logs.value ? clearAlertLogs : clearAlertEvents),
    });
  }
  watch(
    logs,
    () => {
      events.value = [];
      unread.value = false;
      void load(0);
    },
    { immediate: true },
  );
  onUnmounted(() => request++);
</script>
<style scoped lang="scss">
  @use './shared.scss';

  .events-page {
    padding: 1rem 0.5rem;
    font-size: 0.78rem;
    color: #29382f;
  }

  .events-toolbar,
  .toolbar-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
  }

  .events-toolbar {
    margin-bottom: 1rem;
  }

  .events-total {
    font-size: 0.75rem;
    color: #8a8681;
  }

  .toolbar-actions > button {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
    font-size: 0.75rem;
    background: transparent;
    border: 0;
  }

  .toolbar-actions svg {
    width: 1rem;
    height: 1rem;
  }

  .action-menu {
    position: relative;
    margin-left: auto;
  }

  .action-menu > summary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    cursor: pointer;
    list-style: none;
  }

  .action-menu > summary::-webkit-details-marker {
    display: none;
  }

  .action-menu svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .menu-items {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 20;
    min-width: 10rem;
    padding: 0.35rem;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 0.75rem;
    box-shadow: 0 0.4rem 1rem #0001;
  }

  .menu-items button {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.75rem;
    text-align: left;
    border: 0;
    border-radius: 0.4rem;
  }

  .menu-items .danger {
    color: #b93d31;
  }

  .event-actions .menu-items {
    top: auto;
    bottom: 100%;
  }

  .body-details summary {
    line-height: 1.6;
    color: #81766b;
    overflow-wrap: anywhere;
    cursor: pointer;
  }

  .load-more {
    width: 100%;
    font-size: 0.75rem;
    background: #f5f1ee;
    border: 0;
    border-radius: 0.75rem;
  }

  .event-group {
    margin: 1.5rem 0;
  }

  .event-group h2 {
    margin: 0 0 0.625rem;
    font-size: 0.75rem;
    color: #8a8681;
  }

  .event-row {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .event-icon {
    padding-top: 0.125rem;
    color: #3285ff;
  }

  .event-content {
    flex: 1;
    min-width: 0;
  }

  .event-heading {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .event-heading h3 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .unread-marker {
    flex-shrink: 0;
    width: 0.5rem;
    height: 0.5rem;
    background: #3285ff;
    border-radius: 50%;
  }

  .event-body {
    margin: 0.375rem 0;
    font-size: 0.78rem;
    line-height: 1.5;
    color: #666;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .confirmed-state {
    font-size: 0.75rem;
    color: #328642;
  }

  .event-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    margin-top: 0.25rem;
  }

  .event-actions button,
  .event-actions a {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    padding: 0.625rem 0;
    font-size: 0.8125rem;
    color: #1765cf;
    text-decoration: none;
    background: transparent;
    border: 0;
    border-radius: 0;
  }

  .swipe-delete {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    min-width: 4.5rem;
    height: 100%;
    color: white;
    background: #ed4136;
    border: 0;
    border-radius: 0;
  }
</style>
