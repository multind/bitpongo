<template>
  <main class="market-page" :class="{ 'red-up': colorMode === 'RED_UP' }">
    <section class="market-card">
      <div class="pair-heading">
        <div
          ><p class="market-meta">{{ t('market.pair') }}</p
          ><h1>{{ symbol.replace(/USDT$/, '/USDT') }}</h1></div
        >
        <button
          class="icon-button"
          type="button"
          data-test="market-refresh"
          :disabled="refreshing"
          :aria-label="t('market.refresh')"
          @click="refresh"
          ><PageIcon name="refresh"
        /></button>
      </div>
      <div class="ticker-row">
        <strong>{{ selectedTicker ? number(selectedTicker.lastPrice) : '—' }} <small>USDT</small></strong>
        <span v-if="selectedTicker" :class="Number(selectedTicker.changePercent) >= 0 ? 'positive' : 'negative'"
          >{{ Number(selectedTicker.changePercent) >= 0 ? '+' : '' }}{{ number(selectedTicker.changePercent) }}%</span
        >
      </div>
      <p v-if="selectedTicker" class="market-meta">{{ t('market.volume') }}: {{ number(selectedTicker.volume) }} USDT</p>
      <p v-if="selectedTicker" class="market-meta">{{ t('market.updated') }}: {{ formatInstant(selectedTicker.updatedAt) }}</p>
      <p v-if="marketError" role="alert">{{ t('market.loadFailed') }}</p>
      <SheetSelect
        id="market-symbol"
        v-model="symbol"
        data-test="market-symbol"
        :label="t('market.pair')"
        :options="pairOptions"
        searchable
      />
    </section>
    <section class="market-card">
      <div class="intervals" :aria-label="t('market.interval')">
        <button
          v-for="item in intervals"
          :key="item"
          type="button"
          :aria-pressed="interval === item"
          :class="{ selected: interval === item }"
          @click="interval = item"
          >{{ item }}</button
        >
      </div>
      <div v-if="initialLoading" class="chart-loading">
        <span class="skeleton-summary" aria-hidden="true" />
        <CandleChartSkeleton :label="t('common.loading')" />
      </div>
      <div v-else-if="chartError && !candles.length" role="alert" data-test="market-error">
        <p>{{ t('market.loadFailed') }}</p
        ><button type="button" data-test="market-retry" @click="loadCandles(true)">{{ t('market.retry') }}</button>
      </div>
      <template v-else-if="candles.length">
        <p data-test="chart-summary" :aria-busy="loading">{{ symbol }} · {{ t('market.close') }} {{ number(candles.at(-1)!.close) }}</p>
        <button type="button" :aria-pressed="pickingPrice" @click="pickingPrice = !pickingPrice">{{
          t(pickingPrice ? 'market.stopPicking' : 'market.pickPrice')
        }}</button>
        <p v-if="pickingPrice" class="market-meta">{{ t('market.pickPriceHelp') }}</p>
        <CandleChart
          :candles="candles"
          :height="600"
          :color-mode="colorMode"
          :label="`${symbol} ${interval} ${t('market.candles')}`"
          :picking-price="pickingPrice"
          :selected-price="selectedPrice"
          @select-price="selectedPrice = $event"
        />
        <p v-if="selectedPrice != null" class="market-meta"
          >{{ t('market.selectedPrice') }}: {{ selectedPriceText ? `${selectedPriceText} USDT` : t('market.pricePrecisionUnavailable') }}</p
        >
      </template>
      <p v-else>{{ t('market.empty') }}</p>
      <p class="market-meta">{{ t('market.source') }}</p>
      <RouterLink
        class="create-alert"
        :to="{
          path: '/alerts/create',
          query: { symbol, ...(selectedPriceText == null ? {} : { price: selectedPriceText }) },
        }"
        ><PageIcon name="plus" />{{ t('alerts.create') }}</RouterLink
      >
    </section>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import { getMarketSymbols, getMarketTickers, getMarketCandles } from '@/api/market';
  import type { MarketSymbol, MarketTicker, MarketCandle } from '@/api/market';
  import { formatInstant } from '@/utils/timeUtils';
  import CandleChart from './components/CandleChart.vue';
  import { formatChartPrice } from './chart-price';
  import CandleChartSkeleton from './components/CandleChartSkeleton.vue';
  import PageIcon from '@/components/PageIcon.vue';
  import SheetSelect from '@/components/SheetSelect.vue';
  import { useUserStore } from '@/store/modules/user';
  const user = useUserStore();
  const colorMode = computed(() => user.info.upDownColor || 'GREEN_UP');
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const symbol = computed({
    get: () => (typeof route.params.symbol === 'string' ? route.params.symbol : 'BTCUSDT'),
    set: (value: string) => {
      void router.replace({ path: `/market/${encodeURIComponent(value)}`, query: route.query });
    },
  });
  const interval = ref('1h');
  const pickingPrice = ref(false);
  const selectedPrice = ref<number | null>(null);
  const selectedPriceText = computed(() =>
    selectedPrice.value == null
      ? null
      : formatChartPrice(selectedPrice.value, symbols.value.find((s) => s.symbol === symbol.value)?.priceTickSize),
  );
  watch(symbol, () => {
    selectedPrice.value = null;
    pickingPrice.value = false;
  });
  const intervals = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
  const symbols = ref<MarketSymbol[]>([]);
  const pairOptions = computed(() => {
    const options = symbols.value.map((item) => ({ value: item.symbol, label: `${item.baseAsset}/${item.quoteAsset}` }));
    if (!options.some((item) => item.value === symbol.value)) options.unshift({ value: symbol.value, label: symbol.value });
    return options;
  });
  const tickers = ref<MarketTicker[]>([]);
  const candles = ref<MarketCandle[]>([]);
  const loading = ref(false);
  const refreshing = ref(false);
  const marketError = ref(false);
  const chartError = ref(false);
  let generation = 0;
  let mounted = true;
  let timer: ReturnType<typeof setInterval>;
  const selectedTicker = computed(() => tickers.value.find((s) => s.symbol === symbol.value));
  const initialLoading = computed(() => loading.value && !candles.value.length);
  const number = (value: string) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });
  async function loadCandles(reset = false) {
    const request = ++generation;
    loading.value = true;
    chartError.value = false;
    if (reset) candles.value = [];
    try {
      const result = await getMarketCandles(symbol.value, interval.value);
      if (mounted && request === generation) candles.value = result;
    } catch {
      if (mounted && request === generation) chartError.value = true;
    } finally {
      if (mounted && request === generation) loading.value = false;
    }
  }
  async function refresh() {
    if (refreshing.value) return;
    refreshing.value = true;
    marketError.value = false;
    try {
      const [directory, snapshot] = await Promise.all([getMarketSymbols(), getMarketTickers()]);
      if (mounted) {
        symbols.value = directory;
        tickers.value = snapshot;
      }
    } catch {
      if (mounted) marketError.value = true;
    } finally {
      if (mounted) refreshing.value = false;
    }
    if (mounted) await loadCandles();
  }
  watch([symbol, interval], () => loadCandles(true));
  onMounted(() => {
    void refresh();
    timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30000);
  });
  onUnmounted(() => {
    mounted = false;
    generation++;
    clearInterval(timer);
  });
