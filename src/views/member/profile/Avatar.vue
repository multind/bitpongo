<template>
  <section :class="{ 'alert-card': editable, 'compact-avatar': !editable }">
    <h2 v-if="editable">{{ t('profile.avatar') }}</h2>
    <img v-if="ready || !user.token || error" :src="image || logo" :alt="t('profile.avatar')" class="user-avatar" @error="image = null" />
    <span v-else class="user-avatar avatar-loading" aria-hidden="true"></span>
    <template v-if="editable">
      <div class="avatar-actions">
        <button v-if="native" type="button" class="avatar-upload" :disabled="busy || !ready" @click="chooseNative">{{
          t('profile.uploadAvatar')
        }}</button>
        <button
          ref="presetTrigger"
          type="button"
          :disabled="busy || !ready"
          aria-haspopup="dialog"
          :aria-expanded="presetOpen"
          @click="presetOpen = true"
          >{{ t('profile.choosePresetAvatar') }}</button
        >
      </div>
      <NutPopup v-model:visible="presetOpen" position="bottom" round @opened="presetClose?.focus()" @closed="presetTrigger?.focus()">
        <section
          class="avatar-sheet"
          role="dialog"
          aria-modal="true"
          :aria-label="t('profile.choosePresetAvatar')"
          @keydown.tab="trapSheetTab"
          @keydown.esc="presetOpen = false"
        >
          <header
            ><h3>{{ t('profile.choosePresetAvatar') }}</h3
            ><button ref="presetClose" type="button" :disabled="busy" @click="presetOpen = false">{{ t('common.cancel') }}</button></header
          >
          <div class="avatar-presets">
            <button
              v-for="(url, name) in presets"
              :key="name"
              type="button"
              :disabled="busy || !ready"
              :aria-label="`${t('profile.choosePresetAvatar')} ${name}`"
              @click="choosePreset(url)"
              ><img :src="url" alt=""
            /></button>
          </div>
          <p v-if="error" role="alert">{{ t('common.saveFailed') }}</p>
        </section>
      </NutPopup>
      <p v-if="native" class="meta">{{ t('profile.avatarHint') }}</p>
      <button v-if="image" type="button" class="avatar-remove" data-remove :disabled="busy || !ready" @click="remove">{{
        t('profile.removeAvatar')
      }}</button>
      <button v-if="!ready && user.token && !busy" type="button" @click="load">{{ t('market.retry') }}</button>
      <p v-if="error" role="alert">{{ error === 'invalid' ? t('profile.avatarHint') : t('common.saveFailed') }}</p>
    </template>
  </section>
