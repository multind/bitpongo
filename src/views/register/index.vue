<template>
  <main class="register">
    <header class="auth-heading"
      ><img data-test="auth-brand" src="../../assets/logo.png" alt="Bitpongo" /><h1>{{ t('register.title') }}</h1
      ><p class="subtitle">{{ t('register.subtitle') }}</p></header
    >

    <nut-form class="form auth-panel" :model-value="form" label-position="top">
      <nut-form-item class="register-field" :label="t('register.nameLabel')">
        <nut-input v-model="form.name" data-test="register-name" :placeholder="t('register.namePlaceholder')" type="text" />
      </nut-form-item>
      <nut-form-item class="register-field" :label="t('register.emailLabel')">
        <nut-input v-model="form.email" data-test="register-email" :placeholder="t('register.emailPlaceholder')" type="email" />
      </nut-form-item>
      <nut-form-item class="register-field" :label="t('register.emailCodeLabel')">
        <div class="verification-row">
          <nut-input
            v-model="form.code"
            data-test="register-code"
            :placeholder="t('security.code')"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            :max-length="8"
          />
          <button type="button" data-test="register-send-code" :disabled="!canSend" @click="sendCode">
            {{ seconds > 0 ? t('security.resend', { seconds }) : t('security.sendCode') }}
          </button>
        </div>
        <p v-if="challengeId" class="verification-hint" role="status">{{ t('security.codeSent') }}</p>
      </nut-form-item>
      <nut-form-item class="register-field" :label="t('register.passwordLabel')">
        <nut-input v-model="form.password" data-test="register-password" :placeholder="t('register.passwordPlaceholder')" type="password" />
      </nut-form-item>
      <p class="hint">{{ t('register.passwordHint') }}</p>
      <nut-form-item class="register-field" :label="t('register.confirmPasswordLabel')">
        <nut-input
          v-model="form.confirmPassword"
          data-test="register-confirm-password"
          :placeholder="t('register.confirmPasswordPlaceholder')"
          type="password"
        />
      </nut-form-item>

      <p v-if="form.confirmPassword && form.password !== form.confirmPassword" class="error">
        {{ t('register.passwordMismatch') }}
      </p>
      <p v-if="errorMessage" class="error" data-test="register-error">{{ errorMessage }}</p>

      <div
        class="agreement-row"
        data-test="register-agreement-row"
        role="checkbox"
        :aria-checked="form.agreed"
        tabindex="0"
        style="gap: 0.25rem"
        @click="toggleAgreement"
        @keydown.enter.prevent="toggleAgreement"
        @keydown.space.prevent="toggleAgreement"
      >
        <nut-checkbox v-model="form.agreed" data-test="register-agreement" style="

--nut-checkbox-margin-right: 0" @click.stop />
        <span class="agreement-copy"
          >{{ t('register.agreePrefix') }}
          <button class="link" data-test="register-agreement-link" type="button" @click.stop="router.push('/agreement')">
            {{ t('register.agreement') }}
          </button></span
        >
      </div>

      <nut-button
        block
        color="#101010"
        data-test="register-submit"
        :disabled="!canSubmit"
        :loading="submitting"
        size="large"
        type="info"
        @click="submit"
      >
        {{ t('register.submit') }}
      </nut-button>
    </nut-form>

    <p class="login-link">
      {{ t('register.haveAccount') }}
      <button class="link" type="button" @click="router.push('/login')">{{ t('register.goLogin') }}</button>
    </p>
  </main>
</template>

