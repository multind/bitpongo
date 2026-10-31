<template>
  <main class="wizard-page price-wizard">
    <WizardSteps :step="step" :labels="stepLabels" />
    <h1 tabindex="-1" ref="heading">{{ stepLabels[step - 1] }}</h1>
    <p class="wizard-intro" data-test="wizard-help">{{
      t(`wizard.${['identityHelp', 'priceHelp', 'deliveryIntro', 'scheduleHelp', 'reviewHelp'][step - 1]}`)
    }}</p>
    <form class="wizard-form" novalidate @submit.prevent="submit">
      <div class="wizard-fields">
        <template v-if="step === 1">
          <label for="alert-name">{{ t('alerts.name') }}</label
          ><input id="alert-name" v-model="form.name" maxlength="100" required />
          <div style="margin-top: 1.125rem">
            <SheetSelect
              id="alert-symbol"
              v-model="form.symbol"
              :label="t('market.pair')"
              :options="symbols.map((s) => ({ value: s.symbol, label: `${s.baseAsset}/${s.quoteAsset}` }))"
              searchable
            />
          </div>
        </template>
        <template v-if="step === 2">
          <p class="wizard-meta">{{ form.symbol }}</p>
          <SheetSelect
            id="alert-condition"
            v-model="form.condition"
            :label="t('alerts.condition')"
            :options="conditions.map((value) => ({ value, label: t(`alerts.conditions.${value}`) }))"
          />
          <p class="wizard-field-help">{{ t(form.condition === 'CHANNEL_OUTSIDE' ? 'wizard.rangeHelp' : 'wizard.targetHelp') }}</p>
          <template v-if="form.condition === 'CHANNEL_OUTSIDE'"
            ><label for="alert-lower">{{ t('alerts.lower') }}</label
            ><input id="alert-lower" v-model="form.lower" inputmode="decimal" required /><label for="alert-upper">{{
              t('alerts.upper')
            }}</label
            ><input id="alert-upper" v-model="form.upper" inputmode="decimal" required
          /></template>
          <template v-else
            ><label for="alert-target">{{ t('alerts.target') }}</label
            ><input id="alert-target" v-model="form.target" inputmode="decimal" required
          /></template>
        </template>
        <section v-if="step === 3" class="wizard-note">
          <h2>{{ t('wizard.defaultDelivery') }}</h2>
          <p>{{ t('alerts.notificationHint') }}</p>
          <p class="wizard-meta">{{ t('wizard.deliveryHelp') }}</p>
          <template v-if="channelSettings">
            <label v-for="key in ['bitpongo', 'email'] as const" :key="key">
              <input
                v-model="selectedChannels"
                type="checkbox"
                :value="key"
                :data-test="`channel-${key}`"
                :disabled="
                  !selectedChannels.includes(key) &&
                  (!channelSettings[key].available ||
                    !channelSettings[key].enabled ||
                    (key === 'email' && !channelSettings.confirmationEnabled))
                "
                @change="channelsChanged = true"
              />
              {{ t(`notificationMethods.channels.${key}`) }}
            </label>
            <p class="wizard-meta">{{ t('wizard.channelHint') }}</p>
          </template>
        </section>
        <template v-if="step === 4">
          <SheetSelect
            id="alert-frequency"
            v-model="form.frequency"
            :label="t('alerts.frequency')"
            :options="frequencies.map((value) => ({ value, label: t(`alerts.frequencies.${value}`) }))"
          />
          <p class="wizard-field-help">{{ t('wizard.frequencyHelp') }}</p>
          <template v-if="form.frequency === 'EACH_CANDLE' || form.frequency === 'CANDLE_CLOSE'"
            ><SheetSelect
              id="alert-interval"
              v-model="form.interval"
              :label="t('market.interval')"
              :options="intervals.map((value) => ({ value, label: value }))"
          /></template>
          <label for="alert-expiry">{{ t('alerts.expiry') }}</label
          ><input id="alert-expiry" v-model="expiry" type="datetime-local" />
          <p class="wizard-meta">{{ t('alerts.expiryHint') }}</p>
        </template>
        <dl v-if="step === 5" class="wizard-review" data-test="wizard-review">
          <div
            ><dt>{{ t('alerts.name') }}</dt
            ><dd>{{ form.name }}</dd></div
          >
          <div
            ><dt>{{ t('market.pair') }}</dt
            ><dd>{{ form.symbol }}</dd></div
          >
          <div
            ><dt>{{ t('alerts.condition') }}</dt
            ><dd>{{ t(`alerts.conditions.${form.condition}`) }}</dd></div
          >
          <div
            ><dt>{{ t('alerts.target') }}</dt
            ><dd>{{ form.condition === 'CHANNEL_OUTSIDE' ? `${form.lower} – ${form.upper}` : form.target }}</dd></div
          >
          <div
            ><dt>{{ t('alerts.frequency') }}</dt
            ><dd
              >{{ t(`alerts.frequencies.${form.frequency}`) }}<span v-if="candleFrequency"> · {{ form.interval }}</span></dd
            ></div
          >
          <div
            ><dt>{{ t('alerts.expiry') }}</dt
            ><dd>{{ expiry.replace('T', ' ') || t('wizard.noExpiry') }}</dd></div
          >
          <div
            ><dt>{{ t('wizard.delivery') }}</dt
            ><dd>{{
              channelSettings
                ? selectedChannels.map((key) => t(`notificationMethods.channels.${key}`)).join('、') || '—'
                : t('wizard.defaultDelivery')
            }}</dd></div
          >
        </dl>
        <p v-if="loading" role="status">{{ t('common.loading') }}</p>
        <p v-if="error" role="alert">{{ t(error) }}</p>
        <button v-if="!ready && !loading" type="button" data-test="wizard-reload" @click="load">{{ t('market.retry') }}</button>
      </div>
      <footer class="wizard-actions">
        <button v-if="step > 1" type="button" data-test="wizard-back" :disabled="busy" @click="move(-1)">{{ t('alerts.previous') }}</button>
        <button v-if="step < 5" type="button" class="wizard-primary" data-test="wizard-next" :disabled="busy || !ready" @click="next">{{
          t('alerts.next')
        }}</button>
        <button v-else type="submit" class="wizard-primary" :disabled="busy || !ready">{{
          busy ? t('common.loading') : t(editId ? 'common.save' : 'common.create')
        }}</button>
      </footer>
    </form>
  </main>
