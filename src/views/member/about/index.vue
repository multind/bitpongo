<template>
  <main class="about-page">
    <header class="about-brand">
      <img src="../../../assets/logo.png" width="80" height="80" alt="" />
      <h1>Bitpongo</h1>
      <p>{{ t('about.version', { version: appVersion }) }}</p>
      <p>{{ t('about.publishTime', { time: buildTime }) }}</p>
    </header>
    <nav class="about-links" :aria-label="t('member.about')">
      <a data-test="about-privacy" href="/privacy"
        ><span>{{ t('privacy.title') }}</span
        ><span aria-hidden="true">›</span></a
      >
      <a data-test="about-terms" href="/agreement"
        ><span>{{ t('member.agreement') }}</span
        ><span aria-hidden="true">›</span></a
      >
      <a data-test="about-source" href="https://github.com/multind/bitpongo" target="_blank" rel="noopener noreferrer">
        <span>{{ t('about.openSource') }}<small>MIT License · github.com/multind/bitpongo</small></span
        ><span aria-hidden="true">›</span>
      </a>
    </nav>
    <AppVersionCheck />
    <footer>
      <p>Designed with ❤ by iMastermind.io</p>
      <a href="https://iMastermind.io" target="_blank" rel="noopener noreferrer">https://iMastermind.io</a>
      <p>Copyright © 2026 Bitpongo.</p>
    </footer>
  </main>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import AppVersionCheck from './AppVersionCheck.vue';

  const { t } = useI18n();
  const appVersion = __APP_VERSION__;
  const buildTime = new Date(__BUILD_TIME__).toLocaleString();
</script>

<style scoped lang="scss">
  .about-page {
    padding: 1rem 0.75rem;
    color: #333;
  }

  h1 {
    margin: 1rem 0 0.25rem;
    font-size: 1.5rem;
  }

  .about-brand {
    padding: 1rem 0 1.75rem;
    text-align: center;
  }

  .about-brand img {
    border-radius: 1.125rem;
  }

  .about-brand p {
    margin: 0.5rem 0;
    font-size: 0.875rem;
    color: #777;
    overflow-wrap: anywhere;
  }

  .about-links {
    padding: 0 1rem;
    background: #fff;
    border-radius: 0.875rem;
  }

  .about-links a {
    box-sizing: border-box;
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    min-height: 3.5rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .about-links a:last-child {
    border-bottom: 0;
  }

  small {
    display: block;
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: #777;
    overflow-wrap: anywhere;
  }

  footer {
    margin-top: 2rem;
    font-size: 0.75rem;
    line-height: 1.6;
    color: #777;
    text-align: center;
  }

  footer p {
    margin: 0.5rem 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
</style>
