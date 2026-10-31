<template>
  <component :is="embedded ? 'section' : 'main'" class="account-settings" :class="{ embedded }">
    <h1 v-if="!embedded" class="page-heading">{{ t('member.account') }}</h1>
    <router-link v-if="!embedded" class="security-entry" to="/member/security">
      <span>{{ t('security.title') }}</span
      ><span aria-hidden="true">›</span>
    </router-link>
    <section v-if="!section || section === 'timezone'" class="timezone-settings settings-card" aria-labelledby="account-timezone-heading">
      <h2 id="account-timezone-heading">{{ t('account.timeZoneTitle') }}</h2>
      <p class="subtitle">{{ t('account.timeZoneDescription') }}</p>
      <button
        ref="modeTrigger"
        type="button"
        class="timezone-trigger"
        data-test="timezone-mode"
        aria-haspopup="dialog"
        :aria-expanded="modeVisible"
        :disabled="timeZoneLoading"
        @click="openMode"
      >
        <NutCell
          :title="t('account.timeZoneMode')"
          :desc="t(timeZoneMode === 'FIXED' ? 'account.fixedTimeZone' : 'account.followDevice')"
          is-link
        />
      </button>
      <NutPopup v-model:visible="modeVisible" position="bottom" round @opened="modeCancel?.focus()" @closed="modeTrigger?.focus()">
        <section
          class="timezone-sheet"
          role="dialog"
          aria-modal="true"
          :aria-label="t('account.timeZoneMode')"
          @keydown.tab="trapSheetTab"
          @keydown.esc="modeVisible = false"
        >
          <header class="timezone-toolbar">
            <button ref="modeCancel" type="button" data-test="timezone-mode-cancel" @click="modeVisible = false">{{
              t('common.cancel')
            }}</button>
            <h3>{{ t('account.timeZoneMode') }}</h3>
            <button type="button" data-test="timezone-mode-confirm" :disabled="timeZoneLoading" @click="confirmMode">{{
              t('common.confirm')
            }}</button>
          </header>
          <div class="timezone-options" role="radiogroup" :aria-label="t('account.timeZoneMode')">
            <label v-for="mode in timeZoneModes" :key="mode.value" class="timezone-option">
              <span>{{ t(mode.label) }}</span
              ><input v-model="draftMode" type="radio" name="timezone-mode" :value="mode.value" />
            </label>
          </div>
        </section>
      </NutPopup>
      <TimeZoneSelect
        v-if="timeZoneMode === 'FIXED'"
        v-model="fixedTimeZone"
        label-key="account.fixedTimeZone"
        hint-key="account.fixedTimeZoneHint"
        :disabled="timeZoneLoading"
      />
      <p class="effective-timezone" data-test="effective-timezone">
        {{ t('account.effectiveTimeZone', { zone: effectiveTimeZone }) }}
      </p>
      <nut-button block color="#1765cf" data-test="save-timezone" :disabled="timeZoneLoading" @click="saveTimeZone">
        {{ t('account.saveTimeZone') }}
      </nut-button>
    </section>

    <section
      v-if="!section || section === 'deletion'"
      class="deletion-settings settings-card"
      aria-labelledby="account-deletion-heading"
      aria-describedby="account-deletion-warning"
    >
      <h2 id="account-deletion-heading">{{ t('account.deleteTitle') }}</h2>
      <p id="account-deletion-warning" class="subtitle">{{ t('account.deleteWarning') }}</p>

      <section class="account-form">
        <label class="field-label" for="account-password">{{ t('account.passwordLabel') }}</label>
        <input
          id="account-password"
          v-model="password"
          class="account-password"
          data-test="account-password"
          type="password"
          autocomplete="current-password"
          aria-describedby="account-deletion-warning"
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
  </component>
</template>

<script setup lang="ts">
  defineProps<{ embedded?: boolean; section?: 'timezone' | 'deletion' }>();
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { Cell as NutCell, Popup as NutPopup, showDialog, showToast } from '@nutui/nutui';
  import '@nutui/nutui/dist/packages/cell/index.css';
  import '@nutui/nutui/dist/packages/popup/index.css';
  import '@nutui/nutui/dist/packages/overlay/index.css';
  import { useUserStore } from '@/store/modules/user';
  import { getTimeZonePreference, saveTimeZonePreference, type DisplayTimeZoneMode } from '@/api';
  import { displayTimeZone, getAppContext, setDisplayTimeZonePreference } from '@/mobile/app-context';
  import TimeZoneSelect from '@/views/list/components/TimeZoneSelect.vue';
  import { trapSheetTab } from '@/views/list/components/timezone-sheet';

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
  const modeVisible = ref(false);
  const modeTrigger = ref<HTMLButtonElement>();
  const modeCancel = ref<HTMLButtonElement>();
  const draftMode = ref<DisplayTimeZoneMode>('FOLLOW_DEVICE');
  const timeZoneModes = [
    { value: 'FOLLOW_DEVICE', label: 'account.followDevice' },
    { value: 'FIXED', label: 'account.fixedTimeZone' },
  ] as const;

  function openMode() {
    if (timeZoneLoading.value) return;
    draftMode.value = timeZoneMode.value;
    modeVisible.value = true;
  }

  function confirmMode() {
    if (timeZoneLoading.value) return;
    timeZoneMode.value = draftMode.value;
    modeVisible.value = false;
  }

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
  @use '@/views/list/components/timezone-sheet.scss';

  .account-settings.embedded {
    padding: 0;
  }

  .account-settings {
    padding: 1rem 0.75rem;
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
    line-height: 1.25;
    color: #101010;
  }

  h2 {
    margin: 0;
    font-size: 1.0625rem;
    line-height: 1.5;
  }

  .settings-card {
    padding: 1.25rem;
    margin-top: 1rem;
    background: #fff;
    border-radius: 0.875rem;
  }

  .security-entry {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    min-height: 2.75rem;
    padding: 0.75rem 1.25rem;
    margin-top: 1rem;
    color: #333;
    text-decoration: none;
    background: #fff;
    border-radius: 0.875rem;
  }

  .subtitle {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #666;
  }

  .account-form {
    margin-top: 1.25rem;
  }

  .deletion-settings {
    border: 1px solid #f0d3d0;
  }

  .timezone-settings :deep(.timezone-field) {
    margin: 1rem 0;
  }

  .effective-timezone {
    margin: 0.75rem 0 1rem;
    color: #666;
  }

  .field-label {
    display: block;
    margin: 1rem 0 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    color: #333;
  }

  .account-password {
    box-sizing: border-box;
    width: 100%;
    min-height: 2.75rem;
    padding: 0.75rem;
    font: inherit;
    color: #333;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 0.625rem;
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
