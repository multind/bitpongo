<template>
  <main class="market-page" :class="{ 'red-up': colorMode === 'RED_UP' }">
    <header class="page-heading">
      <div
        ><p class="eyebrow">BITPONGO</p><h1>{{ t('tabbar.market') }}</h1></div
      >
      <div class="heading-actions">
        <button
          class="icon-button"
          type="button"
          data-test="market-refresh"
          :aria-label="t('market.refresh')"
          :disabled="refreshing"
          @click="refresh"
          ><PageIcon name="refresh"
        /></button>
        <RouterLink class="icon-button" to="/alerts/events" :aria-label="t('alerts.inbox')"><PageIcon name="bell" /></RouterLink>
      </div>
    </header>
    <label class="search-field">
      <PageIcon name="search" />
      <input v-model="query" type="search" :placeholder="t('market.searchHint')" :aria-label="t('market.search')" />
    </label>
    <div class="list-heading"
      ><span>{{ t('market.pair') }}</span
      ><span>{{ t('market.priceChange') }}</span></div
    >
    <div v-if="marketError" class="feedback" role="alert" data-test="market-error">
      <p>{{ t('market.loadFailed') }}</p
      ><button class="text-button" data-test="market-retry" :disabled="refreshing" @click="refresh">{{ t('market.retry') }}</button>
    </div>
    <p v-if="initialLoading" class="sr-only" role="status">{{ t('common.loading') }}</p>
    <section class="asset-list" :aria-label="t('market.pair')" :aria-busy="refreshing">
      <MarketListSkeleton v-if="initialLoading" :rows="pageSize" />
      <template v-else>
        <RouterLink v-for="asset in visibleAssets" :key="asset.symbol" class="asset-row" :to="`/market/${asset.symbol}`">
          <div class="asset-identity">
            <img v-if="coinIcons[asset.baseAsset]" :src="coinIcons[asset.baseAsset]" alt="" class="coin-logo" />
            <span v-else class="coin-placeholder">{{ asset.baseAsset.slice(0, 2) }}</span>
            <div class="asset-name"
              ><strong>{{ asset.baseAsset }}</strong
              ><span>{{ asset.quoteAsset }}</span></div
            >
          </div>
          <svg
            v-if="trends[asset.symbol]"
            viewBox="0 0 96 40"
            class="sparkline"
            :class="trendClass(asset.symbol)"
            aria-hidden="true"
            data-test="market-sparkline"
          >
            <polyline
              :points="trends[asset.symbol]"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
          <span v-else class="trend-placeholder" aria-hidden="true">—</span>
          <div class="asset-price">
            <strong>{{ tickersBySymbol[asset.symbol] ? number(tickersBySymbol[asset.symbol]!.lastPrice) : '—' }}</strong>
            <span v-if="tickersBySymbol[asset.symbol]" :class="trendClass(asset.symbol)"
              >{{ Number(tickersBySymbol[asset.symbol]!.changePercent) >= 0 ? '+' : ''
              }}{{ number(tickersBySymbol[asset.symbol]!.changePercent) }}%</span
            >
            <span v-else>—</span>
          </div>
        </RouterLink>
      </template>
    </section>
    <p v-if="!refreshing && !marketError && !filteredAssets.length" class="feedback">{{ t('market.empty') }}</p>
    <nav v-if="filteredAssets.length > pageSize" class="pagination" :aria-label="t('market.pair')">
      <button class="text-button" :disabled="page === 0" @click="page--">{{ t('alerts.previous') }}</button>
      <span>{{ page + 1 }} / {{ Math.ceil(filteredAssets.length / pageSize) }}</span>
      <button class="text-button" :disabled="(page + 1) * pageSize >= filteredAssets.length" @click="page++">{{ t('alerts.next') }}</button>
    </nav>
    <p class="source">{{ t('market.source') }}</p>
    <RouterLink class="index-entry" to="/market/indicators">
      <span class="index-icon"><PageIcon name="chart" /></span>
      <div
        ><strong>{{ t('indicators.fearGreed') }}</strong
        ><span>{{ t('subscriptions.viewIndex') }}</span></div
      >
      <PageIcon name="chevron" />
    </RouterLink>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getMarketSymbols, getMarketTickers, getMarketCandles, type MarketSymbol, type MarketTicker } from '@/api/market';
  import { useUserStore } from '@/store/modules/user';
  import PageIcon from '@/components/PageIcon.vue';
  import MarketListSkeleton from './components/MarketListSkeleton.vue';
  const { t } = useI18n();
  const user = useUserStore();
  const colorMode = computed(() => user.info.upDownColor || 'GREEN_UP');
  const query = ref('');
  const symbols = ref<MarketSymbol[]>([]);
  const tickers = ref<MarketTicker[]>([]);
  const refreshing = ref(false);
  const marketError = ref(false);
  const page = ref(0);
  const pageSize = 12;
  const trends = ref<Record<string, string>>({});
  const historyTimes = new Map<string, number>();
  const pending = new Set<string>();
  const coinFiles = import.meta.glob<string>('../../assets/coins/*.png', { eager: true, import: 'default' });
  const coinIcons = Object.fromEntries(Object.entries(coinFiles).map(([path, url]) => [path.split('/').pop()!.replace('.png', ''), url]));
  const tickersBySymbol = computed(() => Object.fromEntries(tickers.value.map((ticker) => [ticker.symbol, ticker])));
  const initialLoading = computed(() => refreshing.value && !symbols.value.length);
  const filteredAssets = computed(() => {
    const search = query.value.trim().toUpperCase().replace(/\//g, '');
    // Keep a predictable default order, then use real quote volume for the rest.
    const priority = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    return symbols.value
      .filter((asset) => asset.symbol.includes(search))
      .slice()
      .sort((a, b) => {
        const rankA = priority.indexOf(a.symbol),
          rankB = priority.indexOf(b.symbol);
        if (rankA !== -1 || rankB !== -1) return (rankA === -1 ? priority.length : rankA) - (rankB === -1 ? priority.length : rankB);
        return Number(tickersBySymbol.value[b.symbol]?.volume || 0) - Number(tickersBySymbol.value[a.symbol]?.volume || 0);
      });
  });
  const visibleAssets = computed(() => filteredAssets.value.slice(page.value * pageSize, (page.value + 1) * pageSize));
  const number = (value: string) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });
  const trendClass = (symbol: string) => (Number(tickersBySymbol.value[symbol]?.changePercent || 0) >= 0 ? 'positive' : 'negative');
  let mounted = true;
  let timer: ReturnType<typeof setInterval>;
  async function loadTrends() {
    // Limit concurrency and cache sparklines; never synthesize history from a 24h percentage.
    const queue = visibleAssets.value.filter(
      (asset) => !pending.has(asset.symbol) && Date.now() - (historyTimes.get(asset.symbol) || 0) > 300000,
    );
    queue.forEach((asset) => pending.add(asset.symbol));
    await Promise.all(
      Array.from({ length: Math.min(3, queue.length) }, async () => {
        while (queue.length && mounted) {
          const asset = queue.shift()!;
          try {
            const candles = await getMarketCandles(asset.symbol, '1h', 24);
            const prices = candles.map((candle) => Number(candle.close));
            if (mounted && prices.length >= 2 && prices.every(Number.isFinite)) {
              const low = Math.min(...prices),
                range = Math.max(...prices) - low;
              trends.value[asset.symbol] = prices
                .map((price, i) => `${2 + (i * 92) / (prices.length - 1)},${range ? 36 - ((price - low) * 32) / range : 20}`)
                .join(' ');
            }
          } catch {
            // The ticker remains usable if its optional trend history is unavailable.
          } finally {
            historyTimes.set(asset.symbol, Date.now());
            pending.delete(asset.symbol);
          }
        }
      }),
    );
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
        if (page.value * pageSize >= directory.length) page.value = 0;
        void loadTrends();
      }
    } catch {
      if (mounted) marketError.value = true;
    } finally {
      if (mounted) refreshing.value = false;
    }
  }
  watch(query, () => {
    page.value = 0;
  });
  watch(visibleAssets, () => {
    void loadTrends();
  });
  onMounted(() => {
    void refresh();
    timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30000);
  });
  onUnmounted(() => {
    mounted = false;
    clearInterval(timer);
  });
