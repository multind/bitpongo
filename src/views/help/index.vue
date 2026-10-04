<template>
  <main class="alerts-page">
    <section class="alert-card">
      <h1>{{ t(kind === 'HELP' ? 'content.help' : 'content.articles') }}</h1>
      <div class="actions"
        ><RouterLink class="pill" to="/help">{{ t('content.help') }}</RouterLink
        ><RouterLink class="pill" to="/articles">{{ t('content.articles') }}</RouterLink></div
      >
      <form class="filters" @submit.prevent="search"
        ><input v-model="query" maxlength="100" :aria-label="t('content.search')" /><button :disabled="busy || !active">{{
          t('content.search')
        }}</button></form
      >
      <p v-if="error" role="alert">{{ t('content.loadFailed') }}</p>
      <button v-if="error && !hasMore" :disabled="busy" @click="load(0)">{{ t('market.retry') }}</button>
      <p v-if="busy" role="status">{{ t('common.loading') }}</p>
      <p v-if="!busy && !error && !items.length">{{ t('content.empty') }}</p>
      <article v-for="item in items" :key="item.slug" class="content-result"
        ><RouterLink data-test="article-link" :to="`/articles/${item.slug}`"
          ><h2>{{ item.title }}</h2></RouterLink
        ><p>{{ item.summary }}</p></article
      >
      <button v-if="hasMore" data-test="more" :disabled="busy || !active" @click="load(page + 1)">{{ t('content.more') }}</button>
    </section>
    <section v-if="kind === 'HELP'" class="alert-card">
      <h2>{{ t('content.history') }}</h2
      ><p v-if="historyError" role="alert">{{ t('content.historyFailed') }}</p>
      <div v-for="entry in history" :key="entry.id" class="actions"
        ><button :disabled="busy || !active" @click="searchFor(entry.query)">{{ entry.query }}</button
        ><button :disabled="historyBusy || !active" :aria-label="t('content.remove')" @click="remove(entry.id)">{{
          t('content.remove')
        }}</button></div
      >
      <button v-if="history.length" :disabled="historyBusy || !active" @click="remove()">{{ t('content.clear') }}</button>
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

  .content-result {
    padding: 0.75rem 0;
    overflow-wrap: anywhere;
    border-bottom: 1px solid #eee;
  }

  h2 {
    font-size: 1.125rem;
  }
</style>
