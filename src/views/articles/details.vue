<template>
  <main class="alerts-page"
    ><article class="alert-card">
      <p v-if="loading" role="status">{{ t('common.loading') }}</p>
      <template v-if="article"
        ><h1>{{ article.title }}</h1
        ><p class="meta">{{ formatInstant(article.publishedAt) }}</p
        ><p class="article-body">{{ article.body }}</p></template
      >
      <p v-if="error" role="alert">{{ t('content.loadFailed') }}</p
      ><button v-if="error" :disabled="loading" @click="load">{{ t('market.retry') }}</button>
    </article></main
  >
</template>
<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { getArticle, type Article } from '@/api/content';
  import { formatInstant } from '@/utils/timeUtils';
  const route = useRoute(),
    { t, locale } = useI18n();
  const article = ref<Article | null>(null),
    loading = ref(false),
    error = ref(false);
  let mounted = true,
    generation = 0;
  async function load() {
    const current = ++generation;
    article.value = null;
    loading.value = true;
    error.value = false;
    try {
      const row = await getArticle(String(route.params.slug), locale.value);
      if (mounted && current === generation) article.value = row;
    } catch {
      if (mounted && current === generation) error.value = true;
    } finally {
      if (mounted && current === generation) loading.value = false;
    }
  }
  watch(() => [route.params.slug, locale.value], load);
  onMounted(load);
  onUnmounted(() => {
    mounted = false;
    ++generation;
  });
</script>
<style scoped lang="scss">
  @use '../alerts/shared.scss';

  .article-body {
    line-height: 1.7;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
</style>
