<template>
  <main class="account-settings">
    <section class="warning-card">
      <h1>{{ t('account.deleteTitle') }}</h1>
      <p>{{ t('account.deleteWarning') }}</p>
      <nut-cell-group>
        <nut-cell :title="t('account.stopPlans')" />
        <nut-cell :title="t('account.removeApiKeys')" />
        <nut-cell :title="t('account.anonymizeHistory')" />
      </nut-cell-group>
    </section>

    <section class="confirmation-card">
      <label class="field-label" for="account-password">{{ t('account.passwordLabel') }}</label>
      <nut-input
        id="account-password"
        v-model="password"
        data-test="account-password"
        type="password"
        autocomplete="current-password"
        :placeholder="t('account.passwordPlaceholder')"
        :disabled="loading"
      />
      <nut-checkbox v-model="acknowledged" data-test="account-confirmation" :disabled="loading">
        {{ t('account.acknowledge') }}
      </nut-checkbox>
      <nut-button
        block
        color="#d93025"
        size="large"
        data-test="delete-account"
        :disabled="!canSubmit || loading"
        :loading="loading"
        @click="requestConfirmation"
      >
        {{ t('account.deleteButton') }}
      </nut-button>
    </section>
  </main>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { showDialog, showToast } from '@nutui/nutui';
  import { useUserStore } from '@/store/modules/user';

  const { t } = useI18n();
  const router = useRouter();
  const userStore = useUserStore();
  const password = ref('');
  const acknowledged = ref(false);
  const loading = ref(false);
  const canSubmit = computed(() => password.value.trim().length > 0 && acknowledged.value);

  function safeErrorMessage(error: unknown): string {
    if (typeof error === 'string' && error.trim()) return error;
    if (error instanceof Error && error.message.trim()) return error.message;
    return t('account.deleteFailed');
  }

  async function deleteAccount() {
    if (!canSubmit.value || loading.value) return;
    loading.value = true;
    try {
      await userStore.deleteAccount(password.value);
      await router.replace('/login');
    } catch (error) {
      showToast.fail(safeErrorMessage(error));
    } finally {
      loading.value = false;
    }
  }

  function requestConfirmation() {
    if (!canSubmit.value || loading.value) return;
    showDialog({
      textAlign: 'center',
      title: t('account.deleteConfirmTitle'),
      content: t('account.deleteConfirmContent'),
      onOk: deleteAccount,
    });
  }
</script>

<style scoped lang="scss">
  .account-settings {
    padding: 16px;
  }

  .warning-card,
  .confirmation-card {
    padding: 16px;
    margin-bottom: 16px;
    background: #fff;
    border-radius: 10px;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 22px;
    color: #d93025;
  }

  p,
  .field-label {
    font-size: 14px;
    color: #404040;
  }

  .field-label {
    display: block;
    margin-bottom: 8px;
  }

  .nut-checkbox {
    margin: 18px 0;
  }
</style>
