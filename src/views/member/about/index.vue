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
      <text style="font-size: 14px; color: #555">{{ t('about.version', { version: appVersion }) }}</text>
    </nut-col>
  </nut-row>

  <nut-row type="flex" justify="space-evenly" style="margin-top: 10px; margin-bottom: 30px">
    <nut-col align="center" span="16">
      <text style="font-size: 14px; color: #555">{{ t('about.publishTime', { time: buildTime }) }}</text>
    </nut-col>
  </nut-row>

  <nut-cell-group>
    <nut-cell :title="t('about.developer')" sub-title="Designed with ❤ by Multind.com"></nut-cell>
    <nut-cell :title="t('about.contact')" sub-title="https://multind.com"></nut-cell>
    <nut-cell :title="t('about.copyright')" sub-title="Copyright © 2026 Bitpongo. All rights reserved."></nut-cell>
  </nut-cell-group>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  const appVersion = __APP_VERSION__;
  const buildTime = new Date(__BUILD_TIME__).toLocaleString();
</script>

<style scoped lang="scss"></style>
