<template>
  <nut-row type="flex" justify="space-evenly" style="margin-top: 30px; margin-bottom: 10px">
    <nut-col align="center" span="6">
      <img style="border-radius: 15px" src="../../../assets/logo.png" height="80" width="80" alt="" />
    </nut-col>
  </nut-row>

  <nut-row type="flex" justify="space-evenly">
    <nut-col align="center" span="12">
      <text>Bitpongo</text>
    </nut-col>
  </nut-row>

  <nut-row type="flex" justify="space-evenly" style="margin-top: 10px">
    <nut-col align="center" span="12">
      <text style="font-size: 14px; color: #2f2f2f">{{ t('about.version', { version: appVersion }) }}</text>
    </nut-col>
  </nut-row>

  <nut-row type="flex" justify="space-evenly" style="margin-top: 10px; margin-bottom: 30px">
    <nut-col align="center" span="16">
      <text style="font-size: 14px; color: #2f2f2f">{{ t('about.publishTime', { time: buildTime }) }}</text>
    </nut-col>
  </nut-row>

  <nut-cell-group>
    <nut-cell :title="t('about.developer')" sub-title="Designed with ❤ by iMastermind.io"></nut-cell>
    <nut-cell :title="t('about.contact')" sub-title="https://iMastermind.io"></nut-cell>
    <a class="about-source" data-test="about-privacy" href="/privacy">
      <nut-cell :title="t('privacy.title')" is-link></nut-cell>
    </a>
    <a class="about-source" data-test="about-source" href="https://github.com/multind/bitpongo">
      <nut-cell :title="t('about.openSource')" sub-title="MIT License · github.com/multind/bitpongo" is-link></nut-cell>
    </a>
    <nut-cell :title="t('about.copyright')" sub-title="Copyright © 2026 Bitpongo."></nut-cell>
  </nut-cell-group>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  const appVersion = __APP_VERSION__;
  const buildTime = new Date(__BUILD_TIME__).toLocaleString();
</script>

<style scoped lang="scss">
  .about-source {
    color: inherit;
    text-decoration: none;
  }
</style>
