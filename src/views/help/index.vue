<template>
  <main class="alerts-page help-page">
    <header class="help-heading page-heading"
      ><span class="help-icon"><PageIcon name="search" /></span
      ><h1>{{ t(kind === 'HELP' ? 'content.help' : 'content.articles') }}</h1></header
    >
    <nav class="content-tabs" :aria-label="t('content.help')"
      ><RouterLink :aria-current="kind === 'HELP' ? 'page' : undefined" to="/help">{{ t('content.help') }}</RouterLink
      ><RouterLink :aria-current="kind === 'ARTICLE' ? 'page' : undefined" to="/articles">{{ t('content.articles') }}</RouterLink></nav
    >
    <form class="content-search" role="search" @submit.prevent="search"
      ><input v-model="query" type="search" maxlength="100" :placeholder="t('content.search')" :aria-label="t('content.search')" /><button
        :disabled="busy || !active"
        >{{ t('content.search') }}</button
      ></form
    >
    <section class="results" :aria-label="t(kind === 'HELP' ? 'content.help' : 'content.articles')" :aria-busy="busy">
      <p v-if="error" role="alert">{{ t('content.loadFailed') }}</p>
      <button v-if="error && !hasMore" :disabled="busy" @click="load(0)">{{ t('market.retry') }}</button>
      <p v-if="busy" role="status">{{ t('common.loading') }}</p>
      <p v-if="!busy && !error && !items.length">{{ t('content.empty') }}</p>
      <article v-for="item in items" :key="item.slug" class="content-result"
        ><RouterLink data-test="article-link" :to="`/articles/${item.slug}`"
          ><div class="result-copy"
            ><h2>{{ item.title }}</h2
            ><p>{{ item.summary }}</p
            ><time class="meta" :datetime="item.publishedAt">{{ formatInstant(item.publishedAt) }}</time></div
          ><PageIcon name="chevron" /></RouterLink
      ></article>
      <button v-if="hasMore" data-test="more" :disabled="busy || !active" @click="load(page + 1)">{{ t('content.more') }}</button>
    </section>
    <section v-if="kind === 'HELP' && (history.length || historyError)" class="alert-card search-history">
      <header class="history-heading"
        ><h2>{{ t('content.history') }}</h2
        ><button v-if="history.length" :disabled="historyBusy || !active" @click="remove()">{{ t('content.clear') }}</button></header
      >
      <p v-if="historyError" role="alert">{{ t('content.historyFailed') }}</p>
      <div class="history-list"
        ><div v-for="entry in history" :key="entry.id" class="history-entry"
          ><button :disabled="busy || !active" @click="searchFor(entry.query)">{{ entry.query }}</button
          ><button :disabled="historyBusy || !active" :aria-label="`${t('content.remove')}: ${entry.query}`" @click="remove(entry.id)"
            ><PageIcon name="close" /></button
        ></div>
      </div>
    </section>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import {
    listArticles,
    getSearchHistory,
    saveSearchHistory,
    deleteSearchHistory,
    clearSearchHistory,
    type ArticleSummary,
    type SearchEntry,
  } from '@/api/content';
  import { useUserStore } from '@/store/modules/user';
  import PageIcon from '@/components/PageIcon.vue';
  import { formatInstant } from '@/utils/timeUtils';
  const props = withDefaults(defineProps<{ kind?: 'HELP' | 'ARTICLE' }>(), { kind: 'HELP' });
  const { t, locale } = useI18n();
  const user = useUserStore();
  const token = user.token;
  const active = computed(() => !!token && token === user.token);
  const query = ref(''),
    searched = ref(''),
    items = ref<ArticleSummary[]>([]),
    history = ref<SearchEntry[]>([]);
  const busy = ref(false),
    error = ref(false),
    historyBusy = ref(false),
    historyError = ref(false),
    hasMore = ref(false),
    page = ref(0);
  let mounted = true,
    generation = 0;
  async function load(next = 0) {
    if (!active.value) return;
    const current = ++generation;
    busy.value = true;
    error.value = false;
    if (next === 0) {
      items.value = [];
      hasMore.value = false;
    }
    try {
      const result = await listArticles({ kind: props.kind, locale: locale.value, q: searched.value, page: next });
      if (!mounted || !active.value || current !== generation) return;
      items.value = next === 0 ? result.items : [...items.value, ...result.items];
      hasMore.value = result.hasMore;
      page.value = next;
    } catch {
      if (mounted && active.value && current === generation) error.value = true;
    } finally {
      if (mounted && current === generation) busy.value = false;
    }
  }
  async function loadHistory() {
    try {
      const rows = await getSearchHistory();
      if (mounted && active.value) history.value = rows;
    } catch {
      if (mounted && active.value) historyError.value = true;
    }
  }
  async function search() {
    if (busy.value || !active.value) return;
    searched.value = query.value.trim();
    void load(0);
    if (props.kind === 'HELP' && searched.value) {
      try {
        await saveSearchHistory(searched.value);
        if (active.value) await loadHistory();
      } catch {
        if (mounted && active.value) historyError.value = true;
      }
    }
  }
  function searchFor(value: string) {
    query.value = value;
    void search();
  }
  async function remove(id?: number) {
    if (historyBusy.value || !active.value) return;
    historyBusy.value = true;
    historyError.value = false;
    try {
      if (id === undefined) await clearSearchHistory();
      else await deleteSearchHistory(id);
      if (mounted && active.value) await loadHistory();
    } catch {
      if (mounted && active.value) historyError.value = true;
    } finally {
      if (mounted) historyBusy.value = false;
    }
  }
  watch(
    () => [locale.value, props.kind],
    () => {
      void load(0);
      if (props.kind === 'HELP' && active.value) void loadHistory();
    },
  );
  watch(
    () => user.token,
    () => {
      ++generation;
      history.value = [];
      items.value = [];
      hasMore.value = false;
      busy.value = false;
    },
  );
  onMounted(() => {
    void load(0);
    if (props.kind === 'HELP') void loadHistory();
  });
  onUnmounted(() => {
    mounted = false;
    ++generation;
  });
