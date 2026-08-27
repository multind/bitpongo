<template>
  <main class="terms">
    <header class="terms__header">
      <p class="terms__brand">BITPONGO</p>
      <h1>{{ content.title }}</h1>
      <p class="terms__date">{{ content.updated }}</p>
    </header>

    <p class="terms__intro">{{ content.intro }}</p>

    <section v-for="section in content.sections" :key="section.title">
      <h2>{{ section.title }}</h2>
      <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { isSupportedLocale } from '@/i18n';
  import { agreementCopy } from './agreement-content';

  const { locale } = useI18n();
  const content = computed(() => agreementCopy[isSupportedLocale(locale.value) ? locale.value : 'en-us']);
</script>

<style scoped lang="scss">
  .terms {
    box-sizing: border-box;
    width: 100%;
    max-width: 48rem;
    min-height: 100%;
    padding: 1.5rem 1rem 2.5rem;
    margin: 0 auto;
    font-size: 0.9375rem;
    line-height: 1.65;
    color: #202124;
  }

  .terms__header {
    margin-bottom: 1.5rem;
  }

  .terms__brand {
    margin: 0 0 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #777;
    letter-spacing: 0.12em;
  }

  h1 {
    margin: 0;
    font-size: 1.75rem;
    line-height: 1.25;
    color: #111;
  }

  .terms__date {
    margin: 0.4rem 0 0;
    font-size: 0.8125rem;
    color: #777;
  }

  .terms__intro {
    margin: 0 0 1.75rem;
    color: #444;
  }

  section + section {
    margin-top: 1.5rem;
  }

  h2 {
    margin: 0 0 0.4rem;
    font-size: 1.0625rem;
    line-height: 1.4;
    color: #111;
  }

  p {
    margin: 0;
  }
</style>
