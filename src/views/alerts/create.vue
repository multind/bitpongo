<template>
  <main class="alerts-page"
    ><form class="alert-card" @submit.prevent="submit">
      <label for="alert-name">{{ t('alerts.name') }}</label
      ><input id="alert-name" v-model="form.name" maxlength="100" required /> <label for="alert-symbol">{{ t('market.pair') }}</label
      ><select id="alert-symbol" v-model="form.symbol" required
        ><option v-for="s in symbols" :key="s.symbol" :value="s.symbol">{{ s.baseAsset }}/{{ s.quoteAsset }}</option></select
      >
      <label for="alert-condition">{{ t('alerts.condition') }}</label
      ><select id="alert-condition" v-model="form.condition"
        ><option v-for="c in conditions" :key="c" :value="c">{{ t(`alerts.conditions.${c}`) }}</option></select
      >
      <template v-if="form.condition === 'CHANNEL_OUTSIDE'"
        ><label for="alert-lower">{{ t('alerts.lower') }}</label
        ><input id="alert-lower" v-model="form.lower" inputmode="decimal" required /><label for="alert-upper">{{ t('alerts.upper') }}</label
        ><input id="alert-upper" v-model="form.upper" inputmode="decimal" required
      /></template>
      <template v-else
        ><label for="alert-target">{{ t('alerts.target') }}</label
        ><input id="alert-target" v-model="form.target" inputmode="decimal" required
      /></template>
      <label for="alert-frequency">{{ t('alerts.frequency') }}</label
      ><select id="alert-frequency" v-model="form.frequency"
        ><option v-for="f in frequencies" :key="f" :value="f">{{ t(`alerts.frequencies.${f}`) }}</option></select
      >
      <template v-if="form.frequency === 'EACH_CANDLE' || form.frequency === 'CANDLE_CLOSE'"
        ><label for="alert-interval">{{ t('market.interval') }}</label
        ><select id="alert-interval" v-model="form.interval"
          ><option v-for="v in intervals" :key="v" :value="v">{{ v }}</option></select
        ></template
      >
      <label for="alert-expiry">{{ t('alerts.expiry') }}</label
      ><input id="alert-expiry" v-model="expiry" type="datetime-local" /> <p class="meta">{{ t('alerts.expiryHint') }}</p
      ><p class="meta">{{ t('alerts.notificationHint') }}</p> <p v-if="error" role="alert">{{ t(error) }}</p
      ><button type="submit" :disabled="busy || !symbols.length">{{
        busy ? t('common.loading') : t(editId ? 'common.save' : 'common.create')
      }}</button>
    </form></main
  >
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import { createAlert, getAlert, updateAlert } from '@/api/alerts';
  import type { AlertCreate } from '@/api/alerts';
  import { getMarketSymbols } from '@/api/market';
  import type { MarketSymbol } from '@/api/market';
  const { t } = useI18n();
  const router = useRouter();
  const route = useRoute();
  const editId = Number(route.params.id) || null;
  const form = reactive<AlertCreate>({
    name: '',
    symbol: typeof route.query.symbol === 'string' ? route.query.symbol : 'BTCUSDT',
    condition: 'CROSS',
    target: '',
    lower: '',
    upper: '',
    frequency: 'ONCE',
    interval: '1h',
    expiresAt: null,
  });
  const symbols = ref<MarketSymbol[]>([]);
  const busy = ref(false);
  const error = ref('');
  const expiry = ref('');
  const conditions = ['CROSS', 'CROSS_UP', 'CROSS_DOWN', 'ABOVE', 'BELOW', 'CHANNEL_OUTSIDE'];
  const frequencies = ['ONCE', 'EVERY_TIME', 'PER_MINUTE', 'EACH_CANDLE', 'CANDLE_CLOSE'];
  const intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
  const validPrice = (value: string | null) => value !== null && /^\d+(\.\d{1,18})?$/.test(value) && Number(value) > 0;
  async function submit() {
    if (busy.value) return;
    if (
      !form.name.trim() ||
      (form.condition === 'CHANNEL_OUTSIDE'
        ? !validPrice(form.lower) || !validPrice(form.upper) || Number(form.lower) >= Number(form.upper)
        : !validPrice(form.target))
    ) {
      error.value = 'alerts.invalid';
      return;
    }
    const expiration = expiry.value ? new Date(expiry.value) : null;
    if (expiration && (!Number.isFinite(expiration.getTime()) || expiration.getTime() <= Date.now())) {
      error.value = 'alerts.invalid';
      return;
    }
    busy.value = true;
    error.value = '';
    try {
      const data = {
        ...form,
        target: form.condition === 'CHANNEL_OUTSIDE' ? null : form.target,
        lower: form.condition === 'CHANNEL_OUTSIDE' ? form.lower : null,
        upper: form.condition === 'CHANNEL_OUTSIDE' ? form.upper : null,
        expiresAt: expiration?.toISOString() ?? null,
      };
      if (editId) await updateAlert(editId, data);
      else await createAlert(data);
      await router.replace(editId ? `/alerts/${editId}` : '/alerts');
    } catch {
      error.value = 'alerts.failed';
    } finally {
      busy.value = false;
    }
  }
  onMounted(async () => {
    try {
      symbols.value = await getMarketSymbols();
      if (editId) {
        const existing = await getAlert(editId);
        Object.assign(form, existing, {
          target: existing.target == null ? '' : String(existing.target),
          lower: existing.lower == null ? '' : String(existing.lower),
          upper: existing.upper == null ? '' : String(existing.upper),
        });
        if (existing.expiresAt) {
          const local = new Date(existing.expiresAt);
          expiry.value = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
      }
    } catch {
      error.value = 'alerts.failed';
    }
  });
</script>
<style scoped lang="scss">
  @use './shared.scss';
</style>
