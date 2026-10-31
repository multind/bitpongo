<template>
  <main class="alerts-page sessions-page">
    <header class="sessions-heading">
      <h1>{{ t('sessions.title') }}</h1>
      <button type="button" :disabled="busy" @click="load"
        ><PageIcon name="refresh" /><span>{{ t('sessions.refresh') }}</span></button
      >
    </header>
    <p class="session-hint">{{ t('sessions.hint') }}</p>
    <p v-if="busy" role="status">{{ t('common.loading') }}</p>
    <p v-if="error" role="alert">{{ t('sessions.failed') }}</p>
    <p v-if="loaded && !items.length">{{ t('sessions.empty') }}</p>
    <ul v-if="items.length" class="session-list" :aria-label="t('sessions.title')">
      <li v-for="item in items" :key="item.id" class="session-entry" :class="{ current: item.current }">
        <span class="session-icon"><PageIcon name="link" /></span>
        <div class="session-content"
          ><h2>{{ item.current ? t('sessions.current') : t('sessions.other') }}</h2>
          <dl class="session-dates">
            <div
              ><dt>{{ t('sessions.firstSeen') }}</dt
              ><dd
                ><time :datetime="item.createdAt">{{ formatInstant(item.createdAt) }}</time></dd
              ></div
            >
            <div
              ><dt>{{ t('sessions.lastSeen') }}</dt
              ><dd
                ><time :datetime="item.lastSeenAt">{{ formatInstant(item.lastSeenAt) }}</time></dd
              ></div
            >
            <div
              ><dt>{{ t('sessions.expires') }}</dt
              ><dd
                ><time :datetime="item.expiresAt">{{ formatInstant(item.expiresAt) }}</time></dd
              ></div
            >
          </dl>
          <button class="revoke-button" type="button" data-revoke :disabled="busy" @click="selected = item">{{
            t('sessions.revoke')
          }}</button>
          <div v-if="selected?.id === item.id" class="revoke-confirm" role="group" :aria-label="t('sessions.confirm')">
            <p>{{ item.current ? t('sessions.currentWarning') : t('sessions.confirm') }}</p>
            <button type="button" data-confirm :disabled="busy" @click="revoke">{{ t('sessions.revoke') }}</button>
            <button type="button" data-cancel :disabled="busy" @click="selected = null">{{ t('common.cancel') }}</button>
          </div></div
        >
      </li>
    </ul>
  </main>
</template>
<script setup lang="ts">
  import { ref, watch, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/store/modules/user';
  import { getSessions, revokeSession, type LoginSession } from '@/api/sessions';
  import { formatInstant } from '@/utils/timeUtils';
  import PageIcon from '@/components/PageIcon.vue';
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

  .sessions-page {
    padding: 1rem 0.75rem;
  }

  .sessions-heading {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .sessions-heading button {
    display: flex;
    flex-shrink: 0;
    gap: 0.375rem;
    align-items: center;
    min-height: 2.75rem;
    color: #1765cf;
  }

  .sessions-heading svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  .session-hint {
    margin: 1rem 0 1.25rem;
    font-size: 0.8125rem;
    line-height: 1.65;
    color: #666;
  }

  .session-list {
    padding: 0;
    margin: 0;
    overflow: hidden;
    list-style: none;
    background: #fff;
    border-radius: 0.75rem;
  }

  .session-entry {
    display: flex;
    gap: 0.75rem;
    padding: 1.125rem 0.875rem;
    border-bottom: 1px solid #eee;
  }

  .session-entry:last-child {
    border-bottom: 0;
  }

  .session-icon {
    padding-top: 0.125rem;
    color: #666;
  }

  .current .session-icon {
    color: #1765cf;
  }

  .session-content {
    flex: 1;
    min-width: 0;
  }

  h2 {
    margin: 0 0 0.875rem;
    font-size: 1rem;
    line-height: 1.5;
  }

  .current h2 {
    color: #1765cf;
  }

  .session-dates {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.5;
  }

  .session-dates > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
    gap: 0.5rem;
    margin: 0.375rem 0;
  }

  dt {
    color: #666;
    overflow-wrap: anywhere;
  }

  dd {
    margin: 0;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .revoke-button {
    min-height: 2.75rem;
    padding: 0.5rem 0;
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: #b42318;
    background: transparent;
    border: 0;
  }

  .revoke-confirm {
    padding: 0.875rem;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.6;
    background: #fff8f6;
    border: 1px solid #f0d9d6;
    border-radius: 0.625rem;
  }

  .revoke-confirm p {
    margin: 0 0 0.75rem;
  }

  .revoke-confirm button {
    min-height: 2.75rem;
    margin: 0 0.375rem 0.375rem 0;
    font-size: 0.8125rem;
  }

  .revoke-confirm [data-confirm] {
    color: #b42318;
    border-color: #e5bbb5;
  }
</style>
