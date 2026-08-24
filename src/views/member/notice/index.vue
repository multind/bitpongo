<template>
  <main class="notice-settings">
    <header>
      <h1>{{ t('notice.barkTitle') }}</h1>
      <p class="intro">{{ t('notice.intro') }}</p>
    </header>

    <section class="settings-card">
      <div class="status-row">
        <span>{{ configured ? t('notice.configured') : t('notice.notConfigured') }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ enabled ? t('notice.enabled') : t('notice.disabled') }}</span>
      </div>

      <div class="field-heading">
        <label for="bark-push-url">{{ t('notice.pushUrl') }}</label>
        <button
          class="visibility-button"
          type="button"
          :aria-label="t('notice.pushUrl')"
          data-test="bark-visibility"
          @click="showPushUrl = !showPushUrl"
        >
          {{ showPushUrl ? '◉' : '○' }}
        </button>
      </div>
      <nut-input
        id="bark-push-url"
        v-model="pushUrl"
        autocomplete="new-password"
        data-test="bark-push-url"
        :disabled="busy"
        :placeholder="t('notice.pushUrlPlaceholder')"
        :type="showPushUrl ? 'text' : 'password'"
      />
      <p v-if="configured && maskedPushUrl" class="masked-address">{{ maskedPushUrl }}</p>

      <div class="enabled-row">
        <span>{{ enabled ? t('notice.enabled') : t('notice.disabled') }}</span>
        <nut-switch v-model="enabled" :disabled="busy" />
      </div>

      <div class="actions">
        <nut-button
          block
          color="#101010"
          data-test="bark-save"
          :disabled="busy || (!configured && !hasInput)"
          :loading="saving"
          @click="save"
        >
          {{ saving ? t('notice.saving') : t('notice.save') }}
        </nut-button>
        <nut-button block plain data-test="bark-test" :disabled="busy || (!configured && !hasInput)" :loading="testing" @click="sendTest">
          {{ testing ? t('notice.testing') : t('notice.test') }}
        </nut-button>
        <nut-button v-if="configured" block plain data-test="bark-remove" :disabled="busy" @click="confirmRemove">
          {{ t('notice.remove') }}
        </nut-button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { showDialog, showToast } from '@nutui/nutui';
  import { deleteBarkSetting, getBarkSetting, saveBarkSetting, testBarkSetting, type BarkSetting, type BarkSettingRequest } from '@/api';
  import { getAppContext } from '@/mobile/app-context';

  const { locale, t } = useI18n();
  const setting = ref<BarkSetting | null>(null);
  const pushUrl = ref('');
  const enabled = ref(true);
  const showPushUrl = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const testing = ref(false);
  const removing = ref(false);

  const configured = computed(() => setting.value?.configured ?? false);
  const maskedPushUrl = computed(() => setting.value?.masked_push_url ?? '');
  const hasInput = computed(() => pushUrl.value.trim().length > 0);
  const busy = computed(() => loading.value || saving.value || testing.value || removing.value);

  function requestLocale(): BarkSetting['locale'] {
    const locales: Record<string, BarkSetting['locale']> = {
      'zh-cn': 'zh-CN',
      'zh-tw': 'zh-TW',
      'en-us': 'en-US',
    };
    return locales[String(locale.value).toLowerCase()] ?? 'zh-CN';
  }

  function requestTimeZone(): string {
    return getAppContext()?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  function safeErrorMessage(error: unknown): string {
    if (typeof error === 'string' && error.trim()) return error;
    if (error instanceof Error && error.message.trim()) return error.message;
    return t('notice.failed');
  }

  function currentSetting(maskedPushUrlValue: string | null): BarkSetting {
    return {
      configured: true,
      enabled: enabled.value,
      masked_push_url: maskedPushUrlValue,
      locale: requestLocale(),
      timezone: requestTimeZone(),
      updated_at: null,
    };
  }

  async function loadSetting() {
    loading.value = true;
    try {
      setting.value = await getBarkSetting();
      enabled.value = setting.value.enabled;
    } catch (error) {
      showToast.fail(safeErrorMessage(error));
    } finally {
      loading.value = false;
    }
  }

  async function save() {
    if (busy.value || (!configured.value && !hasInput.value)) return;
    saving.value = true;
    const input = pushUrl.value.trim();
    const payload: BarkSettingRequest = {
      enabled: enabled.value,
      locale: requestLocale(),
      timezone: requestTimeZone(),
    };
    if (input) payload.push_url = input;
    try {
      const saved = await saveBarkSetting(payload);
      setting.value = saved || currentSetting(setting.value?.masked_push_url ?? null);
      pushUrl.value = '';
      showPushUrl.value = false;
      showToast.success(t('notice.saved'));
    } catch (error) {
      showToast.fail(safeErrorMessage(error));
    } finally {
      saving.value = false;
    }
  }

  async function sendTest() {
    if (busy.value || (!configured.value && !hasInput.value)) return;
    testing.value = true;
    const input = pushUrl.value.trim();
    try {
      await testBarkSetting(input ? { push_url: input } : {});
      showToast.success(t('notice.sent'));
    } catch (error) {
      showToast.fail(safeErrorMessage(error));
    } finally {
      testing.value = false;
    }
  }

  async function remove() {
    if (busy.value) return;
    removing.value = true;
    try {
      await deleteBarkSetting();
      setting.value = null;
      pushUrl.value = '';
      enabled.value = true;
      showPushUrl.value = false;
      showToast.success(t('notice.removed'));
    } catch (error) {
      showToast.fail(safeErrorMessage(error));
    } finally {
      removing.value = false;
    }
  }

  function confirmRemove() {
    if (busy.value || !configured.value) return;
    showDialog({
      textAlign: 'center',
      title: t('notice.removeTitle'),
      content: t('notice.removeConfirm'),
      onOk: remove,
    });
  }

  onMounted(loadSetting);
</script>

<style scoped lang="scss">
  .notice-settings {
    padding: 1.25rem;
  }

  h1 {
    margin: 0;
    font-size: 1.625rem;
    line-height: 1.25;
    color: #101010;
  }

  .intro {
    margin: 0.5rem 0 0;
    font-size: 0.9375rem;
    line-height: 1.5;
    color: #666;
  }

  .settings-card {
    margin-top: 2rem;
  }

  .status-row,
  .enabled-row,
  .field-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .status-row {
    gap: 0.5rem;
    justify-content: flex-start;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    color: #666;
  }

  .field-heading {
    margin-bottom: 0.625rem;
    font-size: 1rem;
    font-weight: 600;
    color: #333;
  }

  .visibility-button {
    padding: 0.25rem 0.5rem;
    font-size: 1.25rem;
    color: #555;
    background: transparent;
    border: 0;
  }

  .masked-address {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: #888;
    overflow-wrap: anywhere;
  }

  .enabled-row {
    margin-top: 1.5rem;
    font-size: 0.9375rem;
    color: #333;
  }

  .actions {
    display: grid;
    gap: 0.75rem;
    margin-top: 2rem;
  }
</style>
