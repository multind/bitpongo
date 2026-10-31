<template>
  <main class="alerts-page article-page"
    ><article class="alert-card article-document">
      <p v-if="loading" role="status">{{ t('common.loading') }}</p>
      <template v-if="article"
        ><header class="article-heading"
          ><h1>{{ article.title }}</h1
          ><p v-if="article.summary" class="article-summary">{{ article.summary }}</p
          ><time class="meta" :datetime="article.publishedAt">{{ formatInstant(article.publishedAt) }}</time></header
        >
        <p class="article-body">{{ article.body }}</p></template
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

  .article-page {
    padding: 1rem 0.75rem;
  }

  .article-document {
    padding: 1.25rem;
  }

  .article-heading {
    padding-bottom: 1rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid #eee;
  }

  h1 {
    margin: 0 0 0.875rem;
    font-size: 1.5rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .article-summary {
    margin: 0 0 0.75rem;
    font-size: 0.9375rem;
    line-height: 1.65;
    color: #666;
    overflow-wrap: anywhere;
  }

  .article-body {
    margin: 0;
    font-size: 1rem;
    line-height: 1.7;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
</style>