</script>
<style scoped lang="scss">
  @use '../alerts/shared.scss';

  .help-page {
    padding: 1rem 0.75rem;
  }

  .help-heading {
    display: flex;
    gap: 0.875rem;
    align-items: center;
    padding: 0.75rem 0.25rem 1.25rem;
  }

  .help-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    color: #1765cf;
    background: #eaf2ff;
    border-radius: 1rem;
  }

  h1 {
    margin: 0;
    font-size: 1.375rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .content-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    margin-bottom: 1rem;
  }

  .content-tabs a {
    padding: 0.75rem 0.25rem;
    font-size: 0.875rem;
    color: #666;
    text-decoration: none;
    border-bottom: 2px solid transparent;
  }

  .content-tabs a[aria-current] {
    font-weight: 600;
    color: #1765cf;
    border-color: #1765cf;
  }

  .content-search {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .content-search input {
    flex: 1;
    min-width: 0;
    background: #fff;
    border-radius: 1.5rem;
  }

  .content-search button {
    flex-shrink: 0;
    min-height: 2.75rem;
    color: #1765cf;
  }

  .results {
    margin-bottom: 1.5rem;
  }

  .content-result {
    padding: 0 0.75rem;
    background: #fff;
    border-bottom: 1px solid #eee;
  }

  .content-result:first-of-type {
    border-radius: 0.75rem 0.75rem 0 0;
  }

  .content-result:last-of-type {
    border-radius: 0 0 0.75rem 0.75rem;
  }

  .content-result a {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 1rem 0;
    color: #333;
    text-decoration: none;
  }

  .content-result svg {
    width: 1.125rem;
    color: #888;
  }

  .result-copy {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .result-copy h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5;
  }

  .result-copy p {
    margin: 0.375rem 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: #666;
  }

  .history-heading {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .history-heading h2 {
    margin: 0;
    font-size: 1rem;
  }

  .history-heading button {
    min-height: 2.75rem;
    padding: 0.5rem 0;
    font-size: 0.8125rem;
    color: #1765cf;
    border: 0;
  }

  .history-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
  }

  .history-entry {
    display: flex;
    align-items: stretch;
    max-width: 100%;
    overflow: hidden;
    border: 1px solid #eee;
    border-radius: 1.5rem;
  }

  .history-entry button {
    min-height: 2.75rem;
    border: 0;
    border-radius: 0;
  }

  .history-entry button:first-child {
    min-width: 0;
    text-align: left;
    overflow-wrap: anywhere;
  }

  .history-entry button:last-child {
    flex-shrink: 0;
    padding: 0.5rem;
  }

  .history-entry svg {
    width: 1rem;
    height: 1rem;
  }
</style>
