<template>
  <main class="alerts-page">
    <form class="alert-card" @submit.prevent="save">
      <h1>{{ t('profile.title') }}</h1>
      <label for="profile-name">{{ t('profile.name') }}</label>
      <input id="profile-name" v-model="form.name" maxlength="50" required :disabled="busy || !canEdit" autocomplete="nickname" />
      <label for="profile-country">{{ t('profile.country') }}</label>
      <input id="profile-country" v-model="form.country" maxlength="2" :disabled="busy || !canEdit" />
      <p class="meta">{{ t('profile.countryHint') }}</p>
      <label for="profile-introduction">{{ t('profile.introduction') }}</label>
      <textarea id="profile-introduction" v-model="form.introduction" maxlength="500" rows="4" :disabled="busy || !canEdit" />
      <label for="profile-color">{{ t('profile.color') }}</label>
      <select id="profile-color" v-model="form.upDownColor" :disabled="busy || !canEdit">
        <option value="GREEN_UP">{{ t('profile.greenUp') }}</option>
        <option value="RED_UP">{{ t('profile.redUp') }}</option>
      </select>
      <p v-if="error" role="alert">{{ t('common.saveFailed') }}</p>
      <p v-if="saved" role="status">{{ t('common.saveSuccess') }}</p>
      <div class="actions">
        <button type="submit" :disabled="busy || !canEdit || !form.name.trim()">{{ busy ? t('common.loading') : t('common.save') }}</button>
        <button v-if="!canEdit && !busy" type="button" @click="load">{{ t('market.retry') }}</button>
      </div>
    </form>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getUserProfile, saveUserProfile, type UserProfile } from '@/api/profile';
  import { useUserStore } from '@/store/modules/user';
  const { t } = useI18n();
  const user = useUserStore();
  const form = ref<UserProfile>({ name: '', country: '', introduction: '', upDownColor: 'GREEN_UP' });
  const busy = ref(false),
    loaded = ref(false),
    error = ref(false),
    saved = ref(false);
  const loadedToken = ref('');
  const canEdit = computed(() => loaded.value && !!user.token && loadedToken.value === user.token);
  let mounted = true;
  async function load() {
    if (busy.value) return;
    busy.value = true;
    error.value = false;
    const token = user.token;
    try {
      const profile = await getUserProfile();
      if (!mounted || token !== user.token) return;
      form.value = profile;
      loaded.value = true;
      loadedToken.value = token;
      user.setInfo({ ...user.info, name: profile.name, upDownColor: profile.upDownColor });
    } catch {
      if (mounted) error.value = true;
    } finally {
      if (mounted) busy.value = false;
    }
  }
  async function save() {
    if (busy.value || !canEdit.value || !form.value.name.trim()) return;
    busy.value = true;
    error.value = false;
    saved.value = false;
    const token = user.token;
    try {
      const profile = await saveUserProfile({ ...form.value });
      if (!mounted || token !== user.token) return;
      form.value = profile;
      user.setInfo({ ...user.info, name: profile.name, upDownColor: profile.upDownColor });
      saved.value = true;
    } catch {
      if (mounted) error.value = true;
    } finally {
      if (mounted) busy.value = false;
    }
  }
  onMounted(load);
  onUnmounted(() => {
    mounted = false;
  });
</script>
<style scoped lang="scss">
  @use '../../alerts/shared.scss';
</style>
