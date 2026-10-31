<template>
  <section class="timezone-field">
    <button
      ref="trigger"
      type="button"
      class="timezone-trigger"
      data-test="timezone-select"
      aria-haspopup="dialog"
      :aria-expanded="visible"
      :disabled="disabled"
      @click="open"
    >
      <NutCell :title="t(labelKey)" :desc="modelValue" is-link />
    </button>
    <small class="timezone-hint">{{ t(hintKey) }}</small>
    <NutPopup v-model:visible="visible" position="bottom" round @opened="searchInput?.focus()" @closed="trigger?.focus()">
      <section
        class="timezone-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="t(labelKey)"
        @keydown.tab="trapSheetTab"
        @keydown.esc="visible = false"
      >
        <header class="timezone-toolbar">
          <button type="button" data-test="timezone-cancel" @click="visible = false">{{ t('common.cancel') }}</button>
          <h3>{{ t(labelKey) }}</h3>
          <button type="button" data-test="timezone-confirm" :disabled="disabled || !filteredZones.includes(draft)" @click="confirm">{{
            t('common.confirm')
          }}</button>
        </header>
        <input
          ref="searchInput"
          v-model.trim="search"
          data-test="timezone-search"
          class="timezone-search"
          type="search"
          :aria-label="t('common.search')"
          :placeholder="t('common.search')"
        />
        <div class="timezone-options" role="radiogroup" :aria-label="t(labelKey)">
          <label v-for="zone in filteredZones" :key="zone" class="timezone-option">
            <span>{{ zoneLabel(zone) }}</span
            ><input v-model="draft" type="radio" :name="radioGroup" :value="zone" />
          </label>
          <p v-if="!filteredZones.length" role="status">{{ t('list.emptyAlt') }}</p>
        </div>
      </section>
    </NutPopup>
  </section>
</template>

<script setup lang="ts">
  import { computed, ref, useId } from 'vue';
  import { Cell as NutCell, Popup as NutPopup } from '@nutui/nutui';
  import '@nutui/nutui/dist/packages/cell/index.css';
  import '@nutui/nutui/dist/packages/popup/index.css';
  import '@nutui/nutui/dist/packages/overlay/index.css';
  import { useI18n } from 'vue-i18n';
  import { trapSheetTab } from './timezone-sheet';

  const FALLBACK_ZONES = ['UTC', 'Asia/Shanghai', 'Asia/Taipei', 'Asia/Tokyo', 'Europe/London', 'America/New_York', 'America/Los_Angeles'];

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      labelKey?: string;
      hintKey?: string;
      disabled?: boolean;
    }>(),
    {
      labelKey: 'strategy.timeZone',
      hintKey: 'strategy.timeZoneHint',
      disabled: false,
    },
  );
  const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>();
  const { locale, t } = useI18n();
  const search = ref('');
  const visible = ref(false);
  const draft = ref(props.modelValue);
  const trigger = ref<HTMLButtonElement>();
  const searchInput = ref<HTMLInputElement>();
  const radioGroup = useId();

  function open() {
    if (props.disabled) return;
    search.value = '';
    draft.value = props.modelValue;
    visible.value = true;
  }

  function confirm() {
    if (props.disabled || !filteredZones.value.includes(draft.value)) return;
    emit('update:modelValue', draft.value);
    visible.value = false;
  }

  const zones = computed(() => {
    const supportedValuesOf = (
      Intl as typeof Intl & {
        supportedValuesOf?: (key: 'timeZone') => string[];
      }
    ).supportedValuesOf;
    const supported = supportedValuesOf?.('timeZone') ?? [];
    return [...new Set([...supported, ...FALLBACK_ZONES, props.modelValue])].filter(isRegionTimeZone).sort();
  });

  const filteredZones = computed(() => {
    const needle = normalize(search.value);
    if (!needle) return zones.value;
    return zones.value.filter((zone) => normalize(`${zone} ${zoneLabel(zone)}`).includes(needle));
  });

  function isRegionTimeZone(zone: string): boolean {
    return zone === 'UTC' || (zone.includes('/') && !zone.startsWith('Etc/GMT') && !/[+-]\d/.test(zone));
  }

  function normalize(value: string): string {
    return value.toLocaleLowerCase().replaceAll('_', ' ').replaceAll('-', ' ');
  }

  function zoneLabel(zone: string): string {
    try {
      const name = new Intl.DateTimeFormat(locale.value, {
        timeZone: zone,
        timeZoneName: 'longGeneric',
      })
        .formatToParts(new Date())
        .find((part) => part.type === 'timeZoneName')?.value;
      return name && name !== zone ? `${zone} · ${name}` : zone;
    } catch {
      return zone;
    }
  }
</script>

<style scoped lang="scss">
  @use './timezone-sheet.scss';

  .timezone-field {
    width: 100%;
    margin: 0.75rem 0;
    background: #fff;
    border-radius: 0.75rem;
  }

  .timezone-hint {
    display: block;
    padding: 0 1rem 0.75rem;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: #666;
  }
</style>
