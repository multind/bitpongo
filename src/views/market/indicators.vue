<template>
  <main class="alerts-page">
    <section class="alert-card">
      <h1 class="page-heading">{{ t('indicators.fearGreed') }}</h1>
      <p>{{ t('indicators.explanation') }}</p>
      <p v-if="history?.stale" role="status">{{ t('indicators.stale') }}</p>
      <strong v-if="latest" data-test="index-value">{{ latest.value }} <small>/ 100</small></strong>
      <div
        v-if="latest"
        class="sentiment-meter"
        role="meter"
        :aria-label="t('indicators.fearGreed')"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="latest.value"
        :aria-valuetext="classification(latest.classification)"
        ><span :style="{ left: `${Math.min(100, Math.max(0, latest.value))}%` }"
      /></div>
      <p v-if="history && !latest" data-test="index-empty" role="status">{{ t('list.emptyAlt') }}</p>
      <p v-if="latest">{{ classification(latest.classification) }} · {{ formatInstant(latest.observedAt) }}</p>
      <p class="source">Alternative.me</p>
      <div class="actions">
        <SheetSelect v-model="historyLimit" :label="t('indicators.history')" :options="historyOptions" :disabled="loading" />
        <button :disabled="loading" @click="load">{{ t('market.refresh') }}</button>
      </div>
      <p v-if="loading">{{ t('common.loading') }}</p>
      <p v-if="error" role="alert">{{ t('market.loadFailed') }}</p>
    </section>
    <section v-if="history?.points.length" class="alert-card">
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
  import SheetSelect from '@/components/SheetSelect.vue';
  const { t } = useI18n();
  const history = ref<FearGreedHistory | null>(null);
  const latest = computed(() => history.value?.points[0]);
  const limit = ref(30),
    loading = ref(false),
    error = ref(false);
  let request = 0;
  const historyOptions = [7, 30, 90, 365].map((days) => ({ value: String(days), label: String(days) }));
  const historyLimit = computed({
    get: () => String(limit.value),
    set: (value) => {
      limit.value = Number(value);
      void load();
    },
  });
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
    font-size: 0.75rem;
    table-layout: fixed;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.75rem 0.25rem;
    text-align: left;
    overflow-wrap: anywhere;
    border-bottom: 1px solid #eee;
  }

  th:first-child,
  td:first-child {
    width: 50%;
  }

  th:nth-child(2),
  td:nth-child(2) {
    width: 18%;
  }

  strong {
    display: block;
    margin: 1.5rem 0 1rem;
    font-size: 3rem;

    small {
      font-size: 1rem;
      color: #777;
    }
  }

  .alerts-page {
    padding: 1rem 0.5rem 1.5rem;
    font-size: 0.78rem;
    color: #29382f;
  }

  .alert-card {
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  th {
    font-weight: 400;
    color: #8a8681;
  }

  td {
    font-weight: 600;
  }

  .source {
    font-size: 0.7rem;
    color: #81766b;
  }

  .actions > section {
    flex: 1 1 12rem;
    min-width: 0;
  }

  h2 {
    margin-bottom: 0.75rem;
    font-size: 1.25rem;
  }

  p {
    margin: 0.75rem 0;
    line-height: 1.6;
  }

  .sentiment-meter {
    position: relative;
    height: 0.75rem;
    margin: 1rem 0.5rem;
    background: linear-gradient(90deg, #dc6d5b, #edbe65, #6b9e81);
    border-radius: 1rem;
  }

  .sentiment-meter span {
    position: absolute;
    top: -0.25rem;
    width: 0.25rem;
    height: 1.25rem;
    background: #222;
    border-radius: 0.25rem;
    transform: translateX(-50%);
  }

  [role='status'] {
    color: #a35900;
  }
</style>
