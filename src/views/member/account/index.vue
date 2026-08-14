<template>
  <main class="account-settings">
    <section class="warning-card">
      <h1>注销账号</h1>
      <p>注销后无法恢复，请确认你已了解以下影响：</p>
      <nut-cell-group>
        <nut-cell title="停止全部运行中的策略" />
        <nut-cell title="删除交易所 API 密钥" />
        <nut-cell title="匿名保留历史记录（不再关联个人身份）" />
      </nut-cell-group>
    </section>

    <section class="confirmation-card">
      <label class="field-label" for="account-password">请输入当前账号密码</label>
      <nut-input
        id="account-password"
        v-model="password"
        data-test="account-password"
        type="password"
        autocomplete="current-password"
        placeholder="当前密码"
        :disabled="loading"
      />
      <nut-checkbox v-model="acknowledged" data-test="account-confirmation" :disabled="loading"> 我已了解注销结果不可恢复 </nut-checkbox>
      <nut-button
        block
        color="#d93025"
        size="large"
        data-test="delete-account"
        :disabled="!canSubmit || loading"
        :loading="loading"
        @click="requestConfirmation"
      >
        注销账号
      </nut-button>
    </section>
  </main>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { showDialog, showToast } from '@nutui/nutui';
  import { useUserStore } from '@/store/modules/user';

  const router = useRouter();
  const userStore = useUserStore();
  const password = ref('');
  const acknowledged = ref(false);
  const loading = ref(false);
  const canSubmit = computed(() => password.value.trim().length > 0 && acknowledged.value);

  function safeErrorMessage(error: unknown): string {
    if (typeof error === 'string' && error.trim()) return error;
    if (error instanceof Error && error.message.trim()) return error.message;
    return '注销失败，请稍后重试';
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
      title: '确认注销账号',
      content: '账号注销后无法恢复，是否继续？',
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
    color: #666;
  }

  .field-label {
    display: block;
    margin-bottom: 8px;
  }

  .nut-checkbox {
    margin: 18px 0;
  }
</style>
