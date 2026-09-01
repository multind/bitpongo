<template>
  <main class="privacy" data-test="privacy-policy">
    <header class="privacy__header">
      <p class="privacy__brand">BITPONGO</p>
      <h1>{{ content.title }}</h1>
      <p class="privacy__date">{{ content.updated }}</p>
    </header>

    <p class="privacy__intro">{{ content.intro }}</p>

    <section v-for="section in content.sections" :key="section.title">
      <h2>{{ section.title }}</h2>
      <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
      <ul v-if="section.items">
        <li v-for="item in section.items" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section>
      <h2>{{ content.contactTitle }}</h2>
      <p>
        {{ content.contactText }}
        <a data-test="privacy-contact" href="https://imastermind.io">{{ content.contactLabel }}</a>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { isSupportedLocale } from '@/i18n';
  import { privacyCopy } from './content';

  const { locale } = useI18n();
  const content = computed(() => privacyCopy[isSupportedLocale(locale.value) ? locale.value : 'en-us']);
</script>

<style scoped lang="scss">
  .privacy {
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

  .privacy__header {
    margin-bottom: 1.5rem;
  }

  .privacy__brand {
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

  .privacy__date {
    margin: 0.4rem 0 0;
    font-size: 0.8125rem;
    color: #777;
  }

  .privacy__intro {
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

  p + p,
  p + ul {
    margin-top: 0.625rem;
  }

  ul {
    padding-left: 1.25rem;
    margin-bottom: 0;
  }

  li + li {
    margin-top: 0.35rem;
  }

  a {
    color: #8a2d10;
    overflow-wrap: anywhere;
  }
</style>