</script>
<style scoped lang="scss">
  .market-page {
    padding: 1.5rem 0.5rem 1rem;
  }

  .page-heading,
  .heading-actions,
  .asset-identity,
  .pagination {
    display: flex;
    align-items: center;
  }

  .page-heading {
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .eyebrow {
    margin-bottom: 0.35rem;
    font-size: 0.625rem;
    font-weight: 600;
    color: #917a69;
    letter-spacing: 0.18em;
  }

  h1 {
    font-size: 2rem;
    font-weight: 750;
    line-height: 1.2;
    letter-spacing: -0.04em;
  }

  .heading-actions {
    gap: 0.25rem;
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    color: #364636;
    text-decoration: none;
    background: transparent;
    border: 0;
    border-radius: 50%;
  }

  .icon-button:disabled {
    opacity: 0.4;
  }

  .search-field {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    min-height: 3rem;
    padding: 0 0.875rem;
    color: #8a8681;
    background: #f1eeeb;
    border-radius: 0.875rem;
  }

  .search-field svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: 3rem;
    font: inherit;
    font-size: 0.875rem;
    color: #232323;
    outline-offset: 0.15rem;
    background: transparent;
    border: 0;
  }

  .list-heading {
    display: flex;
    justify-content: space-between;
    margin: 1.5rem 0 0.25rem;
    font-size: 0.7rem;
    color: #8a8681;
  }

  .asset-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4rem minmax(6.25rem, 1fr);
    gap: 0.5rem;
    align-items: center;
    min-height: 5.25rem;
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid #eae4de;
  }

  .asset-identity {
    gap: 0.65rem;
    min-width: 0;
  }

  .coin-logo,
  .coin-placeholder {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
  }

  .coin-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #776153;
    background: #eee8e2;
  }

  .asset-name {
    min-width: 0;
  }

  .asset-name strong {
    display: block;
    font-size: 0.95rem;
    overflow-wrap: anywhere;
  }

  .asset-name span,
  .asset-price span {
    display: block;
    margin-top: 0.3rem;
    font-size: 0.75rem;
    color: #8a8681;
  }

  .asset-price {
    min-width: 0;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .asset-price strong {
    display: block;
    font-size: 1rem;
    overflow-wrap: anywhere;
  }

  .sparkline {
    width: 100%;
    height: 2.5rem;
  }

  .trend-placeholder {
    color: #c8c0b8;
    text-align: center;
  }

  .asset-price .positive,
  .positive {
    color: #16a34a;
  }

  .asset-price .negative,
  .negative {
    color: #dc2626;
  }

  .red-up .positive {
    color: #dc2626;
  }

  .red-up .negative {
    color: #16a34a;
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

  .feedback {
    padding: 1.5rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.6;
    color: #777;
    text-align: center;
    background: #fff;
    border-radius: 0.875rem;
  }

  [role='alert'] {
    color: #b93d31;
  }

  .text-button {
    padding: 0.6rem 0.75rem;
    font: inherit;
    font-size: 0.8rem;
    color: #1989fa;
    background: transparent;
    border: 0;
  }

  .text-button:disabled {
    color: #a9a19a;
  }

  .pagination {
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #8a8681;
  }

  .source {
    margin: 1.25rem 0;
    font-size: 0.65rem;
    line-height: 1.6;
    color: #9a8d82;
  }

  .index-entry {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 1rem;
    color: inherit;
    text-decoration: none;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .index-icon {
    padding: 0.65rem;
    color: #fb791a;
    background: #fff1e4;
    border-radius: 0.75rem;
  }

  .index-entry div {
    flex: 1;
    min-width: 0;
  }

  .index-entry strong {
    font-size: 0.875rem;
  }

  .index-entry div span {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #8a8681;
  }

  .index-entry > svg {
    width: 1rem;
    color: #b8aba0;
  }

  :is(button, a, input):focus-visible {
    outline: 2px solid #1989fa;
    outline-offset: 2px;
  }

  @media (max-width: 350px) {
    .asset-row {
      grid-template-columns: minmax(0, 1fr) 2.5rem minmax(5.25rem, 1fr);
      gap: 0.35rem;
    }

    .coin-logo,
    .coin-placeholder {
      width: 2rem;
      height: 2rem;
    }

    .asset-identity {
      gap: 0.4rem;
    }
  }
</style>
