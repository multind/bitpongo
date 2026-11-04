<template>
  <section class="recipient-sheet" role="dialog" aria-modal="true" aria-labelledby="recipient-title">
    <header>
      <h2 id="recipient-title">{{ label('recipient') }}</h2>
      <button type="button" @click="emit('close')">{{ t('common.cancel') }}</button>
    </header>
    <p v-if="busy && !settings" role="status">{{ t('common.loading') }}</p>
    <p v-if="failed" role="alert">{{ label('failed') }}</p>
    <template v-if="settings">
      <template v-if="!settings.accountEmail">
        <p>{{ label('bindFirst') }}</p>
        <RouterLink to="/member/security?bindEmail=1">{{ label('bind') }}</RouterLink>
      </template>
      <form v-else @submit.prevent="save">
        <label><input v-model="mode" type="radio" value="account" :disabled="busy" /> {{ label('account') }}</label>
        <p>{{ settings.accountEmail }}</p>
        <label><input v-model="mode" type="radio" value="custom" :disabled="busy" /> {{ label('custom') }}</label>
        <template v-if="mode === 'custom'">
          <input
            v-model.trim="address"
            type="email"
            autocomplete="email"
            maxlength="100"
            :aria-label="label('custom')"
            :disabled="busy"
            @input="clearCode"
          />
          <p v-if="!settings.available">{{ label('unavailable') }}</p>
          <button v-if="changed" type="button" :disabled="busy || !settings.available || !validAddress" @click="sendCode">
            {{ label('sendCode') }}
          </button>
          <label v-if="challengeId">
            {{ label('code') }}
            <input v-model.trim="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" :disabled="busy" />
          </label>
        </template>
        <button type="submit" :disabled="busy || (mode === 'custom' && changed && (!challengeId || !/^[0-9]{8}$/.test(code)))">
          {{ t('common.save') }}
        </button>
      </form>
    </template>
  </section>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getReminderEmail, requestEmailCode, useDefaultReminderEmail, verifyReminderEmail, type ReminderEmail } from '@/api/security';

  const emit = defineEmits<{ close: [] }>();
  const { t } = useI18n();
  const label = (key: string) => t(`notificationMethods.reminderEmail.${key}`);
  const settings = ref<ReminderEmail>();
  const mode = ref<'account' | 'custom'>('account');
  const address = ref('');
  const challengeId = ref('');
  const code = ref('');
  const busy = ref(false);
  const failed = ref(false);
  const changed = computed(() => address.value !== settings.value?.customEmail);
  const validAddress = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.value));

  async function run(action: () => Promise<void>) {
    if (busy.value) return;
    busy.value = true;
    failed.value = false;
    try {
      await action();
    } catch {
      failed.value = true;
    } finally {
      busy.value = false;
    }
  }
  onMounted(() =>
    run(async () => {
      settings.value = await getReminderEmail();
      address.value = settings.value.customEmail ?? '';
      mode.value = settings.value.customEmail ? 'custom' : 'account';
    }),
  );
  function clearCode() {
    challengeId.value = '';
    code.value = '';
  }
  function sendCode() {
    return run(async () => {
      clearCode();
      challengeId.value = (await requestEmailCode({ purpose: 'REMINDER_EMAIL', email: address.value })).challengeId;
    });
  }
  function save() {
    return run(async () => {
      if (mode.value === 'account' && settings.value?.customEmail) await useDefaultReminderEmail();
      if (mode.value === 'custom' && changed.value) await verifyReminderEmail({ challengeId: challengeId.value, code: code.value });
      emit('close');
    });
  }
</script>

<style scoped>
  .recipient-sheet {
    padding: 1.25rem;
    padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));
  }

  header {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  form {
    display: grid;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  p {
    overflow-wrap: anywhere;
  }

  form p {
    margin: 0;
    color: #68605a;
  }

  input:not([type='radio']) {
    box-sizing: border-box;
    width: 100%;
    padding: 0.7rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
  }

  button {
    padding: 0.55rem 0.85rem;
    color: #1464c0;
    background: #f3f5f8;
    border: 0;
    border-radius: 0.5rem;
  }

  button[type='submit'] {
    color: #fff;
    background: #1565c8;
  }

  button:disabled {
    opacity: 0.5;
  }
</style>
