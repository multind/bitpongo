<template>
  <section class="telegram-sheet" role="dialog" aria-modal="true" aria-label="Telegram">
    <header
      ><h2>Telegram</h2><button type="button" @click="emit('close')">{{ t('common.cancel') }}</button></header
    >
    <p v-if="status">{{ label(!status.available ? 'unavailable' : status.bound ? 'bound' : 'unbound') }}</p>
    <p v-if="failed" role="alert">{{ label('failed') }}</p>
    <p v-if="sent" role="status">{{ label('sent') }}</p>
    <button v-if="status?.available && !status.bound" :disabled="busy" @click="bind">{{ label(url ? 'refreshLink' : 'bind') }}</button>
    <template v-if="url && !status?.bound">
      <p>{{ label('instructions') }}</p>
      <a :href="url" rel="noreferrer">{{ label('bind') }}</a>
    </template>
    <div class="actions">
      <button :disabled="busy" @click="refresh">{{ label('refresh') }}</button>
      <button v-if="status?.available && status.bound" :disabled="busy" @click="test">{{ label('test') }}</button>
      <button v-if="status?.bound" :disabled="busy" @click="unlink">{{ label('unlink') }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { http } from '@/utils/request';
  const emit = defineEmits<{ close: [] }>();
  const { t } = useI18n();
  const label = (key: string) => t(`notificationMethods.telegram.${key}`);
  const path = '/users/notifications/telegram';
  const status = ref<{ available: boolean; bound: boolean }>();
  const url = ref('');
  const busy = ref(false);
  const failed = ref(false);
  const sent = ref(false);
  async function run(action: () => Promise<void>) {
    if (busy.value) return;
    busy.value = true;
    failed.value = sent.value = false;
    try {
      await action();
    } catch {
      failed.value = true;
    } finally {
      busy.value = false;
    }
  }
  const read = async () => {
    status.value = await http.get<{ available: boolean; bound: boolean }>(path);
    if (status.value.bound) url.value = '';
  };
  const refresh = () => run(read);
  const bind = () =>
    run(async () => {
      url.value = (await http.post<{ url: string }>(path + '/bind')).url;
    });
  const test = () =>
    run(async () => {
      await http.post<void>(path + '/test');
      sent.value = true;
    });
  const unlink = () =>
    run(async () => {
      await http.delete<void>(path);
      url.value = '';
      await read();
    });
  onMounted(refresh);
</script>

<style scoped>
  .telegram-sheet {
    padding: 1.25rem;
    padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));
  }

  header,
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  header {
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  .actions {
    margin-top: 1rem;
  }

  button,
  a {
    padding: 0.6rem 0.85rem;
    color: #1464c0;
    background: #f3f5f8;
    border: 0;
    border-radius: 0.5rem;
  }
</style>
