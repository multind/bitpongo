<template>
  <main class="preferences-page">
    <h1 class="page-heading">{{ t('preferences.title') }}</h1>
    <section class="preferences-card">
      <button
        ref="languageTrigger"
        type="button"
        class="timezone-trigger"
        data-test="preference-language"
        aria-haspopup="dialog"
        :aria-expanded="sheet === 'language'"
        :disabled="busy"
        @click="open('language')"
      >
        <NutCell :title="t('language.label')" :desc="languageName(locale)" is-link />
      </button>
      <button
        ref="colorTrigger"
        type="button"
        class="timezone-trigger"
        data-test="preference-color"
        aria-haspopup="dialog"
        :aria-expanded="sheet === 'color'"
        :disabled="busy || !canEdit"
        @click="open('color')"
      >
        <NutCell
          :title="t('profile.color')"
          :desc="canEdit ? t(color === 'GREEN_UP' ? 'profile.greenUp' : 'profile.redUp') : t('common.notSet')"
          is-link
        />
      </button>
    </section>
    <p v-if="busy && !sheet" role="status">{{ t('common.loading') }}</p>
    <p v-if="error && !sheet" role="alert">{{ t('common.saveFailed') }}</p>
    <button v-if="!canEdit && !busy" class="retry" type="button" @click="load">{{ t('market.retry') }}</button>
    <p v-if="saved" role="status">{{ t('common.saveSuccess') }}</p>
    <NutPopup
      :visible="!!sheet"
      position="bottom"
      round
      @update:visible="closeFromOverlay"
      @opened="cancelButton?.focus()"
      @closed="restoreFocus"
    >
      <section
        class="timezone-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="sheetTitle"
        @keydown.tab="trapSheetTab"
        @keydown.esc="close"
      >
        <header class="timezone-toolbar">
          <button ref="cancelButton" data-test="preference-cancel" type="button" :disabled="busy" @click="close">{{
            t('common.cancel')
          }}</button>
          <h3>{{ sheetTitle }}</h3>
          <button data-test="preference-confirm" type="button" :disabled="busy || (sheet === 'color' && !canEdit)" @click="confirm">{{
            busy ? t('common.loading') : t('common.confirm')
          }}</button>
        </header>
        <div class="timezone-options" role="radiogroup" :aria-label="sheetTitle">
          <template v-if="sheet === 'language'">
            <label v-for="language in languages" :key="language" class="timezone-option"
              ><span>{{ languageName(language) }}</span
              ><input v-model="draftLanguage" type="radio" :name="radioName" :value="language" :disabled="busy"
            /></label>
          </template>
          <template v-else>
            <label v-for="mode in colors" :key="mode" class="timezone-option"
              ><span>{{ t(mode === 'GREEN_UP' ? 'profile.greenUp' : 'profile.redUp') }}</span
              ><input v-model="draftColor" type="radio" :name="radioName" :value="mode" :disabled="busy"
            /></label>
          </template>
        </div>
        <p v-if="error" class="sheet-error" role="alert">{{ t('common.saveFailed') }}</p>
      </section>
    </NutPopup>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Cell as NutCell, Popup as NutPopup } from '@nutui/nutui';
  import '@nutui/nutui/dist/packages/cell/index.css';
  import '@nutui/nutui/dist/packages/popup/index.css';
  import '@nutui/nutui/dist/packages/overlay/index.css';
  import { switchLang, type LocaleKey } from '@/i18n';
  import { getUserProfile, saveUserProfile, type MarketColorMode } from '@/api/profile';
  import { useUserStore } from '@/store/modules/user';
  import { trapSheetTab } from '@/views/list/components/timezone-sheet';

  const { t, locale } = useI18n();
  const user = useUserStore();
  const languages: LocaleKey[] = ['zh-cn', 'zh-tw', 'en-us'];
  const colors: MarketColorMode[] = ['GREEN_UP', 'RED_UP'];
  const languageName = (value: string) => t(value === 'zh-cn' ? 'language.zhCn' : value === 'zh-tw' ? 'language.zhTw' : 'language.enUs');
  const color = ref<MarketColorMode>('GREEN_UP');
  const draftColor = ref<MarketColorMode>('GREEN_UP');
  const draftLanguage = ref<LocaleKey>('en-us');
  const sheet = ref<'language' | 'color' | null>(null);
  const lastSheet = ref<'language' | 'color'>('language');
  const sheetTitle = computed(() => t(sheet.value === 'language' ? 'language.label' : 'profile.color'));
  const busy = ref(false),
    error = ref(false),
    saved = ref(false),
    loadedToken = ref('');
  const canEdit = computed(() => !!user.token && loadedToken.value === user.token);
  const radioName = useId();
  const languageTrigger = ref<HTMLButtonElement>(),
    colorTrigger = ref<HTMLButtonElement>(),
    cancelButton = ref<HTMLButtonElement>();
  let mounted = true;
  watch(
    () => user.token,
    () => {
      sheet.value = null;
      loadedToken.value = '';
      saved.value = false;
      error.value = false;
    },
  );
  async function load() {
    if (busy.value || !user.token) return;
    const token = user.token;
    busy.value = true;
    error.value = false;
    try {
      const profile = await getUserProfile();
      if (!mounted || token !== user.token) return;
      color.value = profile.upDownColor;
      loadedToken.value = token;
    } catch {
      if (mounted && token === user.token) error.value = true;
    } finally {
      if (mounted) busy.value = false;
    }
  }
  function open(kind: 'language' | 'color') {
    if (busy.value || (kind === 'color' && !canEdit.value)) return;
    draftLanguage.value = locale.value as LocaleKey;
    draftColor.value = color.value;
    error.value = false;
    saved.value = false;
    lastSheet.value = kind;
    sheet.value = kind;
  }
  function close() {
    if (!busy.value) {
      sheet.value = null;
      error.value = false;
    }
  }
  function closeFromOverlay(visible: boolean) {
    if (!visible) close();
  }
  function restoreFocus() {
    (lastSheet.value === 'language' ? languageTrigger.value : colorTrigger.value)?.focus();
  }
  async function confirm() {
    if (busy.value) return;
    if (sheet.value === 'language') {
      const next = draftLanguage.value;
      close();
      if (next !== locale.value) switchLang(next);
      return;
    }
    if (sheet.value !== 'color' || !canEdit.value) return;
    const token = user.token,
      selection = draftColor.value;
    busy.value = true;
    error.value = false;
    try {
      const current = await getUserProfile();
      if (!mounted || token !== user.token) return;
      const profile = await saveUserProfile({ ...current, upDownColor: selection });
      if (!mounted || token !== user.token) return;
      color.value = profile.upDownColor;
      user.setInfo({ ...user.info, name: profile.name, upDownColor: profile.upDownColor });
      sheet.value = null;
      saved.value = true;
    } catch {
      if (mounted && token === user.token) error.value = true;
    } finally {
      if (mounted) busy.value = false;
    }
  }
  onMounted(load);
  onUnmounted(() => {
    mounted = false;
  });
</script>
<style scoped lang="scss">
  @use '../../list/components/timezone-sheet.scss';

  .preferences-page {
    padding: 1rem 0.75rem;
    color: #333;
  }

  h1 {
    margin: 0 0 1.25rem;
    font-size: 1.25rem;
  }

  .preferences-card {
    padding: 0 0.75rem;
    background: #fff;
    border-radius: 0.875rem;
  }

  .timezone-trigger + .timezone-trigger {
    border-top: 1px solid #eee;
    border-radius: 0;
  }

  .timezone-trigger :deep(.nut-cell) {
    min-height: 3.5rem;
  }

  .retry {
    min-height: 2.75rem;
    padding: 0.5rem 1rem;
    font: inherit;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 0.625rem;
  }

  [role='alert'] {
    line-height: 1.6;
    color: #c62828;
  }

  .sheet-error {
    padding: 0 1rem;
  }
</style>
