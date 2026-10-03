<template>
  <main class="alerts-page">
    <div class="actions">
      <RouterLink class="pill" to="/alerts/create">{{ t('alerts.create') }}</RouterLink>
      <RouterLink class="pill" to="/alerts/events">{{ t('alerts.inbox') }}</RouterLink>
      <RouterLink class="pill" to="/alerts/logs">{{ t('alerts.logs') }}</RouterLink>
      <RouterLink class="pill" to="/alerts/webhooks">{{ t('webhook.title') }}</RouterLink>
      <button type="button" :disabled="busy" @click="load(0)">{{ t('market.refresh') }}</button>
    </div>
    <form class="filters" @submit.prevent="load(0)">
      <input v-model="query" type="search" :placeholder="t('alerts.search')" :aria-label="t('alerts.search')" />
      <select v-model="status" :aria-label="t('alerts.status')" @change="load(0)">
        <option value="all">{{ t('alerts.all') }}</option
        ><option value="active">{{ t('alerts.active') }}</option
        ><option value="inactive">{{ t('alerts.paused') }}</option>
      </select>
      <button type="submit" :disabled="busy">{{ t('common.search') }}</button>
    </form>
    <p v-if="error" role="alert">{{ t('alerts.failed') }}</p>
    <p v-if="busy" role="status">{{ t('common.loading') }}</p>
    <div v-if="selected.length" class="actions">
      <button type="button" :disabled="busy" @click="bulk('enable')">{{ t('alerts.enableSelected') }}</button>
      <button type="button" :disabled="busy" @click="bulk('disable')">{{ t('alerts.pauseSelected') }}</button>
      <button type="button" :disabled="busy" @click="removeSelected">{{ t('common.delete') }}</button>
    </div>
    <article v-for="rule in rules" :key="rule.id" class="alert-card">
      <div class="rule-heading"
        ><input v-model="selected" type="checkbox" :value="rule.id" :aria-label="rule.name" /><RouterLink :to="`/alerts/${rule.id}`">{{
          rule.name
        }}</RouterLink
        ><span data-test="alert-status">{{
          t(expired(rule) ? 'alerts.expired' : rule.enabled ? 'alerts.active' : 'alerts.paused')
        }}</span></div
      >
      <p>{{ rule.symbol }} · {{ t(`alerts.conditions.${rule.condition}`) }} · {{ rule.target ?? `${rule.lower}–${rule.upper}` }}</p>
      <p class="meta">{{ t(`alerts.frequencies.${rule.frequency}`) }} · {{ t('alerts.triggered') }}: {{ rule.triggeredCount }}</p>
      <p v-if="rule.lastTriggeredAt" class="meta">{{ formatInstant(rule.lastTriggeredAt) }}</p>
      <div class="actions">
        <button
          type="button"
          data-test="alert-toggle"
          :disabled="busy || expired(rule)"
          @click="run(() => setAlertEnabled(rule.id, !rule.enabled))"
          >{{ t(rule.enabled ? 'common.pause' : 'common.resume') }}</button
        >
        <button type="button" :disabled="busy" @click="run(() => copyAlert(rule.id))">{{ t('alerts.copy') }}</button>
        <button type="button" :disabled="busy" @click="remove(rule.id)">{{ t('common.delete') }}</button>
      </div>
    </article>
    <p v-if="!busy && !rules.length && !error">{{ t('alerts.empty') }}</p>
    <div class="actions"
      ><button v-if="page > 0" type="button" :disabled="busy" @click="load(page - 1)">{{ t('alerts.previous') }}</button
      ><button v-if="hasMore" type="button" :disabled="busy" @click="load(page + 1)">{{ t('alerts.next') }}</button></div
    >
  </main>
</template>
<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { showDialog } from '@nutui/nutui';
  import { listAlerts, setAlertEnabled, copyAlert, deleteAlert, bulkAlerts } from '@/api/alerts';
  import type { AlertRule } from '@/api/alerts';
  import { formatInstant } from '@/utils/timeUtils';
  const { t } = useI18n();
  const expired = (rule: AlertRule) => rule.expiresAt != null && Date.parse(rule.expiresAt) <= Date.now();
  const rules = ref<AlertRule[]>([]);
  const selected = ref<number[]>([]);
  const busy = ref(false);
  const error = ref(false);
  const query = ref('');
  const status = ref('all');
  const page = ref(0);
  const hasMore = ref(false);
  let generation = 0;
  async function load(target: number) {
    const request = ++generation;
    busy.value = true;
    error.value = false;
    try {
      const result = await listAlerts({ q: query.value, status: status.value, page: target, size: 20 });
      if (request === generation) {
        rules.value = result.items;
        page.value = result.page;
        hasMore.value = result.hasMore;
        selected.value = [];
      }
    } catch {
      if (request === generation) error.value = true;
    } finally {
      if (request === generation) busy.value = false;
    }
  }
  async function run(action: () => Promise<unknown>) {
    if (busy.value) return;
    busy.value = true;
    error.value = false;
    try {
      await action();
      await load(page.value);
    } catch {
      error.value = true;
    } finally {
      busy.value = false;
    }
  }
  function remove(id: number) {
    showDialog({ title: t('common.delete'), content: t('alerts.deleteConfirm'), onOk: () => run(() => deleteAlert(id)) });
  }
  function bulk(action: string) {
    void run(() => bulkAlerts([...selected.value], action));
  }
  function removeSelected() {
    showDialog({ title: t('common.delete'), content: t('alerts.deleteConfirm'), onOk: () => bulk('delete') });
  }
  onMounted(() => load(0));
  onUnmounted(() => generation++);
</script>
<style scoped lang="scss">
  @use './shared.scss';
</style>
