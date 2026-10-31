<template>
  <main class="alerts-page alert-detail">
    <div v-if="error" class="detail-feedback" role="alert"
      ><p>{{ t('alerts.failed') }}</p
      ><button data-test="detail-retry" :disabled="loading" @click="load">{{ t('market.retry') }}</button></div
    >
    <p v-if="loading" role="status">{{ t('common.loading') }}</p>
    <article v-if="rule" class="alert-card">
      <header class="detail-heading"
        ><span class="detail-icon"><PageIcon name="bell" /></span
        ><div
          ><h1>{{ rule.name }}</h1
          ><p class="symbol">{{ rule.symbol }}</p></div
        ></header
      >
      <span class="detail-status" :class="{ active: rule.enabled && !expired }" data-test="detail-status">{{
        t(expired ? 'alerts.expired' : rule.enabled ? 'alerts.active' : 'alerts.paused')
      }}</span>
      <dl class="detail-fields">
        <div
          ><dt>{{ t('alerts.condition') }}</dt
          ><dd>{{ t(`alerts.conditions.${rule.condition}`) }}</dd></div
        >
        <div
          ><dt>{{ t('alerts.target') }}</dt
          ><dd>{{ rule.target ?? `${rule.lower}–${rule.upper}` }}</dd></div
        >
        <div
          ><dt>{{ t('alerts.frequency') }}</dt
          ><dd>{{ t(`alerts.frequencies.${rule.frequency}`) }}</dd></div
        >
        <div v-if="rule.frequency === 'EACH_CANDLE' || rule.frequency === 'CANDLE_CLOSE'"
          ><dt>{{ t('market.interval') }}</dt
          ><dd>{{ rule.interval }}</dd></div
        >
        <div
          ><dt>{{ t('alerts.triggered') }}</dt
          ><dd>{{ rule.triggeredCount }}</dd></div
        >
        <div v-if="rule.lastTriggeredAt"
          ><dt>{{ t('alerts.lastTriggered') }}</dt
          ><dd
            ><time :datetime="rule.lastTriggeredAt">{{ formatInstant(rule.lastTriggeredAt) }}</time></dd
          ></div
        >
        <div v-if="rule.expiresAt"
          ><dt>{{ t('alerts.expiry') }}</dt
          ><dd
            ><time :datetime="rule.expiresAt">{{ formatInstant(rule.expiresAt) }}</time></dd
          ></div
        >
        <div
          ><dt>{{ t('details.created') }}</dt
          ><dd
            ><time :datetime="rule.createdAt">{{ formatInstant(rule.createdAt) }}</time></dd
          ></div
        >
      </dl>
      <p class="detail-note">{{ t('alerts.notificationHint') }}</p>
      <div class="detail-actions"
        ><RouterLink class="pill" :to="`/alerts/${rule.id}/edit`">{{ t('alerts.edit') }}</RouterLink
        ><button class="primary" data-test="detail-toggle" :disabled="loading || expired" @click="toggle">{{
          t(rule.enabled ? 'common.pause' : 'common.resume')
        }}</button></div
      >
    </article>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import PageIcon from '@/components/PageIcon.vue';
  import { getAlert, setAlertEnabled } from '@/api/alerts';
  import type { AlertRule } from '@/api/alerts';
  import { formatInstant } from '@/utils/timeUtils';
  const { t } = useI18n();
  const route = useRoute();
  const rule = ref<AlertRule>();
  const expired = computed(() => rule.value?.expiresAt != null && Date.parse(rule.value.expiresAt) <= Date.now());
  const error = ref(false);
  const loading = ref(false);
  async function load() {
    loading.value = true;
    error.value = false;
    try {
      rule.value = await getAlert(Number(route.params.id));
    } catch {
      error.value = true;
    } finally {
      loading.value = false;
    }
  }
  async function toggle() {
    if (!rule.value || loading.value) return;
    loading.value = true;
    error.value = false;
    try {
      await setAlertEnabled(rule.value.id, !rule.value.enabled);
      await load();
    } catch {
      error.value = true;
    } finally {
      loading.value = false;
    }
  }
  onMounted(load);
</script>
<style scoped lang="scss">
  @use './shared.scss';

  .alert-detail {
    padding: 1rem 0.75rem;
  }

  .detail-heading {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .detail-heading > div {
    min-width: 0;
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .detail-icon {
    padding-top: 0.125rem;
    color: #1765cf;
  }

  .symbol {
    margin: 0.375rem 0 0;
    font-size: 0.875rem;
    color: #666;
  }

  .detail-status {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    font-size: 0.8125rem;
    color: #666;
    background: #f3f3f3;
    border-radius: 1rem;
  }

  .detail-status.active {
    color: #24824e;
    background: #edf8f1;
  }

  .detail-fields {
    margin: 1rem 0;
  }

  .detail-fields > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
    gap: 1rem;
    padding: 0.875rem 0;
    font-size: 0.875rem;
    line-height: 1.5;
    border-bottom: 1px solid #eee;
  }

  dt {
    color: #666;
  }

  dd {
    margin: 0;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .detail-note {
    font-size: 0.8125rem;
    line-height: 1.6;
    color: #666;
  }

  .detail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .detail-actions > * {
    display: flex;
    flex: 1 1 7rem;
    align-items: center;
    justify-content: center;
    min-height: 2.75rem;
    text-align: center;
    border-radius: 0.625rem;
  }

  .primary {
    color: white;
    background: #1765cf;
    border-color: #1765cf;
  }

  .detail-feedback {
    margin-bottom: 1rem;
  }
</style>
