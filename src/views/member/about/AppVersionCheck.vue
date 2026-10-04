<template>
  <section class="release-check">
    <button :disabled="busy || !native" @click="check">{{ t('release.check') }}</button>
    <p v-if="!native" class="meta">{{ t('release.appOnly') }}</p>
    <p v-if="error" role="alert">{{ t('release.failed') }}</p>
    <p v-if="release && !release.available" role="status">{{ t('release.unavailable') }}</p>
    <template v-if="release?.available">
      <p role="status">{{ t(release.updateAvailable ? 'release.update' : 'release.current', { version: release.latestVersion }) }}</p>
      <p v-if="release.releaseNotes" class="release-notes">{{ release.releaseNotes }}</p>
      <a v-if="release.updateAvailable && safeStoreUrl" :href="safeStoreUrl" target="_blank" rel="noopener noreferrer">{{
        t('release.store')
      }}</a>
    </template>
  </section>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getNativeContext, type NativeContext } from '@/mobile/bridge';
  import { getAppRelease, type AppRelease } from '@/api/content';
  const { t } = useI18n();
  const native = ref<NativeContext | null>(null),
    release = ref<AppRelease | null>(null),
    busy = ref(false),
    error = ref(false);
  let mounted = true;
  const safeStoreUrl = computed(() => {
    try {
      const url = new URL(release.value?.storeUrl || '');
      return url.protocol === 'https:' && !url.username && !url.password && ['apps.apple.com', 'play.google.com'].includes(url.hostname)
        ? url.href
        : '';
    } catch {
      return '';
    }
  });
  async function check() {
    if (busy.value || !native.value) return;
    busy.value = true;
    error.value = false;
    release.value = null;
    try {
      const parts = /^(\d+\.\d+\.\d+)(?:\+(\d+))?$/.exec(native.value.appVersion);
      if (!parts) throw new Error('Invalid native version');
      const result = await getAppRelease({
        platform: native.value.platform,
        version: parts[1],
        build: parts[2] ? Number(parts[2]) : undefined,
      });
      if (mounted) release.value = result;
    } catch {
      if (mounted) error.value = true;
    } finally {
      if (mounted) busy.value = false;
    }
  }
  onMounted(async () => {
    try {
      const context = await getNativeContext();
      if (mounted) native.value = context;
    } catch {
      if (mounted) error.value = true;
    }
  });
  onUnmounted(() => {
    mounted = false;
  });
</script>
<style scoped lang="scss">
  .release-check {
    padding: 1rem;
    margin: 1rem 0;
    background: #fff;
    border-radius: 0.75rem;
  }

  button {
    min-height: 2.75rem;
    padding: 0.5rem 1rem;
    font: inherit;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 1.5rem;
  }

  button:disabled {
    opacity: 0.6;
  }

  .meta {
    font-size: 0.875rem;
    color: #777;
  }

  .release-notes {
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  [role='alert'] {
    color: #dc2626;
  }
</style>
