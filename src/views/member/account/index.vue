<template>
  <main class="account-settings">
    <section class="timezone-settings">
      <h1>{{ t('account.timeZoneTitle') }}</h1>
      <p class="subtitle">{{ t('account.timeZoneDescription') }}</p>
      <label class="field-label" for="timezone-mode">{{ t('account.timeZoneMode') }}</label>
      <select id="timezone-mode" v-model="timeZoneMode" data-test="timezone-mode" class="timezone-mode" :disabled="timeZoneLoading">
        <option value="FOLLOW_DEVICE">{{ t('account.followDevice') }}</option>
        <option value="FIXED">{{ t('account.fixedTimeZone') }}</option>
      </select>
      <TimeZoneSelect
        v-if="timeZoneMode === 'FIXED'"
        v-model="fixedTimeZone"
        label-key="account.fixedTimeZone"
        hint-key="account.fixedTimeZoneHint"
      />
      <p class="effective-timezone" data-test="effective-timezone">
        {{ t('account.effectiveTimeZone', { zone: effectiveTimeZone }) }}
      </p>
      <nut-button block color="#101010" data-test="save-timezone" :disabled="timeZoneLoading" @click="saveTimeZone">
        {{ t('account.saveTimeZone') }}
      </nut-button>
    </section>

    <section class="deletion-settings">
    <h1>{{ t('account.deleteTitle') }}</h1>
    <p class="subtitle">{{ t('account.deleteWarning') }}</p>

    <section class="account-form">
      <label class="field-label" for="account-password">{{ t('account.passwordLabel') }}</label>
      <nut-input
        id="account-password"
        v-model="password"
        class="account-password"
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
        class="delete-button"
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
    </section>
  </main>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { showDialog, showToast } from '@nutui/nutui';
  import { useUserStore } from '@/store/modules/user';
  import { getTimeZonePreference, saveTimeZonePreference, type DisplayTimeZoneMode } from '@/api';
  import { displayTimeZone, getAppContext, setDisplayTimeZonePreference } from '@/mobile/app-context';
  import TimeZoneSelect from '@/views/list/components/TimeZoneSelect.vue';

  const { t } = useI18n();
  const router = useRouter();
  const userStore = useUserStore();
  const password = ref('');
  const acknowledged = ref(false);
  const loading = ref(false);
  const canSubmit = computed(() => password.value.trim().length > 0 && acknowledged.value);
  const timeZoneMode = ref<DisplayTimeZoneMode>('FOLLOW_DEVICE');
  const fixedTimeZone = ref(getAppContext()?.timeZone || 'UTC');
  const effectiveTimeZone = ref(displayTimeZone());
  const timeZoneLoading = ref(false);

  async function loadTimeZone() {
    timeZoneLoading.value = true;
    try {
      const preference = await getTimeZonePreference();
      timeZoneMode.value = preference.mode;
      fixedTimeZone.value = preference.timezone || preference.effective_timezone;
      effectiveTimeZone.value = preference.effective_timezone;
      setDisplayTimeZonePreference(preference.mode, preference.timezone);
    } catch (error) {
      showToast.fail(safeErrorMessage(error));
    } finally {
      timeZoneLoading.value = false;
    }
  }

  async function saveTimeZone() {
    if (timeZoneLoading.value) return;
    timeZoneLoading.value = true;
    try {
      const preference = await saveTimeZonePreference({
        mode: timeZoneMode.value,
        timezone: timeZoneMode.value === 'FIXED' ? fixedTimeZone.value : null,
      });
      effectiveTimeZone.value = preference.effective_timezone;
      setDisplayTimeZonePreference(preference.mode, preference.timezone);
      showToast.success(t('account.timeZoneSaved'));
    } catch (error) {
      showToast.fail(safeErrorMessage(error));
    } finally {
      timeZoneLoading.value = false;
    }
  }

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

  onMounted(loadTimeZone);
</script>

<style scoped lang="scss">
  .account-settings {
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

  .account-form {
    margin-top: 2.5rem;
  }

  .deletion-settings {
    margin-top: 3rem;
  }

  .timezone-mode {
    box-sizing: border-box;
    width: 100%;
    min-height: 44px;
    padding: 0 0.75rem;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  .effective-timezone {
    margin: 0.75rem 0 1rem;
    color: #666;
  }

  .field-label {
    display: block;
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    color: #333;
  }

  .account-password {
    --nut-input-font-size: 1rem;
  }

  .nut-checkbox {
    margin: 1.375rem 0.625rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .delete-button {
    margin-top: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }
</style>
