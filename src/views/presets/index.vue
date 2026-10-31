<template>
  <main class="presets-page">
    <div class="toolbar-row">
      <button class="filter-button" type="button" data-test="presets-filter" @click="filterOpen = true">
        <PageIcon name="menu" />
        <span>{{ t('presets.sort') }}</span>
      </button>
      <span class="total">{{ total }}</span>
    </div>
    <p v-if="loading && !items.length" class="feedback" role="status">{{ t('common.loading') }}</p>
    <div v-else-if="error" class="feedback error" role="alert">
      <p>{{ t('presets.loadFailed') }}</p>
      <button class="text-button" type="button" :disabled="loading" @click="load(true)">{{ t('presets.retry') }}</button>
    </div>
    <p v-else-if="!items.length" class="feedback">{{ t('presets.empty') }}</p>
    <section v-else class="preset-list" :aria-label="t('presets.title')">
      <article
        v-for="item in items"
        :key="item.key"
        class="preset-card"
        role="button"
        tabindex="0"
        :data-test="`preset-${item.key}`"
        @click="openUse(item)"
        @keydown.enter="openUse(item)"
      >
        <div class="card-top">
          <div class="author">
            <span class="author-avatar" aria-hidden="true"
              ><img v-if="item.authorAvatar" :src="item.authorAvatar" alt="" @error="item.authorAvatar = null" /><template v-else>{{
                initial(item.author)
              }}</template></span
            >
            <strong>{{ item.author }}</strong>
            <span v-if="item.official" class="official-badge">{{ t('presets.officialBadge') }}</span>
            <span v-if="item.recommended" class="recommended-badge">{{ t('presets.recommendedBadge') }}</span>
          </div>
          <button
            class="favorite-button"
            type="button"
            :aria-label="item.favorite ? t('presets.favorited') : t('presets.favorite')"
            :aria-pressed="item.favorite"
            :data-test="`preset-favorite-${item.key}`"
            @click.stop="favorite(item)"
          >
            <HeartFill v-if="item.favorite" class="favorite-icon active" />
            <Heart v-else class="favorite-icon" />
            <span>{{ item.favorite ? t('presets.favorited') : t('presets.favorite') }}</span>
          </button>
        </div>
        <h2>{{ item.name }}</h2>
        <div class="followers">
          <People />
          <span>{{ item.followers }}/100</span>
        </div>
        <svg class="sparkline" viewBox="0 0 120 48" aria-hidden="true">
          <template v-if="sparkline(item)">
            <polygon :points="sparklineArea(item)" fill="rgba(251, 121, 26, 0.12)" />
            <polyline
              :points="sparkline(item)"
              fill="none"
              stroke="#fb791a"
              stroke-width="2.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </template>
          <line v-else x1="2" y1="42" x2="118" y2="42" stroke="#e5ddd6" stroke-width="2" stroke-dasharray="4 4" />
        </svg>
        <dl class="stats">
          <div>
            <dt :class="ratioClass(item)">{{ ratio(item) }}</dt>
            <dd>{{ t('presets.totalRevenue') }}</dd>
          </div>
          <div>
            <dt>{{ exchangeName(item.exchange) }}</dt>
            <dd>{{ t('presets.exchangeLabel') }}</dd>
          </div>
          <div>
            <dt class="symbol">
              <img v-if="coinIcon(item.symbols[0])" :src="coinIcon(item.symbols[0])" alt="" />
              {{ item.symbols[0] || '—' }}
            </dt>
            <dd>{{ t('presets.symbol') }}</dd>
          </div>
          <div>
            <dt>{{ item.runtimeDays == null ? '—' : `${item.runtimeDays}D` }}</dt>
            <dd>{{ t('presets.runTime') }}</dd>
          </div>
        </dl>
      </article>
    </section>
    <button v-if="hasMore" class="load-more" type="button" :disabled="loadingMore" @click="loadMore">
      {{ loadingMore ? t('common.loading') : t('common.more') }}
    </button>
    <div v-if="filterOpen" class="filter-scrim" @click.self="filterOpen = false">
      <section class="filter-sheet" role="dialog" aria-modal="true" :aria-label="t('presets.sort')">
        <header class="filter-heading">
          <h2>{{ t('presets.sort') }}</h2>
          <button class="text-button" type="button" data-test="presets-filter-reset" @click="resetFilters">{{ t('presets.reset') }}</button>
        </header>
        <div class="filter-section">
          <h3>{{ t('presets.sort') }}</h3>
          <div class="chips">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              class="chip"
              :class="{ selected: draft.sort === option.value }"
              @click="draft.sort = option.value"
            >
              {{ t(option.label) }}
            </button>
          </div>
        </div>
        <div class="filter-section">
          <h3>{{ t('presets.type') }}</h3>
          <div class="chips">
            <button
              v-for="option in typeOptions"
              :key="option.value"
              type="button"
              class="chip"
              :class="{ selected: draft.type === option.value }"
              @click="draft.type = option.value"
            >
              {{ t(option.label) }}
            </button>
          </div>
        </div>
        <div class="filter-section">
          <h3>{{ t('presets.owner') }}</h3>
          <div class="chips">
            <button
              v-for="option in ownerOptions"
              :key="option.value"
              type="button"
              class="chip"
              :class="{ selected: draft.owner === option.value }"
              @click="draft.owner = option.value"
            >
              {{ t(option.label) }}
            </button>
          </div>
        </div>
        <div class="filter-section">
          <h3>{{ t('presets.exchange') }}</h3>
          <div class="chips">
            <button
              v-for="option in exchangeOptions"
              :key="option.value"
              type="button"
              class="chip"
              :class="{ selected: draft.exchange === option.value }"
              @click="draft.exchange = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="filter-section">
          <h3>{{ t('presets.runningDays') }}</h3>
          <div class="chips">
            <button
              v-for="option in runtimeOptions"
              :key="option.value"
              type="button"
              class="chip"
              :class="{ selected: draft.runtime === option.value }"
              @click="draft.runtime = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="filter-actions">
          <button class="secondary" type="button" @click="filterOpen = false">{{ t('presets.cancel') }}</button>
          <button class="primary" type="button" data-test="presets-filter-confirm" @click="applyFilters">{{ t('presets.confirm') }}</button>
        </div>
      </section>
    </div>
    <div v-if="confirmItem" class="confirm-scrim" @click.self="closeConfirm">
      <section class="confirm-card" role="dialog" aria-modal="true" :aria-label="t('presets.confirmTitle')">
        <h2>{{ t('presets.confirmTitle') }}</h2>
        <p>{{ t('presets.confirmBody', { name: confirmItem.name }) }}</p>
        <p class="risk">{{ t('presets.riskNote') }}</p>
        <button class="primary" type="button" data-test="presets-use-confirm" :disabled="using" @click="usePreset">
          {{ using ? t('common.loading') : t('presets.determine') }}
        </button>
        <button class="secondary" type="button" :disabled="using" @click="closeConfirm">{{ t('presets.cancel') }}</button>
      </section>
    </div>
  </main>
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { showToast } from '@nutui/nutui';
  import { Heart, HeartFill, People } from '@nutui/icons-vue';
  import PageIcon from '@/components/PageIcon.vue';
  import { listPresets, togglePresetFavorite, type PresetItem, type PresetQuery } from '@/api/presets';
  import { useUserStore } from '@/store/modules/user';

  const { t } = useI18n();
  const router = useRouter();
  const user = useUserStore();
  const items = ref<PresetItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadingMore = ref(false);
  const error = ref(false);
  const page = ref(0);
  const hasMore = ref(false);
  const filterOpen = ref(false);
  const confirmItem = ref<PresetItem | null>(null);
  const using = ref(false);
  const colorMode = user.info.upDownColor || 'GREEN_UP';
  const filters = reactive<Required<Pick<PresetQuery, 'sort' | 'owner' | 'exchange' | 'runtime' | 'type'>>>({
    sort: 'comprehensive',
    owner: 'all',
    exchange: 'all',
    runtime: 'all',
    type: 'all',
  });
  const draft = reactive({ ...filters });
  const sortOptions = [
    { value: 'comprehensive' as const, label: 'presets.comprehensive' },
    { value: 'return' as const, label: 'presets.highestReturn' },
    { value: 'followers' as const, label: 'presets.followers' },
  ];
  const typeOptions = [
    { value: 'all' as const, label: 'presets.all' },
    { value: 'dca' as const, label: 'presets.dca' },
    { value: 'fng' as const, label: 'presets.fng' },
  ];
  const ownerOptions = [
    { value: 'all' as const, label: 'presets.all' },
    { value: 'official' as const, label: 'presets.official' },
    { value: 'user' as const, label: 'presets.user' },
  ];
  const exchangeOptions = [
    { value: 'all' as const, label: t('presets.all') },
    { value: 'binance' as const, label: 'Binance' },
    { value: 'okx' as const, label: 'OKX' },
  ];
  const runtimeOptions = [
    { value: 'all' as const, label: t('presets.all') },
    { value: '1-50' as const, label: '1d–50d' },
    { value: '51-100' as const, label: '51d–100d' },
    { value: '100+' as const, label: '100d+' },
  ];
  const coinFiles = import.meta.glob<string>('../../assets/coins/*.png', { eager: true, import: 'default' });
  const coinIcons = Object.fromEntries(Object.entries(coinFiles).map(([path, url]) => [path.split('/').pop()!.replace('.png', ''), url]));

  const initial = (name: string) => (name.trim().charAt(0) || '?').toUpperCase();
  const coinIcon = (symbol?: string) => (symbol ? coinIcons[symbol] : undefined);
  const number = (value: string | null) => (value == null ? null : Number(value));
  const ratio = (item: PresetItem) => {
    const value = number(item.totalRatio);
    if (value == null || !Number.isFinite(value)) return '—';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  const ratioClass = (item: PresetItem) => {
    const value = number(item.totalRatio);
    if (value == null || !Number.isFinite(value)) return '';
    const positive = value >= 0;
    return colorMode === 'RED_UP' ? (positive ? 'negative' : 'positive') : positive ? 'positive' : 'negative';
  };
  const exchangeName = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '—');
  const sparkline = (item: PresetItem) => {
    const values = item.sparkline.map(Number).filter(Number.isFinite);
    if (values.length < 2) return '';
    const low = Math.min(...values);
    const high = Math.max(...values);
    const range = high - low || 1;
    return values.map((value, index) => `${2 + (index * 116) / (values.length - 1)},${44 - ((value - low) * 38) / range}`).join(' ');
  };
  const sparklineArea = (item: PresetItem) => {
    const line = sparkline(item);
    return line ? `2,48 ${line} 118,48` : '';
  };

  async function load(reset = true) {
    if (reset) loading.value = true;
    else loadingMore.value = true;
    error.value = false;
    try {
      const nextPage = reset ? 0 : page.value + 1;
      const result = await listPresets({ ...filters, page: nextPage, size: 50 });
      items.value = reset ? result.items : [...items.value, ...result.items];
      page.value = result.page;
      hasMore.value = result.hasMore;
      total.value = result.total;
    } catch {
      error.value = true;
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  }

  async function loadMore() {
    if (loadingMore.value || !hasMore.value) return;
    await load(false);
  }

  function applyFilters() {
    Object.assign(filters, draft);
    filterOpen.value = false;
    void load();
  }

  function resetFilters() {
    Object.assign(draft, { sort: 'comprehensive', owner: 'all', exchange: 'all', runtime: 'all', type: 'all' });
  }

  function openUse(item: PresetItem) {
    confirmItem.value = item;
  }

  function closeConfirm() {
    if (!using.value) confirmItem.value = null;
  }

  async function favorite(item: PresetItem) {
    try {
      const result = await togglePresetFavorite(item.key);
      item.favorite = result.favorite;
      item.followers = result.followers;
    } catch {
      showToast.fail(t('presets.favoriteFailed'));
    }
  }

  async function usePreset() {
    const item = confirmItem.value;
    if (!item || using.value) return;
    if (item.type === 'DCA') {
      confirmItem.value = null;
      void router.push({ path: '/create', query: { presetKey: item.key } });
      return;
    }
    confirmItem.value = null;
    void router.push({ path: '/fng/create', query: { presetKey: item.key } });
    showToast.success(t('presets.fngRedirect'));
  }

  onMounted(load);
</script>
<style scoped lang="scss">
  .presets-page {
    padding: 1rem 0.5rem 1.5rem;
    font-family: inherit;
    font-size: 0.78rem;
    color: #29382f;
  }

  .toolbar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .filter-button {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    padding: 0.55rem 0.8rem;
    font: inherit;
    font-size: 0.78rem;
    color: #615a53;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 999px;
  }

  .filter-button svg {
    width: 1rem;
    height: 1rem;
  }

  .total {
    font-size: 0.72rem;
    color: #9a8d82;
  }

  .feedback {
    padding: 1.5rem 0.75rem;
    font-size: 0.85rem;
    color: #81776d;
    text-align: center;
    background: #fff;
    border-radius: 0.875rem;
  }

  .feedback.error {
    color: #b93d31;
  }

  .text-button {
    padding: 0.6rem 0.75rem;
    font: inherit;
    font-size: 0.78rem;
    color: #1989fa;
    background: transparent;
    border: 0;
  }

  .preset-card {
    position: relative;
    padding: 1rem;
    margin-bottom: 0.75rem;
    overflow: hidden;
    cursor: pointer;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .preset-card:focus-visible {
    outline: 2px solid #1989fa;
    outline-offset: 2px;
  }

  .card-top {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
  }

  .author {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.45rem;
    align-items: center;
    min-width: 0;
  }

  .author-avatar {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    overflow: hidden;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fb791a;
    background: #fff1e4;
    border-radius: 50%;
  }

  .author-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .author strong {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.8rem;
    font-weight: 650;
    white-space: nowrap;
  }

  .recommended-badge {
    padding: 0.1rem 0.35rem;
    font-size: 0.62rem;
    color: #7c4a12;
    background: #fff1e4;
    border-radius: 0.3rem;
  }

  .official-badge {
    flex-shrink: 0;
    padding: 0.1rem 0.35rem;
    font-size: 0.6rem;
    color: #c27500;
    background: #fff7e6;
    border-radius: 0.3rem;
  }

  .favorite-button {
    display: inline-flex;
    flex-shrink: 0;
    gap: 0.2rem;
    align-items: center;
    padding: 0.2rem;
    font: inherit;
    font-size: 0.65rem;
    color: #a99b8e;
    background: transparent;
    border: 0;
  }

  .favorite-icon {
    width: 1.1rem;
    height: 1.1rem;
  }

  .favorite-icon.active {
    color: #ef4444;
  }

  .preset-card h2 {
    padding-right: 7.5rem;
    margin: 0.7rem 0 0.3rem;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.35;
  }

  .followers {
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;
    font-size: 0.72rem;
    color: #81776d;
  }

  .followers svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .sparkline {
    position: absolute;
    top: 2.6rem;
    right: 1rem;
    width: 7.2rem;
    height: 3.2rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    padding-top: 0.75rem;
    margin: 0.9rem 0 0;
    border-top: 1px solid #f1e8e0;
  }

  .stats div {
    min-width: 0;
  }

  .stats dt {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .stats dd {
    margin: 0.2rem 0 0;
    font-size: 0.65rem;
    color: #9a8d82;
  }

  .stats .positive {
    color: #16a34a;
  }

  .stats .negative {
    color: #dc2626;
  }

  .stats .symbol {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .stats .symbol img {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
  }

  .load-more {
    width: 100%;
    min-height: 2.5rem;
    margin-top: 0.5rem;
    font: inherit;
    font-size: 0.8rem;
    color: #1989fa;
    background: #f5f1ee;
    border: 0;
    border-radius: 0.75rem;
  }

  .filter-scrim {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: flex-end;
    background: rgb(0 0 0 / 45%);
  }

  .filter-sheet {
    width: 100%;
    max-height: 85vh;
    padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
    overflow-y: auto;
    background: #fff;
    border-radius: 1rem 1rem 0 0;
  }

  .filter-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .filter-heading h2 {
    margin: 0;
    font-size: 1rem;
  }

  .filter-section {
    margin-top: 1rem;
  }

  .filter-section h3 {
    margin: 0 0 0.5rem;
    font-size: 0.78rem;
    font-weight: 650;
    color: #615a53;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .chip {
    padding: 0.55rem 0.8rem;
    font: inherit;
    font-size: 0.75rem;
    color: #615a53;
    background: #f5f1ee;
    border: 0;
    border-radius: 0.6rem;
  }

  .chip.selected {
    color: #fff;
    background: #1989fa;
  }

  .filter-actions {
    display: flex;
    gap: 0.6rem;
    margin-top: 1.25rem;
  }

  .filter-actions button {
    flex: 1;
    min-height: 2.9rem;
    font: inherit;
    font-size: 0.85rem;
    border: 0;
    border-radius: 0.75rem;
  }

  .primary {
    color: #fff;
    background: #1989fa;
  }

  .secondary {
    color: #615a53;
    background: #f5f1ee;
  }

  .confirm-scrim {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: rgb(0 0 0 / 45%);
  }

  .confirm-card {
    width: 100%;
    max-width: 24rem;
    padding: 1.25rem;
    background: #fff;
    border-radius: 1rem;
  }

  .confirm-card h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  .confirm-card p {
    margin: 0.75rem 0 0;
    font-size: 0.82rem;
    line-height: 1.6;
    color: #615a53;
  }

  .confirm-card .risk {
    color: #dc2626;
  }

  .confirm-card button {
    width: 100%;
    min-height: 2.9rem;
    margin-top: 0.75rem;
    font: inherit;
    font-size: 0.85rem;
    border: 0;
    border-radius: 0.75rem;
  }

  .confirm-card .secondary {
    color: #9a8d82;
    background: transparent;
  }

  :is(button, a, [role='button']):focus-visible {
    outline: 2px solid #1989fa;
    outline-offset: 2px;
  }
</style>