<script setup lang="ts">
  import { computed, onUnmounted, reactive, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { showToast } from '@nutui/nutui';
  import { useUserStore } from '@/store/modules/user';
  import { requestEmailCode } from '@/api/security';

  const router = useRouter();
  const { t } = useI18n();
  const userStore = useUserStore();
  const submitting = ref(false);
  const errorMessage = ref('');
  const form = reactive({ name: '', email: '', code: '', password: '', confirmPassword: '', agreed: false });
  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const email = computed(() => form.email.trim().toLowerCase());
  const emailValid = computed(() => email.value.length <= 100 && emailPattern.test(email.value));
  const challengeId = ref('');
  const sending = ref(false);
  const seconds = ref(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  let generation = 0;
  const canSend = computed(() => emailValid.value && !sending.value && !submitting.value && seconds.value === 0);
  function clearChallenge() {
    generation++;
    clearInterval(timer);
    seconds.value = 0;
    challengeId.value = '';
    form.code = '';
    sending.value = false;
  }
  watch(email, clearChallenge, { flush: 'sync' });
  onUnmounted(clearChallenge);

  const canSubmit = computed(
    () =>
      form.name.trim().length > 0 &&
      emailValid.value &&
      !!challengeId.value &&
      /^[0-9]{8}$/.test(form.code.trim()) &&
      !sending.value &&
      passwordPattern.test(form.password) &&
      form.password === form.confirmPassword &&
      form.agreed &&
      !submitting.value,
  );

  function messageFrom(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const candidate = error as { message?: string; response?: { data?: { message?: string } } };
      return candidate.response?.data?.message || candidate.message || t('register.failed');
    }
    return t('register.failed');
  }

  function toggleAgreement() {
    form.agreed = !form.agreed;
  }
  async function sendCode() {
    if (!canSend.value) return;
    const current = generation;
    sending.value = true;
    errorMessage.value = '';
    challengeId.value = '';
    form.code = '';
    try {
      const result = await requestEmailCode({ purpose: 'REGISTER', email: email.value });
      if (current !== generation) return;
      challengeId.value = result.challengeId;
      const resendAt = Date.now() + 60_000;
      seconds.value = 60;
      timer = setInterval(() => {
        seconds.value = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
        if (seconds.value === 0) clearInterval(timer);
      }, 1000);
    } catch (error) {
      if (current === generation) errorMessage.value = messageFrom(error);
    } finally {
      if (current === generation) sending.value = false;
    }
  }

  async function submit() {
    if (!canSubmit.value) return;
    errorMessage.value = '';
    submitting.value = true;
    const toast = showToast.loading(t('register.submitting'), { duration: 0, cover: true });
    try {
      await userStore.register(form.name.trim(), email.value, form.password, challengeId.value, form.code.trim());
      await router.replace('/member');
    } catch (error) {
      errorMessage.value = messageFrom(error);
    } finally {
      submitting.value = false;
      toast.hide();
    }
  }
</script>

<style scoped lang="scss">
  @use '../login/auth.scss';

  .register {
    padding: 1.25rem;
  }

  h1 {
    margin: 0;
    font-size: 1.625rem;
    line-height: 1.25;
    color: #101010;
  }

  .subtitle {
    margin: 0.5rem 0 0;
    font-size: 1rem;
    line-height: 1.5;
    color: #666;
  }

  .form {
    margin: 2.5rem 0;
  }

  :deep(.register-field .nut-form-item__label) {
    font-weight: 600;
    line-height: 1.4;
    color: #333;
  }

  :deep(.register-field .nut-input),
  :deep(.register-field .input-text) {
    --nut-input-font-size: 1rem;

    min-height: 1.5rem;
    font-size: 1rem;
  }

  .hint,
  .error {
    margin: 0.5rem 0.875rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .verification-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: center;
  }

  .verification-row :deep(.nut-input) {
    flex: 1 1 7rem;
    min-width: 0;
  }

  .verification-row button {
    padding: 0.5rem 0.625rem;
    font: inherit;
    font-size: 0.875rem;
    color: #176bc5;
    background: transparent;
    border: 1px solid currentcolor;
    border-radius: 0.5rem;
  }

  .verification-row button:disabled {
    opacity: 0.5;
  }

  .verification-hint {
    margin: 0.375rem 0 0;
    font-size: 0.875rem;
    color: #666;
  }

  .hint,
  .login-link {
    margin-top: 28px;
    font-size: 26px;
    color: #666;
  }

  .error {
    color: #e34b4b;
  }

  .agreement-row {
    display: flex;
    align-items: center;
    margin: 1.375rem 0.625rem;
    font-size: 0.825rem;
    line-height: 1.5;
    cursor: pointer;
    user-select: none;
  }

  .link {
    padding: 0;
    font: inherit;
    color: #101010;
    text-decoration: underline;
    cursor: pointer;
    background: transparent;
    border: 0;
  }

  .agreement-row :deep(.nut-checkbox) {
    flex-shrink: 0;
  }

  .agreement-copy {
    min-width: 0;
  }

  .login-link {
    margin-top: 1.25rem;
    font-size: 0.9375rem;
    line-height: 1.5;
    text-align: center;
  }
</style>
