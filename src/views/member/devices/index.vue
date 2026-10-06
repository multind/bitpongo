<template>
  <main class="alerts-page">
    <section class="alert-card">
      <h1>{{ t('sessions.title') }}</h1>
      <p class="meta">{{ t('sessions.hint') }}</p>
      <button type="button" :disabled="busy" @click="load">{{ t('sessions.refresh') }}</button>
      <p v-if="busy" role="status">{{ t('common.loading') }}</p>
      <p v-if="error" role="alert">{{ t('sessions.failed') }}</p>
      <p v-if="loaded && !items.length">{{ t('sessions.empty') }}</p>
    </section>
    <section v-for="item in items" :key="item.id" class="alert-card">
      <h2>{{ item.current ? t('sessions.current') : t('sessions.other') }}</h2>
      <p class="meta">{{ t('sessions.firstSeen') }}: {{ formatInstant(item.createdAt) }}</p>
      <p class="meta">{{ t('sessions.lastSeen') }}: {{ formatInstant(item.lastSeenAt) }}</p>
      <p class="meta">{{ t('sessions.expires') }}: {{ formatInstant(item.expiresAt) }}</p>
      <button type="button" data-revoke :disabled="busy" @click="selected = item">{{ t('sessions.revoke') }}</button>
      <div v-if="selected?.id === item.id" role="group" :aria-label="t('sessions.confirm')">
        <p>{{ item.current ? t('sessions.currentWarning') : t('sessions.confirm') }}</p>
        <button type="button" data-confirm :disabled="busy" @click="revoke">{{ t('sessions.revoke') }}</button>
        <button type="button" :disabled="busy" @click="selected = null">{{ t('common.cancel') }}</button>
      </div>
    </section>
  </main>
</template>
<script setup lang="ts">
  import { ref, watch, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/store/modules/user';
  import { getSessions, revokeSession, type LoginSession } from '@/api/sessions';
  import { formatInstant } from '@/utils/timeUtils';
  const { t } = useI18n(),
    router = useRouter(),
    user = useUserStore();
  const items = ref<LoginSession[]>([]),
    selected = ref<LoginSession | null>(null);
  const busy = ref(false),
    error = ref(false),
    loaded = ref(false);
  let generation = 0;
  async function load() {
    const id = ++generation;
    items.value = [];
    selected.value = null;
    loaded.value = false;
    error.value = false;
    busy.value = false;
    if (!user.token) return;
    busy.value = true;
    try {
      const result = await getSessions();
      if (id === generation) {
        items.value = result.items;
        loaded.value = true;
      }
    } catch {
      if (id === generation) error.value = true;
    } finally {
      if (id === generation) busy.value = false;
    }
  }
  async function revoke() {
    if (busy.value || !selected.value || !user.token) return;
    const id = generation,
      target = selected.value;
    busy.value = true;
    error.value = false;
    try {
      await revokeSession(target.id);
      if (id !== generation) return;
      items.value = items.value.filter((item) => item.id !== target.id);
      selected.value = null;
      if (target.current) {
        user.logout();
        await router.replace('/login');
      }
    } catch {
      if (id === generation) error.value = true;
    } finally {
      if (id === generation) busy.value = false;
    }
  }
  watch(() => user.token, load, { immediate: true, flush: 'sync' });
  onUnmounted(() => {
    generation++;
  });
</script>
<style scoped lang="scss">
  @use '../../alerts/shared.scss';
</style>