</template>
<script setup lang="ts">
  import { ref, watch, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useUserStore } from '@/store/modules/user';
  import { getAvatar, uploadAvatar, deleteAvatar } from '@/api/avatar';
  import logo from '@/assets/logo.png';
  import { hasNativeChannel, pickNativeAvatar } from '@/mobile/bridge';
  import { Popup as NutPopup } from '@nutui/nutui';
  import '@nutui/nutui/dist/packages/popup/index.css';
  import '@nutui/nutui/dist/packages/overlay/index.css';
  import { trapSheetTab } from '@/views/list/components/timezone-sheet';
  const native = hasNativeChannel();
  const presetOpen = ref(false);
  const presetTrigger = ref<HTMLButtonElement>();
  const presetClose = ref<HTMLButtonElement>();
  const presets = import.meta.glob<string>('../../../assets/avatars/*.png', { eager: true, import: 'default' });
  defineProps<{ editable?: boolean }>();
  const { t } = useI18n();
  const user = useUserStore();
  const image = ref<string | null>(null),
    busy = ref(false),
    ready = ref(false),
    error = ref('');
  let generation = 0;
  function current(id: number) {
    return id === generation && !!user.token;
  }
  async function load() {
    const id = ++generation;
    image.value = null;
    ready.value = false;
    error.value = '';
    busy.value = false;
    if (!user.token) return;
    busy.value = true;
    try {
      const result = await getAvatar();
      if (current(id)) {
        image.value = result.imageData;
        ready.value = true;
      }
    } catch {
      if (current(id)) error.value = 'failed';
    } finally {
      if (current(id)) busy.value = false;
    }
  }
  async function chooseNative() {
    if (busy.value || !ready.value || !user.token) return;
    const id = generation;
    busy.value = true;
    try {
      const data = await pickNativeAvatar();
      if (!data || !current(id)) return;
      const blob = await (await fetch(data)).blob();
      if (!current(id)) return;
      busy.value = false;
      await change(() => uploadAvatar(new File([blob], 'avatar.jpg', { type: blob.type })));
    } catch {
      if (current(id)) error.value = 'failed';
    } finally {
      if (current(id)) busy.value = false;
    }
  }
  async function choosePreset(url: string) {
    if (busy.value || !ready.value || !user.token) return;
    const id = generation;
    busy.value = true;
    try {
      const blob = await (await fetch(url)).blob();
      if (!current(id)) return;
      busy.value = false;
      if (await change(() => uploadAvatar(new File([blob], 'avatar.png', { type: 'image/png' })))) presetOpen.value = false;
    } catch {
      if (current(id)) error.value = 'failed';
    } finally {
      if (current(id)) busy.value = false;
    }
  }
  async function change(operation: () => ReturnType<typeof getAvatar>) {
    if (busy.value || !ready.value || !user.token) return;
    const id = generation;
    busy.value = true;
    error.value = '';
    try {
      const result = await operation();
      if (current(id)) {
        image.value = result.imageData;
        return true;
      }
    } catch {
      if (current(id)) error.value = 'failed';
    } finally {
      if (current(id)) busy.value = false;
    }
    return false;
  }
  const remove = () => change(deleteAvatar);
  watch(() => user.token, load, { immediate: true, flush: 'sync' });
  onUnmounted(() => {
    generation++;
  });
</script>
<style scoped lang="scss">
  @use '../../alerts/shared.scss';

  .avatar-sheet {
    padding: 1.25rem 1.25rem max(1.25rem, env(safe-area-inset-bottom));
    background: #fff;
  }

  .avatar-sheet header {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
  }

  .avatar-sheet h3 {
    margin: 0;
    font-size: 1rem;
  }

  .avatar-presets {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
    margin: 0.75rem 0;
  }

  .avatar-presets button {
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 50%;
  }

  .avatar-presets img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }

  .user-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .avatar-loading {
    display: block;
    background: #f1e8e0;
  }

  .alert-card .avatar-loading {
    width: 4rem;
    height: 4rem;
    margin: 0.875rem 0;
  }

  .compact-avatar {
    width: 100%;
    height: 100%;
  }

  .alert-card .user-avatar {
    display: block;
    width: 4rem;
    height: 4rem;
    margin: 0.875rem 0;
  }

  .alert-card {
    padding: 1.25rem;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  .avatar-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
    margin-top: 1rem;
  }

  .avatar-actions button {
    flex: 0 1 auto;
    max-width: 100%;
    min-height: 2.5rem;
    padding: 0.55rem 0.875rem;
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: #34443a;
    overflow-wrap: anywhere;
    background: #fff;
    border: 1px solid #e3e6e3;
    border-radius: 0.75rem;
  }

  .avatar-actions .avatar-upload {
    color: #1765cf;
    background: #eaf4ff;
    border-color: #d4e9ff;
  }

  .avatar-remove {
    display: inline-block;
    padding: 0.25rem 0;
    margin-top: 0.75rem;
    font: inherit;
    font-size: 0.8125rem;
    color: #c34e44;
    background: transparent;
    border: 0;
  }

  .alert-card .meta {
    margin: 0.75rem 0 0;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #666;
  }

  .avatar-upload input {
    display: block;
    max-width: 100%;
    min-height: 2.75rem;
    margin-top: 0.5rem;
    font-size: 0.8125rem;
  }
</style>
