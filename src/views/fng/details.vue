<template>
  <div v-if="loading" class="page-state" role="status">{{ t('common.loading') }}</div>
  <div v-else-if="error || !strategy" class="page-state error" role="alert">
    <p>{{ t('presets.loadFailed') }}</p>
    <button type="button" class="text-button" @click="load">{{ t('presets.retry') }}</button>
  </div>
  <main v-else class="fng-details">
    <header class="detail-heading">
      <div class="heading-title">
        <h1>{{ strategy.name }}</h1>
        <span class="run-state" :class="{ active: strategy.enabled }">{{ strategy.enabled ? t('list.active') : t('list.paused') }}</span>
      </div>
      <div class="tag-row">
        <span class="tag">F&amp;G</span>
        <span class="tag exchange-tag">{{ strategy.exchange }}</span>
      </div>
      <div class="heading-meta">
        <p>{{ strategy.symbol }} · {{ strategy.leverage }}x · {{ strategy.direction === 'LONG' ? t('fng.long') : t('fng.short') }}</p>
        <p>{{ t('fngDetail.created') }} {{ formatInstant(strategy.createdAt) }}</p>
      </div>
      <p v-if="roundBlockMessage" class="round-notice" role="status">{{ roundBlockMessage }}</p>
    </header>

    <NutTabs v-model="value" class="fng-tabs" swipeable auto-height :ellipsis="false" :title-scroll="false">
      <template #titles>
        <nav class="detail-tabs" :aria-label="t('list.details')">
          <button
            v-for="item in tabs"
            :key="item.key"
            type="button"
            class="detail-tab"
            :class="{ active: value === item.key }"
            :aria-pressed="value === item.key"
            @click="value = item.key"
          >
            {{ t(item.label) }}
          </button>
        </nav>
      </template>

      <NutTabPane pane-key="c1" :style="tabPaneStyle('c1')">
        <section class="detail-panel detail-card returns-card">
          <div class="returns-primary">
            <h2>{{ t('fngDetail.realizedPnl') }}</h2>
            <strong class="money-value" :class="pnlClass(performance?.realizedPnl)"
              ><span>{{ performance?.realizedPnl ?? '0' }}</span> <small>USDT</small></strong
            >
          </div>
          <div class="summary-grid">
            <div>
              <span>{{ t('fngDetail.totalMargin') }}</span>
              <strong class="money-value"
                ><span>{{ performance?.totalMargin ?? '0' }}</span> <small>USDT</small></strong
              >
            </div>
            <div>
              <span>{{ t('fngDetail.winRate') }}</span>
              <strong>{{ performance?.winRate ?? '0' }}%</strong>
            </div>
            <div>
              <span>{{ t('fngDetail.totalTrades') }}</span>
              <strong>{{ performance?.totalTrades ?? 0 }}</strong>
            </div>
            <div>
              <span>{{ t('fngDetail.openPositions') }}</span>
              <strong>{{ performance?.openPositions ?? 0 }}</strong>
            </div>
            <div>
              <span>{{ t('fngDetail.closedPositions') }}</span>
              <strong>{{ performance?.closedPositions ?? 0 }}</strong>
            </div>
          </div>
          <h2 class="section-title">{{ t('fngDetail.pnlCurve') }}</h2>
          <div v-if="curvePoints" class="curve-wrap">
            <svg viewBox="0 0 320 160" class="curve-chart" role="img" :aria-label="t('fngDetail.pnlCurve')">
              <line x1="2" y1="80" x2="318" y2="80" stroke="#e9e3dd" stroke-width="1.5" />
              <polygon :points="curveArea" fill="rgba(25, 137, 250, 0.1)" />
              <polyline
                :points="curvePoints"
                fill="none"
                stroke="#1989fa"
                stroke-width="2.5"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <p v-else class="empty-state">{{ t('fngDetail.noPnlData') }}</p>
        </section>
      </NutTabPane>
      <NutTabPane pane-key="c2" :style="tabPaneStyle('c2')">
        <section class="detail-panel info-panel">
          <section class="detail-card info-group">
            <h2>{{ t('fngDetail.entryConditions') }}</h2>
            <dl class="info-grid">
              <div
                ><dt>{{ t('fng.symbol') }}</dt
                ><dd>{{ strategy.symbol }}</dd></div
              >
              <div
                ><dt>{{ t('fng.exchange') }}</dt
                ><dd>{{ strategy.exchange }}</dd></div
              >
              <div
                ><dt>{{ t('fng.direction') }}</dt
                ><dd>{{ strategy.direction === 'LONG' ? t('fng.long') : t('fng.short') }}</dd></div
              >
              <div
                ><dt>{{ t('fng.upperLimitValue') }}</dt
                ><dd>{{ strategy.upperLimitValue }}</dd></div
              >
              <div
                ><dt>{{ t('fng.upperLimitInterval') }}</dt
                ><dd>{{ strategy.upperLimitInterval }}</dd></div
              >
              <div
                ><dt>{{ t('fng.lowerLimitValue') }}</dt
                ><dd>{{ strategy.lowerLimitValue }}</dd></div
              >
              <div
                ><dt>{{ t('fng.lowerLimitInterval') }}</dt
                ><dd>{{ strategy.lowerLimitInterval }}</dd></div
              >
              <div
                ><dt>{{ t('fng.basicAmount') }}</dt
                ><dd>{{ strategy.basicAmount }} USDT</dd></div
              >
              <div
                ><dt>{{ t('fng.increaseRatio') }}</dt
                ><dd>{{ strategy.increaseRatio }}%</dd></div
              >
              <div
                ><dt>{{ t('fng.leverage') }}</dt
                ><dd>{{ strategy.leverage }}x</dd></div
              >
              <div
                ><dt>{{ t('fng.maxOrders') }}</dt
                ><dd>{{ strategy.maxOrders }}</dd></div
              >
              <div
                ><dt>{{ t('fng.maxPositions') }}</dt
                ><dd>{{ strategy.maxPositions }}</dd></div
              >
            </dl>
          </section>
          <section class="detail-card info-group">
            <h2>{{ t('fngDetail.exitRules') }}</h2>
            <dl class="info-grid">
              <div>
                <dt>{{ t('fngDetail.profitTarget') }}</dt>
                <dd>{{ strategy.profitTargetPercent }}{{ strategy.profitTargetType === 'PERCENT' ? '%' : ' USDT' }}</dd>
              </div>
              <div
                ><dt>{{ t('fng.profitDrawdownPercent') }}</dt
                ><dd>{{ strategy.profitDrawdownPercent }}%</dd></div
              >
              <div
                ><dt>{{ t('fng.stopLossPercent') }}</dt
                ><dd>{{ strategy.stopLossPercent == null ? '—' : `${strategy.stopLossPercent}%` }}</dd></div
              >
            </dl>
          </section>
          <section class="detail-card info-group">
            <h2>{{ t('fngDetail.tradeRounds') }}</h2>
            <dl class="info-grid">
              <div
                ><dt>{{ t('fng.completedTradeRounds') }}</dt
                ><dd>{{ strategy.completedTradeRounds }} / {{ strategy.maxTradeRounds ?? '—' }}</dd></div
              >
            </dl>
            <form class="round-limit-form" @submit.prevent="saveRoundLimit">
              <label>
                {{ t('fng.maxTradeRounds') }}
                <input v-model.number="roundLimit" type="number" min="1" max="10000" step="1" required data-test="fng-round-limit" />
              </label>
              <button type="submit" class="round-limit-save" :disabled="savingRoundLimit">{{ t('common.save') }}</button>
              <small>{{ t('fng.maxTradeRoundsHint') }}</small>
            </form>
          </section>
        </section>
      </NutTabPane>
      <NutTabPane pane-key="c3" :style="tabPaneStyle('c3')">
        <section class="detail-panel">
          <p v-if="!positions.length" class="empty-state">{{ t('fngDetail.noPositions') }}</p>
          <article v-for="position in positions" :key="position.id" class="trade-card">
            <header class="trade-heading">
              <strong>{{ position.symbol }}</strong>
              <span class="side" :class="position.side.toLowerCase()">{{ position.side }}</span>
              <span class="position-state">{{ statusLabel(position.status) }}</span>
            </header>
            <dl class="trade-stats">
              <div
                ><dt>{{ t('fngDetail.quantity') }}</dt
                ><dd>{{ position.quantity }}</dd></div
              >
              <div v-if="position.remainingQuantity != null">
                <dt>{{ t('fngDetail.remainingQuantity') }}</dt>
                <dd>{{ position.remainingQuantity }}</dd>
              </div>
              <div>
                <dt>{{ t('fngDetail.price') }}</dt>
                <dd>{{ position.entryPrice ?? '—' }} → {{ position.exitPrice ?? '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('fngDetail.pnl') }}</dt>
                <dd :class="pnlClass(position.realizedPnl)">
                  {{ position.realizedPnl ?? '—' }}<small v-if="position.pnlPercent">（{{ position.pnlPercent }}%）</small>
                </dd>
              </div>
              <div
                ><dt>{{ t('fngDetail.openedAt') }}</dt
                ><dd>{{ formatInstant(position.openedAt) }}</dd></div
              >
              <div
                ><dt>{{ t('fngDetail.closedAt') }}</dt
                ><dd>{{ position.closedAt ? formatInstant(position.closedAt) : '—' }}</dd></div
              >
            </dl>
            <p v-if="position.status === 'CLOSE_REVIEW'" class="close-review-note">{{ t('fngDetail.closeReviewHint') }}</p>
          </article>
          <button v-if="positionsHasMore" type="button" class="load-more" :disabled="positionsLoading" @click="loadPositions(false)">
            {{ positionsLoading ? t('common.loading') : t('fngDetail.loadMore') }}
          </button>
        </section>
      </NutTabPane>
      <NutTabPane pane-key="c4" :style="tabPaneStyle('c4')">
        <section class="detail-panel">
          <p v-if="!executions.length" class="empty-state">{{ t('fngDetail.noExecutions') }}</p>
          <article
            v-for="execution in executions"
            :key="`${execution.id}-${execution.event}-${execution.occurredAt}`"
            class="execution-card"
          >
            <header class="execution-heading">
              <span class="event" :class="execution.event.toLowerCase()">{{ t(`fngDetail.${execution.event.toLowerCase()}`) }}</span>
              <strong>{{ execution.symbol }} {{ execution.side }}</strong>
              <time>{{ formatInstant(execution.occurredAt) }}</time>
            </header>
            <p class="execution-body">
              <span v-if="execution.price">{{ t('fngDetail.price') }} {{ execution.price }}</span>
              <span v-if="execution.quantity">{{ t('fngDetail.quantity') }} {{ execution.quantity }}</span>
              <span v-if="execution.reason">{{ execution.reason }}</span>
            </p>
          </article>
          <button v-if="executionsHasMore" type="button" class="load-more" :disabled="executionsLoading" @click="loadExecutions(false)">
            {{ executionsLoading ? t('common.loading') : t('fngDetail.loadMore') }}
          </button>
        </section>
      </NutTabPane>
    </NutTabs>
    <footer class="fng-action-bar">
      <NutButton :disabled="!strategy.enabled && !!roundBlockMessage" @click="toggleEnabled">
        {{ strategy.enabled ? t('fngDetail.pause') : t('fngDetail.resume') }}
      </NutButton>
      <NutButton @click="remove">{{ t('common.delete') }}</NutButton>
      <PlazaVisibilityAction type="FNG" :strategy-id="strategyId" />
    </footer>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import PlazaVisibilityAction from '@/components/PlazaVisibilityAction.vue';
  import { useRoute, useRouter } from 'vue-router';
  import { Button as NutButton, Tabs as NutTabs, TabPane as NutTabPane, showDialog, showToast } from '@nutui/nutui';
  import '@nutui/nutui/dist/packages/tabs/index.css';
  import '@nutui/nutui/dist/packages/tabpane/index.css';
  import { formatInstant } from '@/utils/timeUtils';
  import {
    deleteFngStrategy,
    getFngExecutions,
    getFngPerformance,
    getFngPositions,
    getFngStrategy,
    setFngStrategyEnabled,
    setFngTradeRoundLimit,
    type FngExecution,
    type FngPerformance,
    type FngPosition,
    type FngStrategy,
  } from '@/api/fngStrategies';

  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const strategyId = computed(() => Number(route.params.id));
  const strategy = ref<FngStrategy | null>(null);
  const roundLimit = ref<number | ''>('');
  const savingRoundLimit = ref(false);
  const roundBlockMessage = computed(() => {
    if (!strategy.value) return '';
    const { maxTradeRounds, completedTradeRounds } = strategy.value;
    if (maxTradeRounds == null) return t('fng.roundLimitRequired');
    return completedTradeRounds >= maxTradeRounds ? t('fng.roundLimitReached') : '';
  });
  const performance = ref<FngPerformance | null>(null);
  const positions = ref<FngPosition[]>([]);
  const executions = ref<FngExecution[]>([]);
  const value = ref('c1');
  const loading = ref(true);
  const error = ref(false);
  const positionsLoading = ref(false);
  const executionsLoading = ref(false);
  const positionsPage = ref(0);
  const executionsPage = ref(0);
  const positionsHasMore = ref(false);
  const executionsHasMore = ref(false);
  const tabs = [
    { key: 'c1', label: 'details.tabs.returns' },
    { key: 'c2', label: 'details.tabs.strategyInfo' },
    { key: 'c3', label: 'details.tabs.trades' },
    { key: 'c4', label: 'details.tabs.executions' },
  ];

  const tabPaneStyle = (paneKey: string) => ({
    height: value.value === paneKey ? 'auto' : '0',
    overflow: value.value === paneKey ? 'visible' : 'hidden',
  });

  const statusLabel = (status: string) => t(`fngDetail.statuses.${status}`);
  const pnlClass = (value: string | null | undefined) => {
    const number = Number(value);
    if (value == null || !Number.isFinite(number)) return '';
    return number > 0 ? 'positive' : number < 0 ? 'negative' : '';
  };

  const curvePoints = computed(() => {
    const points = performance.value?.curve ?? [];
    if (points.length < 2) return '';
    const values = points.map((point) => Number(point.pnl)).filter(Number.isFinite);
    if (values.length < 2) return '';
    const low = Math.min(...values, 0);
    const high = Math.max(...values, 0);
    const range = high - low || 1;
    return values.map((pnl, index) => `${2 + (index * 316) / (values.length - 1)},${158 - ((pnl - low) * 156) / range}`).join(' ');
  });
  const curveArea = computed(() => (curvePoints.value ? `2,158 ${curvePoints.value} 318,158` : ''));

  async function load() {
    loading.value = true;
    error.value = false;
    try {
      const [detail, summary] = await Promise.all([getFngStrategy(strategyId.value), getFngPerformance(strategyId.value)]);
      strategy.value = detail;
      roundLimit.value = detail.maxTradeRounds ?? '';
      performance.value = summary;
      await Promise.all([loadPositions(true), loadExecutions(true)]);
    } catch {
      error.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function loadPositions(reset: boolean) {
    if (positionsLoading.value) return;
    positionsLoading.value = true;
    try {
      const next = reset ? 0 : positionsPage.value + 1;
      const result = await getFngPositions(strategyId.value, next, 20);
      positions.value = reset ? result.items : [...positions.value, ...result.items];
      positionsPage.value = result.page;
      positionsHasMore.value = result.hasMore;
    } catch {
      showToast.fail(t('presets.loadFailed'));
    } finally {
      positionsLoading.value = false;
    }
  }

  async function loadExecutions(reset: boolean) {
    if (executionsLoading.value) return;
    executionsLoading.value = true;
    try {
      const next = reset ? 0 : executionsPage.value + 1;
      const result = await getFngExecutions(strategyId.value, next, 20);
      executions.value = reset ? result.items : [...executions.value, ...result.items];
      executionsPage.value = result.page;
      executionsHasMore.value = result.hasMore;
    } catch {
      showToast.fail(t('presets.loadFailed'));
    } finally {
      executionsLoading.value = false;
    }
  }

  async function toggleEnabled() {
    if (!strategy.value) return;
    try {
      await setFngStrategyEnabled(strategy.value.id, !strategy.value.enabled);
      strategy.value.enabled = !strategy.value.enabled;
    } catch {
      showToast.fail(t('fng.createFailed'));
    }
  }

  async function saveRoundLimit() {
    if (
      !strategy.value ||
      savingRoundLimit.value ||
      typeof roundLimit.value !== 'number' ||
      !Number.isInteger(roundLimit.value) ||
      roundLimit.value < 1 ||
      roundLimit.value > 10000
    )
      return;
    savingRoundLimit.value = true;
    try {
      await setFngTradeRoundLimit(strategyId.value, roundLimit.value);
      strategy.value = await getFngStrategy(strategyId.value);
      roundLimit.value = strategy.value.maxTradeRounds ?? '';
    } catch {
      showToast.fail(t('fng.createFailed'));
    } finally {
      savingRoundLimit.value = false;
    }
  }

  function remove() {
    if (!strategy.value) return;
    showDialog({
      title: t('common.delete'),
      content: t('fngDetail.deleteConfirm'),
      onOk: async () => {
        try {
          await deleteFngStrategy(strategy.value!.id);
          void router.push('/list');
        } catch {
          showToast.fail(t('fng.createFailed'));
        }
      },
    });
  }

  onMounted(load);
</script>
<style scoped lang="scss">
  .fng-details {
    padding: 0.75rem 1rem calc(4.5rem + env(safe-area-inset-bottom));
    color: #33413b;
  }

  .round-limit-form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: end;
    margin-top: 0.75rem;
  }

  .round-limit-form label {
    display: grid;
    flex: 1 1 9rem;
    gap: 0.25rem;
    font-size: 0.85rem;
  }

  .round-limit-form input {
    width: 100%;
    min-width: 0;
    padding: 0.45rem 0.55rem;
    font: inherit;
    border: 1px solid #d9d1c9;
    border-radius: 0.4rem;
  }

  .round-limit-form small {
    flex: 1 0 100%;
    color: #74685d;
  }

  .round-limit-save {
    padding: 0.45rem 0.75rem;
    color: #fff;
    background: #176bc4;
    border: 0;
    border-radius: 0.4rem;
  }

  .round-limit-save:disabled {
    opacity: 0.6;
  }

  .page-state {
    padding: 2rem 1rem;
    color: #81776d;
    text-align: center;
  }

  .page-state.error {
    color: #b93d31;
  }

  .text-button {
    padding: 0.6rem;
    font: inherit;
    font-size: 0.85rem;
    color: #1989fa;
    background: transparent;
    border: 0;
  }

  .heading-title {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    justify-content: space-between;
  }

  h1 {
    min-width: 0;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
    margin-top: 0.5rem;
  }

  .tag {
    padding: 0.125rem 0.375rem;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #6f645a;
    background: #f5f1ee;
    border-radius: 0.25rem;
  }

  .exchange-tag {
    text-transform: capitalize;
  }

  .run-state {
    flex-shrink: 0;
    padding: 0.125rem 0.375rem;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #81766b;
    background: #eee8e2;
    border-radius: 0.25rem;
  }

  .run-state.active {
    color: #328642;
    background: #e7f4e8;
  }

  .heading-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.75rem;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.82rem;
    color: #665e57;
  }

  .heading-meta p {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .round-notice {
    padding: 0.55rem 0.75rem;
    margin: 0.75rem 0 0;
    font-size: 0.82rem;
    color: #8c4814;
    background: #fff1df;
    border-radius: 0.5rem;
  }

  .fng-action-bar {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 100;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.375rem;
    width: 100%;
    max-width: 46.875rem;
    padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom));
    margin: 0 auto;
    background: #fffaf5;
    border-top: 1px solid #f1e8e0;
  }

  .fng-action-bar :deep(.nut-button) {
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
    padding-inline: 0.25rem;
    font-size: 1.0625rem;
    line-height: 1.2;
    white-space: normal;
  }

  .detail-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0;
    background: #f2f2f2;
    border-radius: 0.65rem;
  }

  .detail-tab {
    min-width: 0;
    min-height: 2.75rem;
    padding: 0.375rem 0.125rem;
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.2;
    color: #6c6864;
    overflow-wrap: anywhere;
    white-space: normal;
    background: transparent;
    border: 0;
  }

  .detail-tab.active {
    font-weight: 600;
    color: #176bc4;
  }

  .detail-panel {
    margin-top: 0.625rem;
  }

  .fng-tabs {
    margin-top: 1rem;
  }

  .fng-tabs :deep(.nut-tabs__titles) {
    height: auto;
  }

  .fng-tabs :deep(.detail-tabs) {
    width: 100%;
  }

  .fng-tabs :deep(.nut-tab-pane) {
    padding: 0;
    word-break: normal;
    background: transparent;
  }

  .detail-card,
  .trade-card,
  .execution-card {
    padding: 1rem;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .returns-primary {
    padding-bottom: 0.8rem;
    margin-bottom: 0.8rem;
    border-bottom: 1px solid #f1e8e0;
  }

  .returns-primary h2,
  .info-group h2,
  .section-title {
    margin: 0 0 0.625rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .returns-primary strong {
    font-size: 1.5rem;
    line-height: 1.2;
  }

  .money-value {
    display: flex;
    flex-wrap: wrap;
    gap: 0.125rem 0.25rem;
    align-items: baseline;
    overflow-wrap: anywhere;
  }

  .money-value small {
    font-size: 0.72em;
    white-space: nowrap;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .summary-grid span {
    display: block;
    font-size: 0.78rem;
    color: #6c6864;
  }

  .summary-grid strong:not(.money-value) {
    display: block;
  }

  .summary-grid strong {
    margin-top: 0.25rem;
    font-size: 1.05rem;
    overflow-wrap: anywhere;
  }

  .section-title {
    padding-top: 0.85rem;
    margin-top: 0.85rem;
    border-top: 1px solid #f1e8e0;
  }

  .curve-wrap {
    width: 100%;
  }

  .curve-chart {
    display: block;
    width: 100%;
    height: auto;
  }

  .curve-chart .positive,
  .curve-chart .negative {
    stroke: #1989fa;
  }

  .empty-state {
    padding: 1.5rem 0.5rem;
    margin: 0.5rem 0;
    font-size: 0.85rem;
    color: #74685d;
    text-align: center;
    background: #faf8f6;
    border-radius: 0.5rem;
  }

  .info-panel {
    display: grid;
    gap: 0.625rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
    margin: 0;
  }

  .info-grid dt {
    font-size: 0.78rem;
    color: #6c6864;
  }

  .info-grid dd {
    margin: 0.2rem 0 0;
    font-size: 0.92rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .trade-card + .trade-card,
  .execution-card + .execution-card {
    margin-top: 0.6rem;
  }

  .trade-heading,
  .execution-heading {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }

  .trade-heading strong,
  .execution-heading strong {
    font-size: 0.92rem;
  }

  .side {
    padding: 0.1rem 0.35rem;
    font-size: 0.72rem;
    color: #fff;
    border-radius: 0.3rem;
  }

  .side.long {
    background: #16a34a;
  }

  .side.short {
    background: #dc2626;
  }

  .position-state {
    margin-left: auto;
    font-size: 0.75rem;
    color: #81766b;
  }

  .close-review-note {
    margin: 0.75rem 0 0;
    font-size: 0.8rem;
    line-height: 1.5;
    color: #8c4814;
  }

  .trade-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
    margin: 0.65rem 0 0;
  }

  .trade-stats dt {
    font-size: 0.75rem;
    color: #8a8681;
  }

  .trade-stats dd {
    margin: 0.2rem 0 0;
    font-size: 0.88rem;
    overflow-wrap: anywhere;
  }

  .trade-stats small {
    margin-left: 0.2rem;
  }

  .positive {
    color: #16a34a;
  }

  .negative {
    color: #dc2626;
  }

  .execution-heading time {
    margin-left: auto;
    font-size: 0.75rem;
    color: #9a8d82;
  }

  .event {
    padding: 0.1rem 0.35rem;
    font-size: 0.72rem;
    border-radius: 0.3rem;
  }

  .event.entry {
    color: #16a34a;
    background: #e7f4e8;
  }

  .event.exit {
    color: #1989fa;
    background: #e8f2fe;
  }

  .event.failed {
    color: #b93d31;
    background: #fce9e4;
  }

  .execution-body {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.45rem 0 0;
    font-size: 0.82rem;
    color: #8a8681;
  }

  .load-more {
    width: 100%;
    min-height: 2.4rem;
    margin-top: 0.75rem;
    font: inherit;
    font-size: 0.88rem;
    color: #1989fa;
    background: #f5f1ee;
    border: 0;
    border-radius: 0.6rem;
  }

  :is(button, a, input):focus-visible {
    outline: 2px solid #1989fa;
    outline-offset: 2px;
  }
</style>
