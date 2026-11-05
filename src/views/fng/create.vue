<template>
  <main class="fng-page">
    <section class="form-card">
      <h2>{{ t('fng.mainSettings') }}</h2>
      <label class="field">
        <span>{{ t('fng.name') }}</span>
        <input v-model.trim="form.name" type="text" maxlength="100" data-test="fng-name" />
      </label>
      <SheetSelect id="fng-exchange" v-model="exchangeValue" :label="t('fng.exchange')" :options="exchangeOptions" />
      <p v-if="!exchangeOptions.length" class="field-hint">{{ t('fng.exchangeMissing') }}</p>
      <SheetSelect id="fng-symbol" v-model="form.symbol" :label="t('fng.symbol')" :options="symbolOptions" searchable />
    </section>
    <section class="form-card">
      <h2>{{ t('fng.strategySettings') }}</h2>
      <div class="slider-field">
        <label
          ><span>{{ t('fng.upperLimitValue') }}</span
          ><strong>{{ form.upperLimitValue }}</strong></label
        >
        <input v-model.number="form.upperLimitValue" type="range" min="0" max="100" />
      </div>
      <label class="field">
        <span>{{ t('fng.upperLimitInterval') }}</span>
        <input v-model.number="form.upperLimitInterval" type="number" min="1" max="25" />
      </label>
      <div class="slider-field">
        <label
          ><span>{{ t('fng.lowerLimitValue') }}</span
          ><strong>{{ form.lowerLimitValue }}</strong></label
        >
        <input v-model.number="form.lowerLimitValue" type="range" min="0" max="100" />
      </div>
      <label class="field">
        <span>{{ t('fng.lowerLimitInterval') }}</span>
        <input v-model.number="form.lowerLimitInterval" type="number" min="1" max="25" />
      </label>
      <div class="two-col">
        <label class="field">
          <span>{{ t('fng.basicAmount') }}</span>
          <input v-model="form.basicAmount" inputmode="decimal" data-test="fng-basic-amount" />
        </label>
        <label class="field">
          <span>{{ t('fng.increaseRatio') }}</span>
          <input v-model="form.increaseRatio" inputmode="decimal" />
        </label>
      </div>
      <div class="two-col">
        <label class="field">
          <span>{{ t('fng.leverage') }}</span>
          <input v-model.number="form.leverage" type="number" min="1" max="20" />
        </label>
        <label class="field">
          <span>{{ t('fng.bureauPeriod') }}</span>
          <input v-model.number="form.bureauPeriod" type="number" min="1" max="25" />
          <small class="field-hint">{{ t('fng.bureauPeriodHint') }}</small>
        </label>
      </div>
      <div class="toggle-field">
        <span>{{ t('fng.direction') }}</span>
        <div class="segmented" role="group" :aria-label="t('fng.direction')">
          <button type="button" :class="{ selected: form.direction === 'LONG' }" @click="form.direction = 'LONG'">
            {{ t('fng.long') }}
          </button>
          <button type="button" :class="{ selected: form.direction === 'SHORT' }" @click="form.direction = 'SHORT'">
            {{ t('fng.short') }}
          </button>
        </div>
      </div>
      <div class="two-col">
        <label class="field">
          <span>{{ t('fng.profitTargetPercent') }}</span>
          <input v-model="form.profitTargetPercent" inputmode="decimal" />
          <small class="field-hint">{{ t('fng.profitTargetHint') }}</small>
        </label>
        <label class="field">
          <span>{{ t('fng.profitDrawdownPercent') }}</span>
          <input v-model="form.profitDrawdownPercent" inputmode="decimal" />
          <small class="field-hint">{{ t('fng.profitDrawdownHint') }}</small>
        </label>
        <label class="field">
          <span>{{ t('fng.stopLossPercent') }}</span>
          <input v-model="form.stopLossPercent" inputmode="decimal" />
          <small class="field-hint">{{ t('fng.stopLossHint') }}</small>
        </label>
      </div>
      <SheetSelect
        id="fng-profit-target-type"
        v-model="profitTargetType"
        :label="t('fng.profitTargetType')"
        :options="profitTargetTypeOptions"
      />
      <div class="two-col">
        <label class="field">
          <span>{{ t('fng.maxOrders') }}</span>
          <input v-model.number="form.maxOrders" type="number" min="1" max="10000" />
          <small class="field-hint">{{ t('fng.maxOrdersHint') }}</small>
        </label>
        <label class="field">
          <span>{{ t('fng.maxPositions') }}</span>
          <input v-model.number="form.maxPositions" type="number" min="1" max="10000" />
          <small class="field-hint">{{ t('fng.maxPositionsHint') }}</small>
        </label>
      </div>
    </section>
    <section class="form-card preview-card">
      <h2>{{ t('fng.preview') }}</h2>
      <dl>
        <div>
          <dt>{{ t('fng.symbol') }}</dt>
          <dd>{{ form.symbol }}</dd>
        </div>
        <div>
          <dt>{{ t('fng.currentPrice') }}</dt>
          <dd>{{ currentPrice }}</dd>
        </div>
        <div>
          <dt>{{ t('fng.currentIndex') }}</dt>
          <dd>{{ currentIndex ?? '—' }}</dd>
        </div>
        <div>
          <dt>{{ t('fng.upper') }}</dt>
          <dd>{{ form.upperLimitValue }}</dd>
        </div>
        <div>
          <dt>{{ t('fng.lower') }}</dt>
          <dd>{{ form.lowerLimitValue }}</dd>
        </div>
        <div>
          <dt>{{ t('fng.basic') }}</dt>
          <dd>{{ form.basicAmount }} USDT</dd>
        </div>
        <div>
          <dt>{{ t('fng.suggestedAmount') }}</dt>
          <dd data-test="fng-suggested">{{ suggestedAmount }}</dd>
        </div>
      </dl>
      <p class="amount-hint">{{ t('fng.amountHint') }}</p>
    </section>
    <section class="form-card notification-card">
      <h2>{{ t('fng.notification') }}</h2>
      <p>{{ t('fng.notificationHint') }}</p>
      <RouterLink to="/member/notification-methods">{{ t('fng.openNotification') }}</RouterLink>
    </section>
    <p v-if="error" class="feedback error" role="alert">{{ error }}</p>
    <button class="primary" type="button" data-test="fng-save" :disabled="saving" @click="save">
      {{ saving ? t('common.loading') : t('fng.save') }}
    </button>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import { showToast } from '@nutui/nutui';
  import SheetSelect from '@/components/SheetSelect.vue';
  import { createFngStrategy, type FngStrategyInput } from '@/api/fngStrategies';
  import { getExchangeList } from '@/api';
  import { getFearGreed } from '@/api/indicators';
  import { getMarketSymbols, getMarketTickers } from '@/api/market';
  import { getPreset, type PresetItem } from '@/api/presets';

  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const form = reactive<FngStrategyInput>({
    name: '',
    exchange: 'binance',
    exchangeId: null,
    symbol: 'BTCUSDT',
    upperLimitValue: 75,
    upperLimitInterval: 5,
    lowerLimitValue: 25,
    lowerLimitInterval: 5,
    basicAmount: '100',
    increaseRatio: '10',
    leverage: 1,
    // One cycle runs from opening a position to the take-profit exit.
    // bureauPeriod is the maximum cycle length in days (1-25).
    bureauPeriod: 7,
    direction: 'LONG',
    profitTargetPercent: '10',
    profitDrawdownPercent: '5',
    stopLossPercent: '30',
    profitTargetType: 'PERCENT',
    maxOrders: 10,
    maxPositions: 5,
  });
  const exchangeOptions = ref<{ value: string; label: string; code: string }[]>([]);
  const exchangeValue = computed({
    get: () => (form.exchangeId == null ? '' : String(form.exchangeId)),
    set: (value: string) => {
      const option = exchangeOptions.value.find((item) => item.value === value);
      form.exchangeId = option ? Number(option.value) : null;
      if (option) form.exchange = option.code;
    },
  });
  const symbolOptions = ref([
    { value: 'BTCUSDT', label: 'BTC/USDT' },
    { value: 'ETHUSDT', label: 'ETH/USDT' },
  ]);
  const tickers = ref<Record<string, string>>({});
  const currentIndex = ref<number | null>(null);
  const saving = ref(false);
  const error = ref('');
  const profitTargetTypeOptions = [
    { value: 'PERCENT', label: t('fng.percent') },
    { value: 'USDT', label: t('fng.usdt') },
  ];
  const profitTargetType = computed({
    get: () => form.profitTargetType,
    set: (value: string) => {
      if (value === 'PERCENT' || value === 'USDT') form.profitTargetType = value;
    },
  });
  const currentPrice = computed(() => {
    const value = tickers.value[form.symbol];
    return value ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 }) : '—';
  });
  const suggested = computed(() => {
    const index = currentIndex.value;
    if (index == null) return null;
    const lower = Number(form.lowerLimitValue);
    const upper = Number(form.upperLimitValue);
    const lowerWidth = Math.max(1, Number(form.lowerLimitInterval));
    const upperWidth = Math.max(1, Number(form.upperLimitInterval));
    const ratio = Number(form.increaseRatio);
    const lowerStart = Math.max(0, lower - lowerWidth);
    const upperEnd = Math.min(100, upper + upperWidth);
    let multiplier = 1;
    if (index >= lowerStart && index <= lower) {
      multiplier = 1 + ratio / 100;
    } else if (index >= upper && index <= upperEnd) {
      multiplier = 1 - ratio / 100;
    }
    multiplier = Math.min(10, Math.max(0.1, multiplier));
    const amount = Number(form.basicAmount) * multiplier;
    if (!Number.isFinite(amount)) return null;
    return { multiplier, amount };
  });
  const suggestedAmount = computed(() => {
    if (!suggested.value) return '—';
    return `${suggested.value.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT (${suggested.value.multiplier.toFixed(2)}x)`;
  });

  function applyPreset(preset: PresetItem) {
    if (preset.type !== 'FNG') return;
    const params = preset.params;
    form.name = params.name ?? preset.name;
    if (params.symbol) form.symbol = params.symbol;
    if (params.upperLimitValue != null) form.upperLimitValue = Number(params.upperLimitValue);
    if (params.upperLimitInterval != null) form.upperLimitInterval = Number(params.upperLimitInterval);
    if (params.lowerLimitValue != null) form.lowerLimitValue = Number(params.lowerLimitValue);
    if (params.lowerLimitInterval != null) form.lowerLimitInterval = Number(params.lowerLimitInterval);
    if (params.basicAmount != null) form.basicAmount = String(params.basicAmount);
    if (params.increaseRatio != null) form.increaseRatio = String(params.increaseRatio);
    if (params.leverage != null) form.leverage = Number(params.leverage);
    if (params.bureauPeriod != null) form.bureauPeriod = Number(params.bureauPeriod);
    if (params.direction === 'LONG' || params.direction === 'SHORT') form.direction = params.direction;
    if (params.profitTargetPercent != null) form.profitTargetPercent = String(params.profitTargetPercent);
    if (params.profitDrawdownPercent != null) form.profitDrawdownPercent = String(params.profitDrawdownPercent);
    if (params.stopLossPercent != null) form.stopLossPercent = String(params.stopLossPercent);
    if (params.profitTargetType === 'PERCENT' || params.profitTargetType === 'USDT') {
      form.profitTargetType = params.profitTargetType;
    }
    if (params.maxOrders != null) form.maxOrders = Number(params.maxOrders);
    if (params.maxPositions != null) form.maxPositions = Number(params.maxPositions);
  }

  onMounted(async () => {
    const presetKey = typeof route.query.presetKey === 'string' ? route.query.presetKey : '';
    const [exchangeResult, symbolsResult, tickersResult, indexResult, presetResult] = await Promise.allSettled([
      getExchangeList(),
      getMarketSymbols(),
      getMarketTickers(),
      getFearGreed(1),
      presetKey ? getPreset(presetKey) : Promise.resolve(null),
    ]);
    if (exchangeResult.status === 'fulfilled') {
      exchangeOptions.value = exchangeResult.value
        .filter((exchange) => exchange.exchange.toLowerCase() === 'binance')
        .map((exchange) => ({
          value: String(exchange.id),
          label: exchange.name || exchange.exchange,
          code: exchange.exchange.toLowerCase(),
        }));
      if (exchangeOptions.value.length && form.exchangeId == null) {
        const first = exchangeOptions.value[0];
        form.exchangeId = Number(first.value);
        form.exchange = first.code;
      }
    }
    if (presetResult.status === 'fulfilled' && presetResult.value) {
      applyPreset(presetResult.value);
      showToast.success(t('presets.fngRedirect'));
    } else if (presetResult.status === 'rejected') {
      showToast.fail(t('presets.loadFailed'));
    }
    if (symbolsResult.status === 'fulfilled' && symbolsResult.value.length) {
      symbolOptions.value = symbolsResult.value.map((symbol) => ({
        value: symbol.symbol,
        label: `${symbol.baseAsset}/${symbol.quoteAsset}`,
      }));
      if (!symbolOptions.value.some((option) => option.value === form.symbol)) form.symbol = symbolOptions.value[0].value;
    }
    if (tickersResult.status === 'fulfilled') {
      tickers.value = Object.fromEntries(tickersResult.value.map((ticker) => [ticker.symbol, ticker.lastPrice]));
    }
    if (indexResult.status === 'fulfilled' && indexResult.value.points.length) {
      currentIndex.value = indexResult.value.points[0].value;
    }
  });

  function validate() {
    if (!form.name.trim()) return t('fng.invalid');
    if (form.exchangeId == null) return t('fng.exchangeMissing');
    const upper = Number(form.upperLimitValue);
    const lower = Number(form.lowerLimitValue);
    if (!Number.isFinite(upper) || !Number.isFinite(lower) || upper > 100 || lower < 0 || lower >= upper) return t('fng.invalid');
    for (const value of [form.upperLimitInterval, form.lowerLimitInterval, form.bureauPeriod]) {
      if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 25) return t('fng.invalid');
    }
    if (!Number.isInteger(Number(form.leverage)) || Number(form.leverage) < 1 || Number(form.leverage) > 20) return t('fng.invalid');
    for (const value of [form.maxOrders, form.maxPositions]) {
      if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 10000) return t('fng.invalid');
    }
    if (!(Number(form.basicAmount) > 0)) return t('fng.invalid');
    if (!(Number(form.increaseRatio) >= 0)) return t('fng.invalid');
    for (const value of [form.profitTargetPercent, form.profitDrawdownPercent, form.stopLossPercent]) {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0 || number > 100) return t('fng.invalid');
    }
    return '';
  }

  async function save() {
    const invalid = validate();
    if (invalid) {
      error.value = invalid;
      showToast.fail(invalid);
      return;
    }
    saving.value = true;
    error.value = '';
    try {
      await createFngStrategy({ ...form, name: form.name.trim() });
      showToast.success(t('fng.createSuccess'));
      void router.push('/list');
    } catch {
      error.value = t('fng.createFailed');
      showToast.fail(error.value);
    } finally {
      saving.value = false;
    }
  }
