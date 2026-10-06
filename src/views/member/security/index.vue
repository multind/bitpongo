<template>
  <main class="alerts-page">
    <section class="alert-card">
      <h1>{{ t(recovery ? 'security.recovery' : 'security.title') }}</h1>
      <p>{{ t('security.logoutHint') }}</p>
      <form v-if="!recovery" data-password-form @submit.prevent="savePassword">
        <label for="old-password">{{ t('security.oldPassword') }}</label>
        <input id="old-password" v-model="oldPassword" type="password" autocomplete="current-password" maxlength="128" :disabled="busy" />
        <label for="new-password">{{ t('security.newPassword') }}</label>
        <input id="new-password" v-model="newPassword" type="password" autocomplete="new-password" maxlength="128" :disabled="busy" />
        <label for="confirm-password">{{ t('security.confirmPassword') }}</label>
        <input id="confirm-password" v-model="confirmation" type="password" autocomplete="new-password" maxlength="128" :disabled="busy" />
        <p class="meta">{{ t('security.passwordHint') }}</p>
        <button :disabled="busy || !user.token">{{ t('security.changePassword') }}</button>
      </form>
      <form data-email-form @submit.prevent="saveEmailOrReset">
        <h2 v-if="!recovery">{{ t('security.changeEmail') }}</h2>
        <p v-if="!emailEnabled" role="status">{{ t('security.emailUnavailable') }}</p>
        <label for="security-email">{{ t(recovery ? 'security.email' : 'security.newEmail') }}</label>
        <input
          id="security-email"
          v-model="email"
          type="email"
          autocomplete="email"
          maxlength="100"
          :disabled="busy"
          @input="clearChallenge"
        />
        <p v-if="!recovery" class="meta">{{ t('security.bindingHint') }}</p>
        <button
          type="button"
          data-send-code
          :disabled="busy || !emailEnabled || seconds > 0 || !email.trim() || (!recovery && (!oldPassword || !user.token))"
          @click="sendCode"
        >
          {{ seconds > 0 ? t('security.resend', { seconds }) : t('security.sendCode') }}
        </button>
        <p v-if="sent" role="status">{{ t('security.codeSent') }}</p>
        <label for="security-code">{{ t('security.code') }}</label>
        <input id="security-code" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" :disabled="busy" />
        <template v-if="recovery">
          <label for="new-password">{{ t('security.newPassword') }}</label>
          <input id="new-password" v-model="newPassword" type="password" autocomplete="new-password" maxlength="128" :disabled="busy" />
          <label for="confirm-password">{{ t('security.confirmPassword') }}</label>
          <input
            id="confirm-password"
            v-model="confirmation"
            type="password"
            autocomplete="new-password"
            maxlength="128"
            :disabled="busy"
          />
          <p class="meta">{{ t('security.passwordHint') }}</p>
        </template>
        <button :disabled="busy || !challengeId || !emailEnabled">{{
          t(recovery ? 'security.resetPassword' : 'security.changeEmail')
        }}</button>
      </form>
      <p v-if="error" role="alert">{{ t(error) }}</p>
      <router-link to="/login">{{ t('security.backLogin') }}</router-link>
    </section>
  </main>
</template>
<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/store/modules/user';
  import { changePassword, changeEmail, requestEmailCode, resetPassword, securityStatus } from '@/api/security';
  const props = withDefaults(defineProps<{ recovery?: boolean }>(), { recovery: false });
  const { t } = useI18n(),
    router = useRouter(),
    user = useUserStore();
  const oldPassword = ref(''),
    newPassword = ref(''),
    confirmation = ref(''),
    email = ref(''),
    code = ref(''),
    challengeId = ref('');
  const busy = ref(false),
    emailEnabled = ref(false),
    sent = ref(false),
    seconds = ref(0),
    error = ref('');
  let generation = 0,
    alive = true;
  const timer = setInterval(() => {
    if (seconds.value > 0) seconds.value--;
  }, 1000);
  function clearChallenge() {
    challengeId.value = '';
    code.value = '';
    sent.value = false;
  }
  function clearSecrets() {
    oldPassword.value = '';
    newPassword.value = '';
    confirmation.value = '';
    email.value = '';
    clearChallenge();
  }
  watch(
    () => user.token,
    () => {
      generation++;
      clearSecrets();
      busy.value = false;
      error.value = '';
    },
    { flush: 'sync' },
  );
  function validPassword() {
    if (newPassword.value.length < 12 || newPassword.value.length > 128 || !newPassword.value.trim()) {
      error.value = 'security.passwordHint';
      return false;
    }
    if (newPassword.value !== confirmation.value) {
      error.value = 'security.mismatch';
      return false;
    }
    return true;
  }
  async function run(operation: () => Promise<unknown>, logout = false) {
    if (busy.value) return;
    const current = generation;
    busy.value = true;
    error.value = '';
    try {
      await operation();
      if (!alive || generation !== current) return;
      if (logout) {
        clearSecrets();
        await user.logout();
        await router.replace('/login');
      }
    } catch {
      if (alive && generation === current) error.value = 'security.failed';
    } finally {
      if (alive && generation === current) busy.value = false;
    }
  }
  async function savePassword() {
    if (busy.value || !user.token) return;
    error.value = '';
    if (!validPassword() || !oldPassword.value) return;
    await run(() => changePassword({ oldPassword: oldPassword.value, newPassword: newPassword.value }), true);
  }
  async function sendCode() {
    if (busy.value || !emailEnabled.value || seconds.value > 0 || !email.value.trim() || (!props.recovery && !oldPassword.value)) return;
    const current = generation,
      target = email.value.trim();
    await run(async () => {
      const result = await requestEmailCode({
        purpose: props.recovery ? 'RESET' : 'EMAIL',
        email: target,
        ...(!props.recovery ? { oldPassword: oldPassword.value } : {}),
      });
      if (!alive || current !== generation || target !== email.value.trim()) return;
      challengeId.value = result.challengeId;
      sent.value = true;
      seconds.value = 60;
    });
  }
  async function saveEmailOrReset() {
    if (busy.value || !emailEnabled.value || !challengeId.value || !/^\d{8}$/.test(code.value)) return;
    if (props.recovery && !validPassword()) return;
    if (!props.recovery && (!user.token || !oldPassword.value)) return;
    await run(
      () =>
        props.recovery
          ? resetPassword({ challengeId: challengeId.value, code: code.value, newPassword: newPassword.value })
          : changeEmail({ challengeId: challengeId.value, code: code.value, oldPassword: oldPassword.value }),
      true,
    );
  }
  onMounted(async () => {
    try {
      const status = await securityStatus();
      if (alive) emailEnabled.value = status.emailEnabled;
    } catch {
      if (alive) emailEnabled.value = false;
    }
  });
  onUnmounted(() => {
    alive = false;
    generation++;
    clearInterval(timer);
    clearSecrets();
  });
</script>
<style scoped lang="scss">
  @use '../../alerts/shared.scss';

  form + form {
    margin-top: 2rem;
  }
</style>
