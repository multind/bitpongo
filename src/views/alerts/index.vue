<template>
  <main class="alert-page" @keydown.esc="closePanels">
    <header class="toolbar">
      <button
        class="icon-button"
        type="button"
        data-test="alert-filter-toggle"
        :aria-label="t('alerts.filters')"
        :aria-expanded="filtersOpen"
        aria-controls="alert-filters"
        @click="
          filtersOpen = true;
          addOpen = false;
        "
        ><PageIcon name="menu"
      /></button>
      <div class="toolbar-right">
        <button
          class="icon-button"
          type="button"
          data-test="alert-add-toggle"
          :aria-label="t('alerts.createOptions')"
          :aria-expanded="addOpen"
          aria-controls="alert-add-menu"
          @click="addOpen = !addOpen"
          ><PageIcon name="plus" /><span class="add-label">{{ t('alerts.create') }}</span></button
        >
      </div>
    </header>
    <div class="alerts-heading"
      ><h1>{{ t('tabbar.alerts') }}</h1
      ><span v-if="loaded" class="count" data-test="alert-count">{{ total }}</span></div
    >
    <button v-if="addOpen" class="menu-scrim" type="button" :aria-label="t('common.cancel')" @click="addOpen = false" />
    <nav v-if="addOpen" id="alert-add-menu" class="add-menu" :aria-label="t('alerts.createOptions')">
      <RouterLink to="/alerts/create" @click="addOpen = false"><PageIcon name="plus" />{{ t('alerts.create') }}</RouterLink>
      <RouterLink to="/market" @click="addOpen = false"><PageIcon name="chart" />{{ t('alerts.chartCreate') }}</RouterLink>
    </nav>
    <nav class="quick-links" :aria-label="t('alerts.actions')">
      <RouterLink to="/alerts/events"><PageIcon name="bell" />{{ t('alerts.inbox') }}</RouterLink>
      <RouterLink to="/alerts/logs"><PageIcon name="log" />{{ t('alerts.logs') }}</RouterLink>
      <button
        type="button"
        :disabled="busy || !rules.length"
        @click="
          selecting = !selecting;
          selected = [];
        "
        >{{ selecting ? t('common.cancel') : t('alerts.manageSelection') }}</button
      >
    </nav>
    <form class="search-field" role="search" @submit.prevent="load(0)">
      <PageIcon name="search" />
      <input v-model="query" type="search" :placeholder="t('alerts.search')" :aria-label="t('alerts.search')" />
      <button type="submit" :disabled="busy" :aria-label="t('common.search')"><PageIcon name="chevron" /></button>
    </form>
    <nav class="status-tabs" :aria-label="t('alerts.status')"
      ><button
        v-for="option in statusOptions"
        :key="option.value"
        type="button"
        :aria-pressed="status === option.value"
        :disabled="busy"
        @click="
          status = option.value;
          load(0);
        "
        >{{ t(option.label) }}</button
      ></nav
    >
    <div v-if="status !== 'all' || selecting" class="list-context">
      <span v-if="status !== 'all'" class="filter-tag">{{
        t(status === 'expired' ? 'alerts.expired' : status === 'active' ? 'alerts.active' : 'alerts.paused')
      }}</span>
      <button
        v-if="selecting"
        class="text-button"
        type="button"
        @click="
          selecting = false;
          selected = [];
        "
        >{{ t('common.cancel') }}</button
      >
    </div>
    <div v-if="error" class="feedback error" role="alert">
      <p>{{ t('alerts.failed') }}</p
      ><button class="text-button" :disabled="busy" @click="load(0)">{{ t('market.retry') }}</button>
    </div>
    <p v-if="initialLoading" class="sr-only" role="status">{{ t('common.loading') }}</p>
    <div v-if="selecting && selected.length" class="selection-bar">
      <span>{{ selected.length }}</span>
      <button type="button" :disabled="busy" @click="bulk('enable')">{{ t('alerts.enableSelected') }}</button>
      <button type="button" :disabled="busy" @click="bulk('disable')">{{ t('alerts.pauseSelected') }}</button>
      <button type="button" class="danger-text" :disabled="busy" @click="removeSelected">{{ t('common.delete') }}</button>
    </div>
    <section class="rule-list" :aria-label="t('alerts.priceAlerts')" :aria-busy="busy">
      <AlertListSkeleton v-if="initialLoading" />
      <template v-else>
        <SwipeCell
          v-for="(rule, index) in rules"
          :key="rule.id"
          ref="swipeCells"
          :name="rule.id"
          :disabled="selecting || busy"
          @open="onSwipeOpen"
          @close="openRule = null"
        >
          <article class="rule-entry">
            <input
              v-if="selecting"
              v-model="selected"
              class="selection-checkbox"
              type="checkbox"
              :value="rule.id"
              :aria-label="rule.name"
            />
            <RouterLink :to="`/alerts/${rule.id}`" class="rule-content">
              <div class="rule-heading"
                ><h2>{{ rule.name }}</h2
                ><time :datetime="rule.createdAt" :title="formatInstant(rule.createdAt)">{{
                  formatInstant(rule.createdAt).slice(0, 10)
                }}</time></div
              >
              <div class="rule-summary"
                ><span class="symbol">{{ rule.symbol }}</span
                ><span
                  class="status-badge"
                  :class="expired(rule) ? 'expired' : rule.enabled ? 'active' : 'paused'"
                  data-test="alert-status"
                  >{{ t(expired(rule) ? 'alerts.expired' : rule.enabled ? 'alerts.active' : 'alerts.paused') }}</span
                ></div
              >
              <p class="condition"
                >{{ t(`alerts.conditions.${rule.condition}`) }} {{ rule.target ?? `${rule.lower}–${rule.upper}` }} ·
                {{ t('alerts.triggered') }} {{ rule.triggeredCount }}</p
              >
            </RouterLink>
            <button
              v-if="!selecting"
              type="button"
              class="more-button"
              :aria-label="`${t('alerts.actions')}: ${rule.name}`"
              :aria-expanded="openRule === rule.id"
              @click.stop="toggleActions(index, rule.id)"
              ><PageIcon name="more"
            /></button>
          </article>
          <template #right>
            <div class="swipe-actions" :aria-hidden="openRule !== rule.id" :inert="openRule !== rule.id">
              <button
                type="button"
                class="toggle-action"
                data-test="alert-toggle"
                :disabled="busy || expired(rule)"
                @click="run(() => setAlertEnabled(rule.id, !rule.enabled))"
                ><PageIcon :name="rule.enabled ? 'pause' : 'play'" /><span>{{
                  t(rule.enabled ? 'common.pause' : 'common.resume')
                }}</span></button
              >
              <button type="button" class="copy-action" :disabled="busy" @click="run(() => copyAlert(rule.id))"
                ><PageIcon name="copy" /><span>{{ t('alerts.copy') }}</span></button
              >
              <button type="button" class="delete-action" :disabled="busy" @click="remove(rule.id)"
                ><PageIcon name="trash" /><span>{{ t('common.delete') }}</span></button
              >
            </div>
          </template>
        </SwipeCell>
      </template>
    </section>
    <div v-if="!busy && !rules.length && !error" class="empty-state"
      ><PageIcon name="bell" /><p>{{ t('alerts.empty') }}</p
      ><button class="text-button" type="button" @click="addOpen = true">{{ t('alerts.create') }}</button></div
    >
    <nav v-if="hasMore" class="pagination" :aria-label="t('tabbar.alerts')">
      <button type="button" class="text-button" :disabled="busy" @click="load(page + 1, true)">{{
        busy ? t('common.loading') : t('fng.loadMore')
      }}</button>
    </nav>
    <Popup
      v-model:show="filtersOpen"
      class="filter-drawer"
      position="left"
      teleport="body"
      :z-index="3000"
      safe-area-inset-top
      safe-area-inset-bottom
      :aria-label="t('alerts.filters')"
      @keydown.esc="filtersOpen = false"
    >
      <aside id="alert-filters" data-test="alert-filters">
        <header class="drawer-heading"
          ><h2>{{ t('alerts.filters') }}</h2
          ><button class="icon-button" data-test="alert-filter-close" :aria-label="t('common.cancel')" @click="filtersOpen = false"
            ><PageIcon name="close" /></button
        ></header>
        <fieldset
          ><legend>{{ t('alerts.status') }}</legend>
          <label v-for="option in statusOptions" :key="option.value" class="radio-row"
            ><span>{{ t(option.label) }}</span
            ><input v-model="status" type="radio" name="alert-status-filter" :value="option.value" @change="load(0)"
          /></label>
        </fieldset>
        <nav class="drawer-links" :aria-label="t('alerts.createOptions')">
          <RouterLink to="/alerts/subscriptions"
            ><PageIcon name="chart" />{{ t('subscriptions.title') }}<PageIcon name="chevron"
          /></RouterLink>
          <RouterLink to="/alerts/webhooks"><PageIcon name="link" />{{ t('webhook.title') }}<PageIcon name="chevron" /></RouterLink>
          <RouterLink to="/alerts/events"><PageIcon name="bell" />{{ t('alerts.inbox') }}<PageIcon name="chevron" /></RouterLink>
        </nav>
        <div class="drawer-buttons">
          <button
            type="button"
            :disabled="busy || !rules.length"
            @click="
              selecting = !selecting;
              selected = [];
              filtersOpen = false;
            "
            >{{ t('alerts.manageSelection') }}</button
          >
          <button
            type="button"
            :disabled="busy"
            @click="
              load(0);
              filtersOpen = false;
            "
            ><PageIcon name="refresh" />{{ t('market.refresh') }}</button
          >
        </div>
      </aside>
    </Popup>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Popup, SwipeCell, type SwipeCellInstance } from 'vant';
  import 'vant/es/style/base.css';
  import 'vant/es/overlay/index.css';
  import 'vant/es/popup/index.css';
  import 'vant/es/swipe-cell/index.css';
  import { showDialog } from '@nutui/nutui';
  import PageIcon from '@/components/PageIcon.vue';
  import AlertListSkeleton from './components/AlertListSkeleton.vue';
  import { listAlerts, setAlertEnabled, copyAlert, deleteAlert, bulkAlerts } from '@/api/alerts';
  import type { AlertRule } from '@/api/alerts';
  import { formatInstant } from '@/utils/timeUtils';
  const { t } = useI18n();
  const expired = (rule: AlertRule) => rule.expiresAt != null && Date.parse(rule.expiresAt) <= Date.now();
  const rules = ref<AlertRule[]>([]);
  const selected = ref<number[]>([]);
  const total = ref(0);
  const loaded = ref(false);
  const busy = ref(false);
  const initialLoading = computed(() => busy.value && !loaded.value);
  const error = ref(false);
  const query = ref('');
  const status = ref('all');
  const page = ref(0);
  const hasMore = ref(false);
  const filtersOpen = ref(false);
  const addOpen = ref(false);
  const selecting = ref(false);
  const openRule = ref<number | null>(null);
  const swipeCells = ref<SwipeCellInstance[]>([]);
  const statusOptions = [
    { value: 'all', label: 'alerts.all' },
    { value: 'active', label: 'alerts.active' },
    { value: 'inactive', label: 'alerts.paused' },
    { value: 'expired', label: 'alerts.expired' },
  ];
  let generation = 0;
  function closePanels() {
    addOpen.value = false;
    filtersOpen.value = false;
    swipeCells.value.forEach((cell) => cell.close('outside'));
  }
  function onSwipeOpen({ name }: { name: string | number }) {
    swipeCells.value.forEach((cell) => {
      if (Number(cell.name) !== Number(name)) cell.close('outside');
    });
    openRule.value = Number(name);
  }
  function toggleActions(index: number, id: number) {
    const cell = swipeCells.value[index];
    if (openRule.value === id) cell?.close('outside');
    else cell?.open('right');
  }
  async function load(target: number, append = false) {
    const request = ++generation;
    busy.value = true;
    error.value = false;
    swipeCells.value.forEach((cell) => cell.close('outside'));
    try {
      const result = await listAlerts({ q: query.value, status: status.value, page: target, size: 20 });
      if (request === generation) {
        rules.value = append
          ? [...rules.value, ...result.items.filter((item) => !rules.value.some((rule) => rule.id === item.id))]
          : result.items;
        total.value = result.total;
        loaded.value = true;
        page.value = result.page;
        hasMore.value = result.hasMore;
        selected.value = [];
        openRule.value = null;
      }
    } catch {
      if (request === generation) error.value = true;
    } finally {
      if (request === generation) busy.value = false;
    }
  }
  async function run(action: () => Promise<unknown>) {
    if (busy.value) return;
    busy.value = true;
    error.value = false;
    try {
      await action();
      await load(0);
    } catch {
      error.value = true;
    } finally {
      busy.value = false;
    }
  }
  function remove(id: number) {
    showDialog({ title: t('common.delete'), content: t('alerts.deleteConfirm'), onOk: () => run(() => deleteAlert(id)) });
  }
  function bulk(action: string) {
    void run(() => bulkAlerts([...selected.value], action));
  }
  function removeSelected() {
    showDialog({ title: t('common.delete'), content: t('alerts.deleteConfirm'), onOk: () => bulk('delete') });
  }
  onMounted(() => load(0));
  onUnmounted(() => generation++);
