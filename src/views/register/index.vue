<template>
  <main class="register">
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
    padding: 28px 20px;
  }

  h1 {
    margin: 0;
    font-size: 28px;
    color: #101010;
  }

  .subtitle,
  .hint,
  .login-link {
    font-size: 14px;
    color: #666;
  }

  .form {
    margin-top: 28px;
  }

  .nut-form-item {
    margin-top: 14px;
    border-radius: 20px;
  }

  .hint {
    margin: 8px 14px;
  }

  .error {
    margin: 10px 14px;
    font-size: 14px;
    color: #e34b4b;
  }

  .agreement-row {
    display: flex;
    gap: 6px;
    align-items: center;
    margin: 22px 10px;
    font-size: 13px;
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
    margin-top: 20px;
    text-align: center;
  }
</style>
