<template>
  <main class="register">
    <div class="brand-logo">
      <img src="../../assets/logo.png" alt="Bitpongo" />
    </div>
    <h1>{{ t('register.title') }}</h1>
    <p class="subtitle">{{ t('register.subtitle') }}</p>

    <nut-form class="form" :model-value="form" label-position="top">
      <nut-form-item class="register-field" :label="t('register.nameLabel')">
        <nut-input v-model="form.name" data-test="register-name" :placeholder="t('register.namePlaceholder')" type="text" />
      </nut-form-item>
      <nut-form-item class="register-field" :label="t('register.emailLabel')">
        <nut-input v-model="form.email" data-test="register-email" :placeholder="t('register.emailPlaceholder')" type="email" />
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

      <div class="agreement-row">
        <nut-checkbox v-model="form.agreed" data-test="register-agreement" />
        <span>{{ t('register.agreePrefix') }}</span>
        <button class="link" type="button" @click="router.push('/agreement')">{{ t('register.agreement') }}</button>
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
  import { computed, reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { showToast } from '@nutui/nutui';
  import { useUserStore } from '@/store/modules/user';

  const router = useRouter();
  const { t } = useI18n();
  const userStore = useUserStore();
  const submitting = ref(false);
  const errorMessage = ref('');
  const form = reactive({ name: '', email: '', password: '', confirmPassword: '', agreed: false });
  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const canSubmit = computed(
    () =>
      form.name.trim().length > 0 &&
      emailPattern.test(form.email.trim()) &&
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

  async function submit() {
    if (!canSubmit.value) return;
    errorMessage.value = '';
    submitting.value = true;
    const toast = showToast.loading(t('register.submitting'), { duration: 0, cover: true });
    try {
      await userStore.register(form.name.trim(), form.email.trim(), form.password);
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
  .register {
    padding: 1.25rem;
  }

  .brand-logo {
    display: flex;
    justify-content: center;
    margin: 0.25rem 0 1.25rem;

    img {
      width: 88px;
      height: 88px;
      border-radius: 22px;
    }
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
    gap: 0.5rem;
    align-items: center;
    margin: 1.375rem 0.625rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .link {
    padding: 0;
    color: #101010;
    text-decoration: underline;
    cursor: pointer;
    background: transparent;
    border: 0;
  }

  .login-link {
    margin-top: 1.25rem;
    font-size: 0.9375rem;
    line-height: 1.5;
    text-align: center;
  }
</style>
