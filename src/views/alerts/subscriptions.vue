<template>
  <main class="alerts-page">
    <section class="alert-card"
      ><h2>{{ t('subscriptions.dca') }}</h2
      ><p>{{ t('subscriptions.dcaHint') }}</p
      ><RouterLink class="pill" to="/create">{{ t('list.create') }}</RouterLink></section
    >
    <section class="alert-card">
      <h2>{{ t('indicators.fearGreed') }}</h2
      ><p>{{ t('subscriptions.hint') }}</p>
      <RouterLink class="pill" to="/market/indicators">{{ t('subscriptions.viewIndex') }}</RouterLink>
      <p data-test="subscription-status">{{ saved?.enabled ? t('alerts.active') : t('alerts.paused') }}</p>
      <form @submit.prevent="save">
        <label><input v-model="enabled" type="checkbox" :disabled="busy || loading" /> {{ t('subscriptions.enabled') }}</label>
        <label
          >{{ t('subscriptions.fear') }}<input v-model.number="fear" type="number" min="0" max="99" required :disabled="busy || loading"
        /></label>
        <label
          >{{ t('subscriptions.greed') }}<input v-model.number="greed" type="number" min="1" max="100" required :disabled="busy || loading"
        /></label>
        <p v-if="error" role="alert">{{ t('alerts.failed') }}</p
        ><p v-if="busy || loading">{{ t('common.loading') }}</p>
        <div class="actions"
          ><button data-test="save-subscription" :disabled="busy || loading || !loaded" type="submit">{{ t('common.save') }}</button
          ><button v-if="saved" type="button" :disabled="busy || loading" @click="remove">{{ t('common.delete') }}</button
          ><button type="button" :disabled="busy || loading" @click="load">{{ t('market.refresh') }}</button></div
        >
      </form>
    </section>
  </main>
</template>
<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { showDialog } from '@nutui/nutui';
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
</style>
