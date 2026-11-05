<template>
  <div class="plaza-visibility">
    <div class="plaza-visibility__text">
      <div class="plaza-visibility__title">{{ t('presets.visibilityTitle') }}</div>
      <div class="plaza-visibility__hint">{{ t('presets.visibilityHint') }}</div>
    </div>
    <nut-switch :model-value="visible" :loading="busy" :disabled="!loaded" @change="onChange" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { showToast } from '@nutui/nutui';
  import { getPresetVisibility, updatePresetVisibility, type PresetType } from '@/api/presets';

  const props = defineProps<{ type: PresetType; strategyId: number | string }>();
  const { t } = useI18n();
  const visible = ref(false);
  const loaded = ref(false);
  const busy = ref(false);

  async function load() {
    loaded.value = false;
    try {
      visible.value = (await getPresetVisibility(props.type, props.strategyId)).public;
      loaded.value = true;
    } catch {
      // Leave the switch disabled; the strategy stays private by default.
    }
  }

  async function onChange(value: boolean | string | number) {
    const next = Boolean(value);
    busy.value = true;
    try {
      visible.value = (await updatePresetVisibility(props.type, props.strategyId, next)).public;
    } catch {
      showToast.fail(t('common.saveFailed'));
    } finally {
      busy.value = false;
    }
  }

  onMounted(load);
  watch(() => [props.type, props.strategyId], load);
</script>

<style scoped>
  .plaza-visibility {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
  }
  .plaza-visibility__title {
    font-size: 15px;
  }
  .plaza-visibility__hint {
    margin-top: 4px;
    font-size: 12px;
    opacity: 0.65;
  }
</style>
