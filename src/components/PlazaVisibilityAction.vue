<template>
  <button type="button" class="plaza-action" :disabled="!loaded || busy" :aria-busy="busy" @click="onAction">
    {{ t(visible ? 'presets.withdrawAction' : 'presets.publishAction') }}
  </button>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { showDialog, showToast } from '@nutui/nutui';
  import { getPresetVisibility, updatePresetVisibility, type PresetType } from '@/api/presets';

  const props = defineProps<{ type: PresetType; strategyId: number | string }>();
  const { t } = useI18n();
  const visible = ref(false);
  const loaded = ref(false);
  const busy = ref(false);
  let generation = 0;

  watch(
    () => [props.type, props.strategyId] as const,
    async ([type, id]) => {
      const current = ++generation;
      loaded.value = false;
      busy.value = false;
      visible.value = false;
      try {
        const result = await getPresetVisibility(type, id);
        if (current !== generation) return;
        visible.value = result.public;
        loaded.value = true;
      } catch {
        // Do not offer to publish when the actual server state is unknown.
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    generation++;
  });

  async function save(next: boolean, current: number) {
    if (current !== generation || busy.value || !loaded.value || visible.value === next) return;
    busy.value = true;
    try {
      const result = await updatePresetVisibility(props.type, props.strategyId, next);
      if (current === generation) visible.value = result.public;
    } catch {
      if (current === generation) showToast.fail(t('common.saveFailed'));
    } finally {
      if (current === generation) busy.value = false;
    }
  }

  function onAction() {
    if (!loaded.value || busy.value) return;
    const current = generation;
    if (visible.value) {
      void save(false, current);
      return;
    }
    showDialog({
      title: t('presets.visibilityTitle'),
      content: t('presets.visibilityHint'),
      onOk: () => save(true, current),
    });
  }
</script>

<style scoped>
  .plaza-action {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    padding: 4px 8px;
    font: inherit;
    font-size: 14px;
    color: #1766b3;
    overflow-wrap: anywhere;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 24px;
  }

  .plaza-action:disabled {
    opacity: 0.5;
  }
</style>
