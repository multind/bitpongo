<template>
  <div class="dca-chart">
    <svg v-if="points.length > 1" class="chart-svg" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" role="img" :aria-label="ariaLabel">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.22" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <line
        v-for="i in 3"
        :key="i"
        :x1="PAD_X"
        :x2="WIDTH - PAD_X"
        :y1="gridY(i)"
        :y2="gridY(i)"
        stroke="#f0ece8"
        stroke-width="1"
        stroke-dasharray="3 5"
      />
      <line v-if="zeroY !== null" :x1="PAD_X" :x2="WIDTH - PAD_X" :y1="zeroY" :y2="zeroY" stroke="#e3ddd6" stroke-width="1.2" />
      <path :d="areaPath" :fill="`url(#${gradientId})`" />
      <path :d="linePath" fill="none" :stroke="color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle :cx="lastPoint.x" :cy="lastPoint.y" r="3.5" :fill="color" stroke="#fff" stroke-width="2" />
    </svg>
    <p v-else class="chart-empty">{{ emptyText }}</p>
    <div v-if="points.length > 1 && displayLabels.length" class="chart-axis">
      <span v-for="(label, index) in displayLabels" :key="`${label}-${index}`">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    values: number[];
    labels: string[];
    color?: string;
    ariaLabel?: string;
    emptyText?: string;
  }

  interface Point {
    x: number;
    y: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    color: '#2f9e67',
    ariaLabel: 'Return curve',
    emptyText: 'No return curve yet',
  });

  const WIDTH = 320;
  const HEIGHT = 128;
  const PAD_X = 4;
  const PAD_TOP = 10;
  const PAD_BOTTOM = 8;
  const gradientId = `dca-gradient-${Math.random().toString(36).slice(2, 9)}`;

  const cleanValues = computed(() => props.values.filter((value) => Number.isFinite(value)));

  const range = computed(() => {
    const values = cleanValues.value;
    if (!values.length) return { low: 0, high: 0 };
    return { low: Math.min(0, ...values), high: Math.max(0, ...values) };
  });

  function yFor(value: number) {
    const { low, high } = range.value;
    if (high === low) return HEIGHT - PAD_BOTTOM;
    return PAD_TOP + ((high - value) / (high - low)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
  }

  const points = computed<Point[]>(() => {
    const values = cleanValues.value;
    if (values.length < 2) return [];
    return values.map((value, index) => ({
      x: PAD_X + (index * (WIDTH - PAD_X * 2)) / (values.length - 1),
      y: yFor(value),
    }));
  });

  function buildSmoothPath(pts: Point[]) {
    if (!pts.length) return '';
    let path = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let index = 0; index < pts.length - 1; index += 1) {
      const previous = pts[index - 1] ?? pts[index];
      const current = pts[index];
      const next = pts[index + 1];
      const afterNext = pts[index + 2] ?? next;
      const c1x = current.x + (next.x - previous.x) / 6;
      const c1y = current.y + (next.y - previous.y) / 6;
      const c2x = next.x - (afterNext.x - current.x) / 6;
      const c2y = next.y - (afterNext.y - current.y) / 6;
      path += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    }
    return path;
  }

  const linePath = computed(() => buildSmoothPath(points.value));

  const areaPath = computed(() => {
    const pts = points.value;
    if (pts.length < 2) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${linePath.value} L ${last.x.toFixed(2)} ${HEIGHT - PAD_BOTTOM} L ${first.x.toFixed(2)} ${HEIGHT - PAD_BOTTOM} Z`;
  });

  const lastPoint = computed(() => points.value[points.value.length - 1] ?? { x: PAD_X, y: HEIGHT - PAD_BOTTOM });

  const zeroY = computed(() => {
    const { low, high } = range.value;
    if (low >= 0 || high <= 0) return null;
    return yFor(0);
  });

  const displayLabels = computed(() => {
    const labels = props.labels.filter(Boolean);
    if (labels.length <= 3) return labels;
    return [labels[0], labels[Math.floor((labels.length - 1) / 2)], labels[labels.length - 1]];
  });

  function gridY(index: number) {
    return PAD_TOP + ((HEIGHT - PAD_TOP - PAD_BOTTOM) * index) / 4;
  }
</script>

<style scoped lang="scss">
  .dca-chart {
    margin-top: 0.75rem;
  }

  .chart-svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .chart-axis {
    display: flex;
    justify-content: space-between;
    margin-top: 0.15rem;
    font-size: 0.6rem;
    color: #9a8d82;
  }

  .chart-empty {
    padding: 0.9rem 0;
    margin: 0;
    font-size: 0.7rem;
    color: #9a8d82;
    text-align: center;
  }
</style>
