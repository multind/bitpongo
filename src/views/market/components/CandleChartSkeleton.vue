<template>
  <div class="chart-skeleton" role="status" :aria-label="label" data-test="candle-skeleton">
    <svg viewBox="0 0 640 600" aria-hidden="true">
      <g v-for="index in 5" :key="index">
        <line x1="8" :y1="20 + (index - 1) * 130" x2="550" :y2="20 + (index - 1) * 130" class="grid" />
        <rect x="556" :y="12 + (index - 1) * 130" width="62" height="14" rx="4" class="axis" />
      </g>
      <g v-for="bar in bars" :key="bar.x">
        <line :x1="bar.x" :x2="bar.x" :y1="bar.high" :y2="bar.low" class="wick" />
        <rect :x="bar.x - 4" :y="bar.top" width="8" :height="bar.height" rx="1" class="body" />
      </g>
    </svg>
  </div>
</template>
<script setup lang="ts">
  withDefaults(
    defineProps<{
      label?: string;
    }>(),
    { label: '' },
  );

  const bars = Array.from({ length: 28 }, (_, index) => {
    const x = 16 + index * 18.5;
    const base = 290 + Math.sin(index * 0.7) * 46;
    const high = base - 38 - (index % 4) * 9;
    const low = base + 38 + (index % 3) * 11;
    const open = base - 12;
    const close = base + 16;
    return { x, high, low, top: Math.min(open, close), height: Math.max(6, Math.abs(close - open)) };
  });
</script>
<style scoped>
  .chart-skeleton {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .grid {
    stroke: #e9e3dd;
    stroke-width: 1.5;
  }

  .axis {
    fill: #e9e3dd;
  }

  .wick {
    stroke: #d9d2cb;
    stroke-width: 2;
  }

  .body {
    fill: #d9d2cb;
  }

  .chart-skeleton::after {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: '';
    background: linear-gradient(100deg, transparent 20%, rgb(255 255 255 / 55%) 50%, transparent 80%);
    background-size: 220% 100%;
    animation: chart-shimmer 1.4s ease-in-out infinite;
  }

  @keyframes chart-shimmer {
    from {
      background-position: 180% 0;
    }

    to {
      background-position: -80% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chart-skeleton::after {
      animation: none;
    }
  }
</style>
