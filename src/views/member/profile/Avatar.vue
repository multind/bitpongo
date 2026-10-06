<template>
  <section :class="{ 'alert-card': editable, 'compact-avatar': !editable }">
    <h2 v-if="editable">{{ t('profile.avatar') }}</h2>
    <img :src="image || logo" :alt="t('profile.avatar')" class="user-avatar" @error="image = null" />
    <template v-if="editable">
      <label class="avatar-upload">
        {{ t('profile.uploadAvatar') }}
        <input type="file" accept="image/png,image/jpeg" :disabled="busy || !ready" @change="upload" />
      </label>
      <p class="meta">{{ t('profile.avatarHint') }}</p>
      <button v-if="image" type="button" data-remove :disabled="busy || !ready" @click="remove">{{ t('profile.removeAvatar') }}</button>
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
  async function upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || busy.value || !ready.value || !user.token) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      error.value = 'invalid';
      return;
    }
    await change(() => uploadAvatar(file));
  }
  async function change(operation: () => ReturnType<typeof getAvatar>) {
    if (busy.value || !ready.value || !user.token) return;
    const id = generation;
    busy.value = true;
    error.value = '';
    try {
      const result = await operation();
      if (current(id)) image.value = result.imageData;
    } catch {
      if (current(id)) error.value = 'failed';
    } finally {
      if (current(id)) busy.value = false;
    }
  }
  const remove = () => change(deleteAvatar);
  watch(() => user.token, load, { immediate: true, flush: 'sync' });
  onUnmounted(() => {
    generation++;
  });
</script>
<style scoped lang="scss">
  @use '../../alerts/shared.scss';

  .user-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .compact-avatar {
    width: 100%;
    height: 100%;
  }

  .alert-card .user-avatar {
    display: block;
    width: 1.2rem;
    height: 1.2rem;
    margin-bottom: 0.2rem;
  }

  .avatar-upload {
    display: block;
  }

  .avatar-upload input {
    display: block;
    max-width: 100%;
  }
</style>
