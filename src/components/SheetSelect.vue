<template>
  <section>
    <button
      ref="trigger"
      v-bind="$attrs"
      type="button"
      class="timezone-trigger"
      aria-haspopup="dialog"
      :aria-expanded="visible"
      :aria-disabled="Boolean(disabled)"
      @click="open"
    >
      <NutCell :title="label" :desc="selectedLabel" is-link />
    </button>
    <NutPopup v-model:visible="visible" position="bottom" round @opened="focusSheet" @closed="trigger?.focus()">
      <section
        class="timezone-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        @keydown.tab="trapSheetTab"
        @keydown.esc="visible = false"
      >
        <header class="timezone-toolbar">
          <button ref="cancelButton" type="button" data-test="sheet-cancel" @click="visible = false">{{ t('common.cancel') }}</button>
          <h3>{{ label }}</h3>
          <button
            type="button"
            data-test="sheet-confirm"
            :disabled="disabled || !filtered.some((option) => option.value === draft)"
            @click="confirm"
            >{{ t('common.confirm') }}</button
          >
        </header>
        <input
          v-if="searchable"
          ref="searchInput"
          v-model.trim="search"
          class="timezone-search"
          type="search"
          :aria-label="t('common.search')"
          :placeholder="t('common.search')"
        />
        <div class="timezone-options" role="radiogroup" :aria-label="label">
          <label v-for="option in filtered" :key="option.value" class="timezone-option"
            ><span>{{ option.label }}</span
            ><input v-model="draft" type="radio" :name="group" :value="option.value"
          /></label>
          <p v-if="!filtered.length" role="status">{{ t('list.emptyAlt') }}</p>
        </div>
      </section>
    </NutPopup>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, useId } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Cell as NutCell, Popup as NutPopup } from '@nutui/nutui';
  import '@nutui/nutui/dist/packages/cell/index.css';
  import '@nutui/nutui/dist/packages/popup/index.css';
  import '@nutui/nutui/dist/packages/overlay/index.css';
  import { trapSheetTab } from '@/views/list/components/timezone-sheet';
  defineOptions({ inheritAttrs: false });
  const props = defineProps<{
    modelValue: string;
    label: string;
    options: { value: string; label: string }[];
    searchable?: boolean;
    disabled?: boolean;
  }>();
  const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
  const { t } = useI18n();
  const visible = ref(false),
    search = ref(''),
    draft = ref(props.modelValue);
  const trigger = ref<HTMLButtonElement>(),
    searchInput = ref<HTMLInputElement>(),
    cancelButton = ref<HTMLButtonElement>();
  const group = useId();
  const selectedLabel = computed(() => props.options.find((option) => option.value === props.modelValue)?.label ?? props.modelValue);
  const filtered = computed(() =>
    props.options.filter((option) => `${option.value} ${option.label}`.toLowerCase().includes(search.value.toLowerCase())),
  );
  function open() {
    if (props.disabled) return;
    search.value = '';
    draft.value = props.modelValue;
    visible.value = true;
  }
  function focusSheet() {
    (searchInput.value ?? cancelButton.value)?.focus();
  }
  function confirm() {
    if (props.disabled || !filtered.value.some((option) => option.value === draft.value)) return;
    emit('update:modelValue', draft.value);
    visible.value = false;
  }
</script>
<style scoped lang="scss">
  @use '../views/list/components/timezone-sheet.scss';

  .timezone-sheet .timezone-option {
    display: flex;
    margin: 0;
    font-weight: normal;
  }

  .timezone-sheet .timezone-option input[type='radio'] {
    width: 1.125rem;
    height: 1.125rem;
    min-height: 0;
    padding: 0;
    margin: 0;
  }

  .timezone-trigger[aria-disabled='true'] {
    cursor: default;
    opacity: 0.6;
  }
</style>