</script>
<style scoped lang="scss">
  .alert-page {
    position: relative;
    padding: 1rem 0.5rem;
  }

  button,
  a,
  input {
    -webkit-tap-highlight-color: transparent;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  button:disabled {
    cursor: default;
    opacity: 0.45;
  }

  .toolbar,
  .toolbar-right,
  .alerts-heading,
  .rule-entry,
  .rule-summary,
  .drawer-heading,
  .radio-row,
  .pagination {
    display: flex;
    align-items: center;
  }

  .toolbar {
    justify-content: space-between;
    margin: 0 -0.5rem 1.125rem;
  }

  .toolbar-right {
    gap: 0.25rem;
  }

  .add-label {
    margin-left: 0.35rem;
    font-size: 0.75rem;
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    padding: 0.5rem;
    color: #364636;
    text-decoration: none;
    background: transparent;
    border: 0;
    border-radius: 0.65rem;
  }

  .alerts-heading {
    gap: 0.65rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 750;
    line-height: 1.2;
    letter-spacing: -0.04em;
  }

  .count {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.4rem;
    min-height: 1.4rem;
    padding: 0.15rem 0.4rem;
    font-size: 0.75rem;
    color: #fff;
    background: #ff801b;
    border-radius: 1rem;
  }

  .search-field {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    min-height: 3rem;
    padding: 0 0.875rem;
    margin-bottom: 0.75rem;
    color: #8a8681;
    background: #f1eeeb;
    border-radius: 0.875rem;
  }

  .search-field > svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .search-field input {
    box-sizing: border-box;
    flex: 1;
    width: 0;
    min-width: 0;
    min-height: 3rem;
    padding: 0.5rem 0;
    font: inherit;
    font-size: 0.875rem;
    color: #232323;
    background: transparent;
    border: 0;
  }

  .search-field button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.5rem;
    min-height: 2.75rem;
    padding: 0;
    color: #81776d;
    background: transparent;
    border: 0;
  }

  .search-field button svg {
    width: 1rem;
  }

  .rule-list {
    margin: 0;
  }

  .quick-links,
  .status-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.875rem;
  }

  .quick-links a,
  .quick-links button {
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;
    padding: 0.5rem;
    font-size: 0.75rem;
    color: #615a53;
    text-decoration: none;
    background: transparent;
    border: 0;
  }

  .quick-links svg {
    width: 1rem;
    height: 1rem;
  }

  .status-tabs button {
    padding: 0.55rem 0.875rem;
    font-size: 0.75rem;
    color: #81766b;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 0.65rem;
  }

  .status-tabs button[aria-pressed='true'] {
    color: #1989fa;
    background: #edf6ff;
    border-color: #1989fa;
  }

  :deep(.van-swipe-cell) {
    margin-bottom: 0.75rem;
    overflow: hidden;
    border-radius: 1rem;
  }

  .rule-entry {
    box-sizing: border-box;
    gap: 0.5rem;
    min-height: 6rem;
    padding: 1rem;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .rule-content {
    flex: 1;
    min-width: 0;
    color: inherit;
    text-decoration: none;
  }

  .rule-heading {
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 650;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  time {
    flex-shrink: 0;
    font-size: 0.65rem;
    color: #92867c;
    white-space: nowrap;
  }

  .rule-summary {
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.5rem;
  }

  .symbol {
    font-size: 0.8125rem;
    color: #615a53;
  }

  .status-badge {
    padding: 0.15rem 0.4rem;
    font-size: 0.65rem;
    line-height: 1.4;
    border-radius: 0.3rem;
  }

  .active {
    color: #328642;
    background: #e7f4e8;
  }

  .paused {
    color: #81766b;
    background: #eee8e2;
  }

  .expired {
    color: #ba4b3b;
    background: #fce9e4;
  }

  .condition {
    margin-top: 0.4rem;
    font-size: 0.65rem;
    line-height: 1.5;
    color: #9a8d82;
    overflow-wrap: anywhere;
  }

  .more-button {
    display: flex;
    align-items: center;
    align-self: stretch;
    justify-content: center;
    min-width: 2rem;
    padding: 0;
    color: #a99b8e;
    background: transparent;
    border: 0;
  }

  .more-button svg {
    width: 1.25rem;
  }

  .swipe-actions {
    display: flex;
    height: 100%;
  }

  .swipe-actions button {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 100%;
    padding: 0.5rem;
    font-size: 0.7rem;
    color: #fff;
    border: 0;
    border-radius: 0;
  }

  .toggle-action {
    background: #1989fa;
  }

  .copy-action {
    background: #59626c;
  }

  .delete-action {
    background: #dd5748;
  }

  .selection-checkbox {
    width: 1.2rem;
    height: 1.2rem;
    accent-color: #1989fa;
  }

  .selection-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    padding: 0.75rem;
    background: #fff;
    border-radius: 0.75rem;
  }

  .selection-bar button {
    min-height: 2.5rem;
    padding: 0.4rem;
    font-size: 0.75rem;
    background: transparent;
    border: 0;
  }

  .danger-text {
    color: #c74a3d;
  }

  .list-context {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .filter-tag {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    color: #81766b;
    background: #eee8e2;
    border-radius: 0.5rem;
  }

  .text-button {
    min-height: 2.75rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    color: #1989fa;
    background: transparent;
    border: 0;
  }

  .feedback {
    padding: 1rem;
    margin: 1rem 0;
    font-size: 0.875rem;
    line-height: 1.6;
    text-align: center;
    background: #fff;
    border-radius: 0.875rem;
  }

  .error {
    color: #b93d31;
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

  .loading {
    padding: 0.75rem;
    font-size: 0.75rem;
    color: #9a8d82;
    text-align: center;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    padding: 4rem 1rem;
    font-size: 0.875rem;
    color: #a99b8e;
  }

  .empty-state svg {
    width: 2.5rem;
    height: 2.5rem;
  }

  .pagination {
    justify-content: space-between;
    margin-top: 1rem;
    font-size: 0.75rem;
    color: #92867c;
  }

  .menu-scrim {
    position: fixed;
    inset: 0;
    z-index: 2001;
    padding: 0;
    background: #0002;
    border: 0;
  }

  .add-menu {
    position: absolute;
    top: 4.125rem;
    right: 0.5rem;
    z-index: 2002;
    width: min(17rem, calc(100vw - 2rem));
    padding: 0.375rem 0;
    overflow: hidden;
    color: #fff;
    background: #353c39;
    border-radius: 0.875rem;
    box-shadow: 0 0.5rem 2rem #0002;
  }

  .add-menu a {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: inherit;
    text-decoration: none;
  }

  .add-menu a:hover {
    background: #ffffff14;
  }

  .add-menu svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  .filter-drawer {
    box-sizing: border-box;
    width: min(21rem, 86vw);
    height: 100%;
    padding: max(1rem, env(safe-area-inset-top)) 1.25rem max(1.5rem, env(safe-area-inset-bottom));
    background: var(--app-page-background, #fffaf5);
  }

  .drawer-heading {
    gap: 0.5rem;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .drawer-heading h2 {
    font-size: 1.25rem;
  }

  fieldset {
    min-width: 0;
    padding: 0 0 1.25rem;
    margin: 0;
    border: 0;
    border-bottom: 1px solid #eae4de;
  }

  legend {
    margin-bottom: 0.75rem;
    font-size: 0.75rem;
    color: #9a8d82;
  }

  .radio-row {
    gap: 1rem;
    justify-content: space-between;
    min-height: 3rem;
    font-size: 0.9rem;
  }

  .radio-row input {
    width: 1.15rem;
    height: 1.15rem;
    accent-color: #1989fa;
  }

  .drawer-links {
    padding: 1rem 0;
    border-bottom: 1px solid #eae4de;
  }

  .drawer-links a {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    min-height: 3.25rem;
    font-size: 0.875rem;
    color: #514d47;
    text-decoration: none;
  }

  .drawer-links a > svg:first-child {
    width: 1.15rem;
  }

  .drawer-links a > svg:last-child {
    width: 0.875rem;
    margin-left: auto;
  }

  .drawer-buttons {
    display: grid;
    gap: 0.65rem;
    padding-top: 1.25rem;
  }

  .drawer-buttons button {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    min-height: 2.75rem;
    padding: 0.6rem;
    font-size: 0.875rem;
    color: #514d47;
    background: #fff;
    border: 1px solid #eae4de;
    border-radius: 0.75rem;
  }

  .drawer-buttons svg {
    width: 1rem;
    height: 1rem;
  }

  :is(button, a, input):focus-visible {
    outline: 2px solid #1989fa;
    outline-offset: 2px;
  }

  @media (max-width: 350px) {
    .rule-heading {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>