</script>
<style scoped lang="scss">
  .market-page {
    padding: 0.75rem;
  }

  .market-card {
    padding: 1rem;
    margin-bottom: 0.875rem;
    background: #fff;
    border-radius: 0.75rem;
  }

  .pair-heading {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
  }

  .pair-heading h1 {
    font-size: 1.375rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .pair-heading .market-meta {
    margin: 0;
  }

  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    padding: 0.5rem;
    background: transparent;
    border: 0;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }

  select {
    margin-top: 0.875rem;
  }

  .create-alert {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    min-height: 3rem;
    padding: 0.5rem;
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #fff;
    text-decoration: none;
    background: #1989fa;
    border-radius: 0.875rem;
  }

  [data-test='chart-summary'] {
    margin: 1rem 0;
    font-size: 0.75rem;
    color: #81766b;
  }

  .skeleton-summary {
    display: block;
    width: 9rem;
    height: 0.85rem;
    margin: 1rem 0;
    background: #eee8e2;
    border-radius: 0.35rem;
  }

  .intervals button {
    flex: 1;
    min-width: 2rem;
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
    background: #f5f3f0;
    border: 0;
    border-radius: 0.5rem;
  }

  .intervals .selected {
    color: #1989fa;
    background: #eaf4ff;
  }

  label {
    display: block;
    margin: 0.5rem 0;
    font-size: 0.875rem;
    color: #666;
  }

  input,
  select {
    box-sizing: border-box;
    width: 100%;
    min-height: 2.75rem;
    padding: 0.5rem 0.75rem;
    font: inherit;
    color: #333;
    background: #fafafa;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
  }

  button {
    min-height: 2.5rem;
    padding: 0.5rem 0.875rem;
    font: inherit;
    color: #333;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 1.25rem;
  }

  button:disabled {
    opacity: 0.6;
  }

  .ticker-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
    margin-top: 1.25rem;
  }

  strong {
    font-size: 1.5rem;
  }

  small {
    font-size: 0.75rem;
    font-weight: normal;
  }

  .positive {
    color: #16a34a;
  }

  .negative {
    color: #dc2626;
  }

  .red-up .positive {
    color: #dc2626;
  }

  .red-up .negative {
    color: #16a34a;
  }

  .market-meta {
    font-size: 0.75rem;
    line-height: 1.5;
    color: #777;
  }

  .intervals {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .selected {
    color: #1989fa;
    border-color: #1989fa;
  }
</style>
