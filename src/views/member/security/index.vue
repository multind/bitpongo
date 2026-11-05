<template>
  <main class="alerts-page security-page">
    <header class="security-heading"
      ><h1 id="security-page-heading" :class="{ 'page-heading': !recovery }">{{ t(recovery ? 'security.recovery' : 'security.title') }}</h1
      ><p>{{ t('security.logoutHint') }}</p></header
    >
    <details v-if="!recovery" class="security-menu-item">
      <summary>{{ t('security.changePassword') }}</summary>
      <form
        v-if="!recovery"
        class="alert-card security-card"
        data-password-form
        aria-labelledby="security-password-heading"
        @submit.prevent="savePassword"
      >
        <h2 id="security-password-heading">{{ t('security.changePassword') }}</h2>
        <label for="old-password">{{ t('security.oldPassword') }}</label>
        <input id="old-password" v-model="oldPassword" type="password" autocomplete="current-password" maxlength="128" :disabled="busy" />
        <label for="new-password">{{ t('security.newPassword') }}</label>
        <input
          id="new-password"
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
          maxlength="128"
          aria-describedby="security-password-hint"
          :disabled="busy"
        />
        <label for="confirm-password">{{ t('security.confirmPassword') }}</label>
        <input id="confirm-password" v-model="confirmation" type="password" autocomplete="new-password" maxlength="128" :disabled="busy" />
        <p id="security-password-hint" class="meta">{{ t('security.passwordHint') }}</p>
        <button class="security-primary" :disabled="busy || !user.token">{{
          busy ? t('common.loading') : t('security.changePassword')
        }}</button>
      </form>
    </details>
    <details class="security-menu-item" :open="recovery || $route?.query.bindEmail === '1'">
      <summary v-if="!recovery">{{ t('security.changeEmail') }}</summary>
      <form
        class="alert-card security-card"
        data-email-form
        :aria-labelledby="recovery ? 'security-page-heading' : 'security-email-heading'"
        @submit.prevent="saveEmailOrReset"
      >
        <h2 v-if="!recovery" id="security-email-heading">{{ t('security.changeEmail') }}</h2>
        <template v-if="!recovery"
          ><label for="security-current-password">{{ t('security.oldPassword') }}</label
          ><input
            id="security-current-password"
            v-model="oldPassword"
            type="password"
            autocomplete="current-password"
            maxlength="128"
            :disabled="busy"
        /></template>
        <p v-if="!emailEnabled" role="status">{{ t('security.emailUnavailable') }}</p>
        <label for="security-email">{{ t(recovery ? 'security.email' : 'security.newEmail') }}</label>
        <input
          id="security-email"
          v-model="email"
          type="email"
          autocomplete="email"
          maxlength="100"
          :aria-describedby="!recovery ? 'security-email-hint' : undefined"
          :disabled="busy"
          @input="clearChallenge"
        />
        <p v-if="!recovery" id="security-email-hint" class="meta">{{ t('security.bindingHint') }}</p>
        <button
          type="button"
          class="send-code"
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
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            maxlength="128"
            aria-describedby="security-password-hint"
            :disabled="busy"
          />
          <label for="confirm-password">{{ t('security.confirmPassword') }}</label>
          <input
            id="confirm-password"
            v-model="confirmation"
            type="password"
            autocomplete="new-password"
            maxlength="128"
            :disabled="busy"
          />
          <p id="security-password-hint" class="meta">{{ t('security.passwordHint') }}</p>
        </template>
        <button class="security-primary" :disabled="busy || !challengeId || !emailEnabled">{{
          busy ? t('common.loading') : t(recovery ? 'security.resetPassword' : 'security.changeEmail')
        }}</button>
      </form>
    </details>
    <p v-if="error" role="alert">{{ t(error) }}</p>
    <details v-if="!recovery" class="security-menu-item"
      ><summary>{{ t('account.timeZoneTitle') }}</summary
      ><AccountSettings embedded section="timezone"
    /></details>
    <details v-if="!recovery" class="security-menu-item"
      ><summary>{{ t('account.deleteTitle') }}</summary
      ><AccountSettings embedded section="deletion"
    /></details>
    <router-link v-if="!recovery" class="alert-card session-entry" to="/member/devices"
      >{{ t('sessions.title') }} <span aria-hidden="true">›</span></router-link
    >
    <router-link v-if="recovery" class="back-login" to="/login">{{ t('security.backLogin') }}</router-link>
  </main>
</template>
<script setup lang="ts">
  import AccountSettings from '../account/index.vue';
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
    // Same rule as registration and the API: 8-128 characters with at least one letter and one digit.
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(newPassword.value)) {
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

  .session-entry {
    display: flex;
    justify-content: space-between;
    color: inherit;
    text-decoration: none;
  }

  .security-menu-item {
    margin-bottom: 0.75rem;
    overflow: hidden;
    background: #fff;
    border-radius: 0.875rem;
  }

  .security-menu-item > summary {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    cursor: pointer;
    list-style: none;
  }

  .security-menu-item > summary::after {
    color: #999;
    content: '›';
  }

  .security-menu-item > summary::-webkit-details-marker {
    display: none;
  }

  .security-page {
    padding: 1rem 0.75rem;
  }

  .security-heading {
    margin-bottom: 1.25rem;
  }

  h1 {
    margin: 0 0 0.75rem;
    font-size: 1.25rem;
    line-height: 1.4;
  }

  .security-heading p {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.65;
    color: #666;
  }

  .security-card {
    padding: 1.25rem;
  }

  h2 {
    margin: 0 0 1.25rem;
    font-size: 1.0625rem;
    line-height: 1.4;
  }

  label {
    margin-top: 1.125rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  input {
    min-height: 2.75rem;
    border-color: #e2e2e2;
    border-radius: 0.625rem;
  }

  .meta {
    margin: 0.5rem 0 0.875rem;
    color: #666;
  }

  .security-primary {
    width: 100%;
    min-height: 2.75rem;
    margin-top: 1.125rem;
    color: #fff;
    background: #1765cf;
    border-color: #1765cf;
    border-radius: 0.625rem;
  }

  .send-code {
    min-height: 2.75rem;
    margin-top: 0.75rem;
    font-size: 0.8125rem;
    color: #1765cf;
  }

  .back-login {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    padding: 0.5rem;
    font-size: 0.875rem;
    color: #1765cf;
    text-decoration: none;
  }

  [role='status'] {
    font-size: 0.8125rem;
    line-height: 1.6;
    color: #666;
  }
</style>