</script>
<style scoped lang="scss">
  .fng-page {
    padding: 1rem 0.5rem 1.5rem;
  }

  .form-card {
    padding: 1rem;
    margin-bottom: 0.875rem;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .form-card h2 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 700;
  }

  .field {
    display: block;
    margin-top: 0.75rem;
  }

  .field > span,
  .toggle-field > span,
  .slider-field > label > span {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.75rem;
    color: #615a53;
  }

  .field input,
  .field select {
    box-sizing: border-box;
    width: 100%;
    min-height: 2.8rem;
    padding: 0.5rem 0.75rem;
    font: inherit;
    font-size: 0.875rem;
    color: #232323;
    background: #f5f1ee;
    border: 0;
    border-radius: 0.6rem;
  }

  .field select {
    appearance: none;
  }

  .two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .field-hint {
    display: block;
    margin-top: 0.3rem;
    font-size: 0.68rem;
    line-height: 1.45;
    color: #9a8d82;
  }

  .slider-field {
    margin-top: 0.9rem;
  }

  .slider-field > label {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .slider-field > label strong {
    font-size: 0.9rem;
    color: #1989fa;
  }

  .slider-field input[type='range'] {
    width: 100%;
    margin-top: 0.4rem;
    accent-color: #1989fa;
  }

  .toggle-field {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.9rem;
  }

  .toggle-field > span {
    margin: 0;
  }

  .segmented {
    display: flex;
    flex: 1;
    gap: 0.25rem;
    max-width: 13rem;
    padding: 0.2rem;
    background: #f5f1ee;
    border-radius: 0.6rem;
  }

  .segmented button {
    flex: 1;
    min-height: 2.2rem;
    padding: 0.35rem;
    font: inherit;
    font-size: 0.78rem;
    color: #615a53;
    background: transparent;
    border: 0;
    border-radius: 0.45rem;
  }

  .segmented button.selected {
    color: #fff;
    background: #1989fa;
  }

  .preview-card dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    margin: 0;
  }

  .preview-card dt {
    font-size: 0.7rem;
    color: #8a8681;
  }

  .preview-card dd {
    margin: 0.2rem 0 0;
    font-size: 0.9rem;
    font-weight: 650;
    overflow-wrap: anywhere;
  }

  .amount-hint {
    margin: 0.6rem 0 0;
    font-size: 0.7rem;
    line-height: 1.5;
    color: #9a8d82;
  }

  .notification-card p {
    margin: 0 0 0.6rem;
    font-size: 0.75rem;
    line-height: 1.6;
    color: #8a8681;
  }

  .notification-card a {
    font-size: 0.78rem;
    color: #1989fa;
    text-decoration: none;
  }

  .feedback {
    margin: 0.5rem 0;
    font-size: 0.8rem;
    text-align: center;
  }

  .feedback.error {
    color: #b93d31;
  }

  .primary {
    width: 100%;
    min-height: 3rem;
    font: inherit;
    font-size: 0.9rem;
    color: #fff;
    background: #1989fa;
    border: 0;
    border-radius: 0.75rem;
  }

  .primary:disabled {
    opacity: 0.5;
  }

  :is(button, a, input, select):focus-visible {
    outline: 2px solid #1989fa;
    outline-offset: 2px;
  }

  @media (max-width: 350px) {
    .two-col,
    .preview-card dl {
      grid-template-columns: 1fr;
    }
  }
</style>
