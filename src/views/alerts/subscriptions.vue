<template>
  <main class="alerts-page subscriptions-page">
    <RouterLink class="notification-banner" to="/member/notification-methods"
      ><PageIcon name="bell" /><span>{{ t('wizard.defaultDelivery') }}</span
      ><PageIcon name="chevron"
    /></RouterLink>
    <section class="alert-card strategy-card">
      <header class="strategy-heading"
        ><span class="strategy-icon"><PageIcon name="chart" /></span><h2>{{ t('indicators.fearGreed') }}</h2></header
      >
      <p class="strategy-description">{{ t('subscriptions.hint') }}</p>
      <div class="strategy-meta"
        ><span class="status" :class="{ active: saved?.enabled }" data-test="subscription-status">{{
          saved?.enabled ? t('alerts.active') : t('alerts.paused')
        }}</span
        ><RouterLink to="/market/indicators">{{ t('subscriptions.viewIndex') }}</RouterLink></div
      >
      <form @submit.prevent="save">
        <label class="enable-row"
          ><span>{{ t('subscriptions.enabled') }}</span
          ><input v-model="enabled" type="checkbox" :disabled="busy || loading"
        /></label>
        <fieldset class="thresholds"
          ><legend>{{ t('indicators.fearGreed') }}</legend>
          <label
            >{{ t('subscriptions.fear') }}<input v-model.number="fear" type="number" min="0" max="99" required :disabled="busy || loading"
          /></label>
          <label
            >{{ t('subscriptions.greed')
            }}<input v-model.number="greed" type="number" min="1" max="100" required :disabled="busy || loading"
          /></label>
        </fieldset>
        <p v-if="error" role="alert">{{ t('alerts.failed') }}</p
        ><p v-if="busy || loading">{{ t('common.loading') }}</p>
        <div class="actions"
          ><button class="primary" data-test="save-subscription" :disabled="busy || loading || !loaded" type="submit">{{
            t('common.save')
          }}</button
          ><button v-if="saved" type="button" :disabled="busy || loading" @click="remove">{{ t('common.delete') }}</button
          ><button type="button" :disabled="busy || loading" @click="load">{{ t('market.refresh') }}</button></div
        >
      </form>
    </section>
    <section class="alert-card strategy-card">
      <header class="strategy-heading"
        ><span class="strategy-icon"><PageIcon name="refresh" /></span><h2>{{ t('subscriptions.dca') }}</h2></header
      >
      <p class="strategy-description">{{ t('subscriptions.dcaHint') }}</p>
      <RouterLink class="pill primary create-plan" to="/create">{{ t('list.create') }}</RouterLink>
    </section>
  </main>
</template>
<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { showDialog } from '@nutui/nutui';
  import PageIcon from '@/components/PageIcon.vue';
  import {
    getStrategySubscription,
    saveStrategySubscription,
    deleteStrategySubscription,
    type StrategySubscription,
  } from '@/api/subscriptions';
  const { t } = useI18n();
  const saved = ref<StrategySubscription | null>(null),
    fear = ref(25),
    greed = ref(75),
    enabled = ref(false),
    busy = ref(false),
    loading = ref(false),
    loaded = ref(false),
    error = ref(false);
  let request = 0;
  async function load() {
    const id = ++request;
    loading.value = true;
    error.value = false;
    try {
      const result = await getStrategySubscription();
      if (id === request) {
        saved.value = result;
        fear.value = result?.fearThreshold ?? 25;
        greed.value = result?.greedThreshold ?? 75;
        enabled.value = result?.enabled ?? false;
        loaded.value = true;
      }
    } catch {
      if (id === request) {
        error.value = true;
        loaded.value = false;
      }
    } finally {
      if (id === request) loading.value = false;
    }
  }
  async function save() {
    if (busy.value || loading.value || !loaded.value) return;
    if (
      !Number.isInteger(fear.value) ||
      !Number.isInteger(greed.value) ||
      fear.value < 0 ||
      greed.value > 100 ||
      fear.value >= greed.value
    ) {
      error.value = true;
      return;
    }
    busy.value = true;
    error.value = false;
    try {
      await saveStrategySubscription({ enabled: enabled.value, fearThreshold: fear.value, greedThreshold: greed.value });
      await load();
    } catch {
      error.value = true;
    } finally {
      busy.value = false;
    }
  }
  function remove() {
    showDialog({
      title: t('common.delete'),
      content: t('alerts.deleteConfirm'),
      onOk: async () => {
        if (busy.value || loading.value) return;
        busy.value = true;
        error.value = false;
        try {
          await deleteStrategySubscription();
          await load();
        } catch {
          error.value = true;
        } finally {
          busy.value = false;
        }
      },
    });
  }
  onMounted(load);
  onUnmounted(() => {
    request++;
  });
</script>
<style scoped lang="scss">
  @use './shared.scss';

  .subscriptions-page {
    padding: 0.75rem 0.375rem;
  }

  .notification-banner {
    display: flex;
    gap: 0.625rem;
    align-items: center;
    padding: 0.75rem 0.5rem 1.25rem;
    font-size: 0.875rem;
    color: #666;
    text-decoration: none;
  }

  .notification-banner span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .notification-banner svg:first-child {
    color: #3285ff;
  }

  .strategy-card {
    padding: 1.25rem;
  }

  .strategy-heading {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .strategy-heading h2 {
    margin: 0;
    font-size: 1.125rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .strategy-icon {
    padding-top: 0.125rem;
    color: #3285ff;
  }

  .strategy-description {
    margin: 1rem 0;
    font-size: 0.875rem;
    line-height: 1.65;
    color: #777;
  }

  .strategy-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
  }

  .strategy-meta a {
    padding: 0.625rem 0;
    color: #1765cf;
    text-decoration: none;
  }

  .status {
    padding: 0.25rem 0.625rem;
    color: #777;
    background: #f4f4f4;
    border-radius: 1rem;
  }

  .status.active {
    color: #24824e;
    background: #edf8f1;
  }

  .enable-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    font-size: 0.875rem;
    border-top: 1px solid #eee;
  }

  .enable-row input {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    accent-color: #3285ff;
  }

  .thresholds {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.75rem;
    min-width: 0;
    padding: 0;
    margin: 0 0 1.25rem;
    border: 0;
  }

  .thresholds legend {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  .thresholds label {
    min-width: 0;
    font-size: 0.8125rem;
    line-height: 1.5;
  }

  .thresholds input {
    margin-top: 0.5rem;
  }

  .primary {
    color: white;
    text-align: center;
    background: #1765cf;
    border-color: #1765cf;
    border-radius: 0.625rem;
  }

  .actions .primary {
    width: 100%;
    min-height: 2.75rem;
  }

  .create-plan {
    display: block;
    width: 100%;
    min-height: 2.75rem;
  }
</style>
