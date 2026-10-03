<template>
  <main class="alerts-page">
    <section class="alert-card">
      <h2>{{ t('indicators.fearGreed') }}</h2>
      <p>{{ t('indicators.explanation') }}</p>
      <p v-if="history?.stale" role="status">{{ t('indicators.stale') }}</p>
      <strong v-if="latest" data-test="index-value">{{ latest.value }} / 100</strong>
      <p v-if="latest">{{ classification(latest.classification) }} · {{ formatInstant(latest.observedAt) }}</p>
      <p
        ><a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener noreferrer"
          >{{ t('indicators.source') }}: Alternative.me</a
        ></p
      >
      <div class="actions">
        <label
          >{{ t('indicators.history') }}
          <select v-model="limit" :disabled="loading" @change="load"
            ><option v-for="days in [7, 30, 90, 365]" :key="days" :value="days">{{ days }}</option></select
          ></label
        >
        <button :disabled="loading" @click="load">{{ t('market.refresh') }}</button>
      </div>
      <p v-if="loading">{{ t('common.loading') }}</p>
      <p v-if="error" role="alert">{{ t('market.loadFailed') }}</p>
    </section>
    <section v-if="history" class="alert-card">
      <table>
        <thead
          ><tr
            ><th>{{ t('indicators.time') }}</th
            ><th>{{ t('indicators.value') }}</th
            ><th>{{ t('indicators.sentiment') }}</th></tr
          ></thead
        >
        <tbody
          ><tr v-for="point in history.points" :key="point.observedAt"
            ><td>{{ formatInstant(point.observedAt) }}</td
            ><td>{{ point.value }}</td
            ><td>{{ classification(point.classification) }}</td></tr
          ></tbody
        >
      </table>
    </section>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getFearGreed, type FearGreedHistory } from '@/api/indicators';
  import { formatInstant } from '@/utils/timeUtils';
  const { t } = useI18n();
  const history = ref<FearGreedHistory | null>(null);
  const latest = computed(() => history.value?.points[0]);
  const limit = ref(30),
    loading = ref(false),
    error = ref(false);
  let request = 0;
  const labels: Record<string, string> = {
    'Extreme Fear': 'extremeFear',
    Fear: 'fear',
    Neutral: 'neutral',
    Greed: 'greed',
    'Extreme Greed': 'extremeGreed',
  };
  const classification = (value: string) => (labels[value] ? t(`indicators.${labels[value]}`) : value);
  async function load() {
    const id = ++request;
    loading.value = true;
    error.value = false;
    try {
      const result = await getFearGreed(limit.value);
      if (id === request) history.value = result;
    } catch {
      if (id === request) {
        error.value = true;
        history.value = null;
      }
    } finally {
      if (id === request) loading.value = false;
    }
  }
  onMounted(load);
  onUnmounted(() => {
    request++;
  });
</script>
<style scoped lang="scss">
  @use '../alerts/shared.scss';

  table {
    width: 100%;
    font-size: 14px;
    table-layout: fixed;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 10px 4px;
    text-align: left;
    overflow-wrap: anywhere;
    border-bottom: 1px solid #eee;
  }

  strong {
    font-size: 32px;
  }

  [role='status'] {
    color: #a35900;
  }
</style>
