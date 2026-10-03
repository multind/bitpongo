<template>
  <main class="market-page">
    <RouterLink class="market-card" to="/market/indicators">{{ t('indicators.fearGreed') }}</RouterLink>
    <section class="market-card">
      <label for="market-search">{{ t('market.search') }}</label>
      <input id="market-search" v-model="query" type="search" :placeholder="t('market.searchHint')" />
      <label for="market-symbol">{{ t('market.pair') }}</label>
      <select id="market-symbol" v-model="symbol" data-test="market-symbol">
        <option v-for="item in filteredSymbols" :key="item.symbol" :value="item.symbol">{{ item.baseAsset }}/{{ item.quoteAsset }}</option>
      </select>
      <div class="ticker-row">
        <strong>{{ selectedTicker ? number(selectedTicker.lastPrice) : '—' }} <small>USDT</small></strong>
        <span v-if="selectedTicker" :class="Number(selectedTicker.changePercent) >= 0 ? 'positive' : 'negative'"
          >{{ Number(selectedTicker.changePercent) >= 0 ? '+' : '' }}{{ number(selectedTicker.changePercent) }}%</span
        >
      </div>
      <p v-if="selectedTicker" class="market-meta">{{ t('market.volume') }}: {{ number(selectedTicker.volume) }} USDT</p>
      <p v-if="selectedTicker" class="market-meta">{{ t('market.updated') }}: {{ formatInstant(selectedTicker.updatedAt) }}</p>
      <p v-if="marketError" role="alert">{{ t('market.loadFailed') }}</p>
      <button type="button" :disabled="refreshing" @click="refresh">{{ refreshing ? t('common.loading') : t('market.refresh') }}</button>
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
      <p v-if="loading" role="status">{{ t('common.loading') }}</p>
      <div v-else-if="chartError" role="alert" data-test="market-error">
        <p>{{ t('market.loadFailed') }}</p
        ><button type="button" data-test="market-retry" @click="loadCandles">{{ t('market.retry') }}</button>
      </div>
      <template v-else-if="candles.length">
        <p data-test="chart-summary">{{ symbol }} · {{ t('market.close') }} {{ number(candles.at(-1)!.close) }}</p>
        <CandleChart :candles="candles" :label="`${symbol} ${interval} ${t('market.candles')}`" />
      </template>
      <p v-else>{{ t('market.empty') }}</p>
      <p class="market-meta">{{ t('market.source') }}</p>
      <RouterLink :to="{ path: '/alerts/create', query: { symbol } }">{{ t('alerts.create') }}</RouterLink>
    </section>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getMarketSymbols, getMarketTickers, getMarketCandles } from '@/api/market';
  import type { MarketSymbol, MarketTicker, MarketCandle } from '@/api/market';
  import { formatInstant } from '@/utils/timeUtils';
  import CandleChart from './components/CandleChart.vue';
  const { t } = useI18n();
  const query = ref('');
  const symbol = ref('BTCUSDT');
  const interval = ref('1h');
  const intervals = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
  const symbols = ref<MarketSymbol[]>([]);
  const tickers = ref<MarketTicker[]>([]);
  const candles = ref<MarketCandle[]>([]);
  const loading = ref(false);
  const refreshing = ref(false);
  const marketError = ref(false);
  const chartError = ref(false);
  let generation = 0;
  let mounted = true;
  let timer: ReturnType<typeof setInterval>;
  const filteredSymbols = computed(() =>
    symbols.value.filter((s) => s.symbol === symbol.value || s.symbol.includes(query.value.trim().toUpperCase())),
  );
  const selectedTicker = computed(() => tickers.value.find((s) => s.symbol === symbol.value));
  const number = (value: string) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });
  async function loadCandles() {
    const request = ++generation;
    loading.value = true;
    chartError.value = false;
    candles.value = [];
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
  watch([symbol, interval], loadCandles);
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
    padding: 12px 0;
  }

  .market-card {
    padding: 16px;
    margin-bottom: 14px;
    background: #fff;
    border-radius: 12px;
  }

  label {
    display: block;
    margin: 8px 0;
    font-size: 14px;
    color: #666;
  }

  input,
  select {
    box-sizing: border-box;
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    font: inherit;
    color: #333;
    background: #fafafa;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  button {
    min-height: 40px;
    padding: 8px 14px;
    font: inherit;
    color: #333;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 20px;
  }

  button:disabled {
    opacity: 0.6;
  }

  .ticker-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
  }

  strong {
    font-size: 24px;
  }

  small {
    font-size: 12px;
    font-weight: normal;
  }

  .positive {
    color: #16a34a;
  }

  .negative {
    color: #dc2626;
  }

  .market-meta {
    font-size: 12px;
    line-height: 1.5;
    color: #777;
  }

  .intervals {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .selected {
    color: #1989fa;
    border-color: #1989fa;
  }
</style>
