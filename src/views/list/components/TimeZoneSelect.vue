<template>
  <section class="timezone-field">
    <label class="timezone-label" for="strategy-timezone">{{ t(labelKey) }}</label>
    <input v-model.trim="search" data-test="timezone-search" class="timezone-search" type="search" :placeholder="t('common.search')" />
    <select id="strategy-timezone" data-test="timezone-select" class="timezone-select" :value="modelValue" @change="selectTimeZone">
      <option v-for="zone in filteredZones" :key="zone" :value="zone">{{ zoneLabel(zone) }}</option>
    </select>
    <small class="timezone-hint">{{ t(hintKey) }}</small>
  </section>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useI18n } from 'vue-i18n';

  const FALLBACK_ZONES = ['UTC', 'Asia/Shanghai', 'Asia/Taipei', 'Asia/Tokyo', 'Europe/London', 'America/New_York', 'America/Los_Angeles'];

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      labelKey?: string;
      hintKey?: string;
    }>(),
    {
      labelKey: 'strategy.timeZone',
      hintKey: 'strategy.timeZoneHint',
    },
  );
  const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>();
  const { locale, t } = useI18n();
  const search = ref('');

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

  function selectTimeZone(event: Event): void {
    emit('update:modelValue', (event.target as HTMLSelectElement).value);
  }
</script>

<style scoped>
  .timezone-field {
    display: grid;
    gap: 8px;
    padding: 14px 20px;
    margin: 10px 0;
    background: #fff;
    border-radius: 12px;
  }

  .timezone-label {
    font-size: 15px;
    color: #222;
  }

  .timezone-search,
  .timezone-select {
    box-sizing: border-box;
    width: 100%;
    min-height: 40px;
    padding: 0 10px;
    color: #333;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  .timezone-hint {
    color: #777;
  }
</style>