</template>
<script setup lang="ts">
  import SheetSelect from '@/components/SheetSelect.vue';
  import { computed, nextTick, onMounted, reactive, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import { createAlert, getAlert, updateAlert, getAlertCapabilities } from '@/api/alerts';
  import type { AlertCreate } from '@/api/alerts';
  import { getMarketSymbols } from '@/api/market';
  import type { MarketSymbol } from '@/api/market';
  import { getNotificationChannels } from '@/api/notificationChannels';
  import type { NotificationChannels } from '@/api/notificationChannels';
  import WizardSteps from './components/WizardSteps.vue';
  const { t } = useI18n();
  const router = useRouter();
  const route = useRoute();
  const editId = Number(route.params.id) || null;
  const step = ref(1);
  const ready = ref(false);
  const loading = ref(true);
  const heading = ref<HTMLElement | null>(null);
  const stepLabels = computed(() => ['identity', 'price', 'delivery', 'schedule', 'review'].map((key) => t(`wizard.${key}`)));
  const form = reactive<AlertCreate>({
    name: '',
    symbol: typeof route.query.symbol === 'string' ? route.query.symbol : 'BTCUSDT',
    condition: 'CROSS',
    target: typeof route.query.price === 'string' && /^\d+(\.\d{1,18})?$/.test(route.query.price) ? route.query.price : '',
    lower: '',
    upper: '',
    frequency: 'ONCE',
    interval: '1h',
    expiresAt: null,
  });
  const symbols = ref<MarketSymbol[]>([]);
  const channelSettings = ref<NotificationChannels | null>(null);
  const selectedChannels = ref<string[]>([]);
  const channelsChanged = ref(false);
  const legacyChannels = ref(false);
  const busy = ref(false);
  const error = ref('');
  const expiry = ref('');
  const conditions = ['CROSS', 'CROSS_UP', 'CROSS_DOWN', 'ABOVE', 'BELOW', 'CHANNEL_OUTSIDE'];
  const frequencies = ['ONCE', 'EVERY_TIME', 'PER_MINUTE', 'EACH_CANDLE', 'CANDLE_CLOSE'];
  const intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
  const candleFrequency = computed(() => form.frequency === 'EACH_CANDLE' || form.frequency === 'CANDLE_CLOSE');
  const validPrice = (value: string | null) =>
    value !== null && /^\d+(\.\d{1,18})?$/.test(value) && /[1-9]/.test(value) && value.split('.')[0]!.replace(/^0+/, '').length <= 20;
  const scaledPrice = (value: string) => {
    const [whole, fraction = ''] = value.split('.');
    return (whole!.replace(/^0+/, '') || '0') + fraction.padEnd(18, '0');
  };
  const lowerThan = (left: string, right: string) => {
    const a = scaledPrice(left);
    const b = scaledPrice(right);
    return a.length === b.length ? a < b : a.length < b.length;
  };
  function validStep(value: number) {
    if (value === 1) return !!form.name.trim() && symbols.value.some((s) => s.symbol === form.symbol);
    if (value === 2)
      return (
        conditions.includes(form.condition) &&
        (form.condition === 'CHANNEL_OUTSIDE'
          ? validPrice(form.lower) && validPrice(form.upper) && lowerThan(form.lower!, form.upper!)
          : validPrice(form.target))
      );
    const expiration = expiry.value ? new Date(expiry.value) : null;
    if (value === 4)
      return (
        frequencies.includes(form.frequency) &&
        (!candleFrequency.value || intervals.includes(form.interval)) &&
        (!expiration || (Number.isFinite(expiration.getTime()) && expiration.getTime() > Date.now()))
      );
    return true;
  }
  async function move(delta: number) {
    error.value = '';
    step.value += delta;
    await nextTick();
    heading.value?.focus();
  }
  function next() {
    if (!ready.value || busy.value) return;
    if (!validStep(step.value)) {
      error.value = 'alerts.invalid';
      return;
    }
    void move(1);
  }
  async function submit() {
    if (busy.value || !ready.value) return;
    if (step.value < 5) {
      next();
      return;
    }
    const invalid = [1, 2, 4].find((value) => !validStep(value));
    if (invalid) {
      step.value = invalid;
      error.value = 'alerts.invalid';
      return;
    }
    const expiration = expiry.value ? new Date(expiry.value) : null;
    busy.value = true;
    error.value = '';
    try {
      const data = {
        ...form,
        ...(channelSettings.value && (!legacyChannels.value || channelsChanged.value) ? { channels: selectedChannels.value } : {}),
        name: form.name.trim(),
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
  async function load() {
    loading.value = true;
    ready.value = false;
    error.value = '';
    try {
      symbols.value = await getMarketSymbols();
      try {
        const capabilities = await getAlertCapabilities();
        if (!capabilities.perAlertChannels) throw new Error('Channel selection unavailable');
        channelSettings.value = await getNotificationChannels();
        selectedChannels.value = (['bitpongo', 'email'] as const).filter(
          (key) =>
            channelSettings.value![key].enabled &&
            channelSettings.value![key].available &&
            (key !== 'email' || channelSettings.value!.confirmationEnabled),
        );
      } catch {
        channelSettings.value = null;
      }
      if (editId) {
        const existing = await getAlert(editId);
        legacyChannels.value = existing.channels == null;
        if (existing.channels) selectedChannels.value = [...existing.channels];
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
      ready.value = symbols.value.length > 0;
      if (!ready.value) error.value = 'alerts.failed';
    } catch {
      error.value = 'alerts.failed';
    } finally {
      loading.value = false;
    }
  }
  onMounted(load);
</script>
<style scoped lang="scss">
  @use './wizard.scss';
</style>
