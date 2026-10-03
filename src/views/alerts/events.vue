<template>
  <main class="alerts-page"
    ><div class="actions"
      ><button :disabled="loading" @click="load(0)">{{ t('market.refresh') }}</button
      ><button v-if="!logs" :disabled="loading" @click="markAll">{{ t('alerts.readAll') }}</button
      ><button :disabled="loading" @click="clear">{{ t('alerts.clear') }}</button></div
    >
    <label v-if="!logs"><input v-model="unread" type="checkbox" @change="load(0)" /> {{ t('alerts.unreadOnly') }}</label
    ><p v-if="error" role="alert">{{ t('alerts.failed') }}</p
    ><p v-if="loading">{{ t('common.loading') }}</p>
    <article v-for="event in events" :key="event.id" class="alert-card"
      ><h3>{{ event.title }}</h3
      ><p>{{ event.body }}</p
      ><p class="meta">{{ formatInstant(event.occurredAt) }}</p
      ><div class="actions"
        ><button v-if="!logs && !event.readAt" :disabled="loading" @click="mark(event.id)">{{ t('alerts.markRead') }}</button
        ><RouterLink v-if="event.ruleId" class="pill" :to="`/alerts/${event.ruleId}`">{{ t('common.details') }}</RouterLink
        ><button :disabled="loading" @click="remove(event.id)">{{ t('common.delete') }}</button></div
      ></article
    >
    <p v-if="!events.length && !loading && !error">{{ t(logs ? 'alerts.noLogs' : 'alerts.noEvents') }}</p
    ><div class="actions"
      ><button v-if="page > 0" :disabled="loading" @click="load(page - 1)">{{ t('alerts.previous') }}</button
      ><button v-if="hasMore" :disabled="loading" @click="load(page + 1)">{{ t('alerts.next') }}</button></div
    >
  </main>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { showDialog } from '@nutui/nutui';
  import {
    listAlertEvents,
    readAlertEvent,
    readAllAlertEvents,
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
  const unread = ref(false);
  const page = ref(0);
  const hasMore = ref(false);
  const loading = ref(false);
  const error = ref(false);
  let request = 0;
  async function load(p: number) {
    const current = ++request;
    loading.value = true;
    error.value = false;
    try {
      const result = await (logs.value
        ? listAlertLogs({ page: p, size: 20 })
        : listAlertEvents({ page: p, size: 20, unreadOnly: unread.value }));
      if (current === request) {
        events.value = result.items;
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
    try {
      await action();
      await load(0);
    } catch {
      error.value = true;
    } finally {
      loading.value = false;
    }
  }
  const mark = (id: number) => run(() => readAlertEvent(id));
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
</script>
<style scoped lang="scss">
  @use './shared.scss';
</style>
