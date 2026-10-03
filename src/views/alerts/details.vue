<template>
  <main class="alerts-page"
    ><p v-if="error" role="alert">{{ t('alerts.failed') }}</p
    ><p v-if="loading">{{ t('common.loading') }}</p>
    <article v-if="rule" class="alert-card"
      ><h2>{{ rule.name }}</h2
      ><RouterLink :to="`/alerts/${rule.id}/edit`">{{ t('alerts.edit') }}</RouterLink
      ><p>{{ rule.symbol }}</p
      ><p>{{ t(`alerts.conditions.${rule.condition}`) }}: {{ rule.target ?? `${rule.lower}–${rule.upper}` }}</p
      ><p>{{ t(`alerts.frequencies.${rule.frequency}`) }}</p
      ><p>{{ t(expired ? 'alerts.expired' : rule.enabled ? 'alerts.active' : 'alerts.paused') }}</p
      ><p>{{ t('alerts.triggered') }}: {{ rule.triggeredCount }}</p
      ><p v-if="rule.lastTriggeredAt">{{ formatInstant(rule.lastTriggeredAt) }}</p
      ><p v-if="rule.expiresAt">{{ t('alerts.expiry') }}: {{ formatInstant(rule.expiresAt) }}</p
      ><button :disabled="loading || expired" @click="toggle">{{ t(rule.enabled ? 'common.pause' : 'common.resume') }}</button></article
    >
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';
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
</style>
