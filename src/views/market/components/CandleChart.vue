<template>
  <div class="candle-chart">
    <svg :viewBox="`0 0 640 ${chartHeight}`" role="img" :aria-label="label" @click="selectPrice">
      <g v-for="(price, i) in levels" :key="i">
        <line x1="8" :y1="20 + (i * plotHeight) / 4" x2="550" :y2="20 + (i * plotHeight) / 4" stroke="#e5e7eb" />
        <text x="556" :y="24 + (i * plotHeight) / 4" fill="#666" font-size="12">{{ number(price) }}</text>
      </g>
      <g v-for="(candle, i) in visible" :key="candle.openTime" data-test="candle" :stroke="color(candle)">
        <title>
          {{ formatInstant(new Date(candle.openTime).toISOString()) }} · {{ candle.open }} / {{ candle.high }} / {{ candle.low }} /
          {{ candle.close }}
        </title>
        <line :x1="x(i)" :x2="x(i)" :y1="y(Number(candle.high))" :y2="y(Number(candle.low))" />
        <rect
          :x="x(i) - width / 2"
          :y="Math.min(y(Number(candle.open)), y(Number(candle.close)))"
          :width="width"
          :height="Math.max(1, Math.abs(y(Number(candle.open)) - y(Number(candle.close))))"
          :fill="color(candle)"
        />
      </g>
      <line
        v-if="selectedPrice != null"
        x1="8"
        x2="550"
        :y1="y(selectedPrice)"
        :y2="y(selectedPrice)"
        stroke="#1989fa"
        stroke-dasharray="6 4"
      />
      <text v-if="visible[0]" x="8" :y="chartHeight - 20" fill="#666" font-size="12">
        {{ formatInstant(new Date(visible[0].openTime).toISOString()) }}
      </text>
      <text v-if="visible.at(-1)" x="550" :y="chartHeight - 2" text-anchor="end" fill="#666" font-size="12">
        {{ formatInstant(new Date(visible.at(-1)!.openTime).toISOString()) }}
      </text>
    </svg>
  </div>
</template>
<script setup lang="ts">
  import { computed } from 'vue';
  import type { MarketCandle } from '@/api/market';
  import { formatInstant } from '@/utils/timeUtils';
  import { chartPriceAt } from '../chart-price';
  const props = defineProps<{
    candles: MarketCandle[];
    label: string;
    colorMode?: 'GREEN_UP' | 'RED_UP';
    height?: number;
    pickingPrice?: boolean;
    selectedPrice?: number | null;
  }>();
  const emit = defineEmits<{ selectPrice: [price: number] }>();
  const chartHeight = computed(() => props.height ?? 320);
  const plotHeight = computed(() => chartHeight.value - 80);
  const color = (candle: MarketCandle) =>
    Number(candle.close) >= Number(candle.open) === (props.colorMode !== 'RED_UP') ? '#16a34a' : '#dc2626';
  const visible = computed(() => props.candles.slice(-80));
  const range = computed(() => {
    const low = Math.min(...visible.value.map((c) => Number(c.low)));
    const high = Math.max(...visible.value.map((c) => Number(c.high)));
    const padding = Math.max((high - low) * 0.05, high * 0.0001, 0.00000001);
    return { low: low - padding, high: high + padding };
  });
  const levels = computed(() => Array.from({ length: 5 }, (_, i) => range.value.high - ((range.value.high - range.value.low) * i) / 4));
  const width = computed(() => Math.min(12, (500 / Math.max(1, visible.value.length)) * 0.7));
  const x = (i: number) => 12 + (i * 530) / Math.max(1, visible.value.length - 1);
  const y = (price: number) => 20 + ((range.value.high - price) / (range.value.high - range.value.low)) * plotHeight.value;
  const number = (value: number) => value.toLocaleString(undefined, { maximumSignificantDigits: 6 });
  function selectPrice(event: MouseEvent) {
    if (!props.pickingPrice) return;
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const price = chartPriceAt(event.clientY, rect.top, rect.height, chartHeight.value, range.value.low, range.value.high);
    if (price != null) emit('selectPrice', price);
  }
</script>
<style scoped>
  .candle-chart {
    width: 100%;
    overflow: hidden;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
