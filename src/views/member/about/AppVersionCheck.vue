<template>
  <section class="release-check">
    <button v-if="native?.supportsStoreUpdate" :disabled="busy" @click="check">{{ t('release.check') }}</button>
    <p v-if="status" role="status">{{ t(messages[status]) }}</p>
    <div v-if="loaded && (!native?.supportsStoreUpdate || (status && status !== 'upToDate'))" class="store-links">
      <a
        v-if="native?.platform !== 'android'"
        href="https://apps.apple.com/app/id6473227759"
        :target="native ? undefined : '_blank'"
        rel="noopener noreferrer"
      >
        App Store
      </a>
      <a
        v-if="native?.platform !== 'ios'"
        href="https://play.google.com/store/apps/details?id=io.imastermind.bitpongo"
        :target="native ? undefined : '_blank'"
        rel="noopener noreferrer"
      >
        Google Play
      </a>
    </div>
  </section>
</template>
<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { checkNativeStoreUpdate, getNativeContext, type NativeContext, type StoreUpdateStatus } from '@/mobile/bridge';
  const { t } = useI18n();
  const native = ref<NativeContext | null>(null),
    status = ref<StoreUpdateStatus | null>(null),
    busy = ref(false),
    loaded = ref(false);
  const messages = { updateAvailable: 'release.update', upToDate: 'release.current', unavailable: 'release.failed' } as const;
  let mounted = true;
  async function check() {
    if (busy.value || !native.value?.supportsStoreUpdate) return;
    busy.value = true;
    status.value = null;
    try {
      const result = await checkNativeStoreUpdate();
      if (mounted) status.value = result;
    } catch {
      if (mounted) status.value = 'unavailable';
    } finally {
      if (mounted) busy.value = false;
    }
  }
  onMounted(async () => {
    try {
      const context = await getNativeContext();
      if (mounted) native.value = context;
    } catch {
      // The store links are still usable without a working bridge.
    } finally {
      if (mounted) loaded.value = true;
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
    width: 100%;
    min-height: 2.75rem;
    padding: 0.5rem 1rem;
    font: inherit;
    text-align: left;
    background: #fff;
    border: 0;
    border-radius: 0.625rem;
  }

  button:disabled {
    opacity: 0.6;
  }

  .store-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
</style>
