<template>
  <ol class="wizard-steps" :aria-label="labels[step - 1]">
    <li
      v-for="(label, index) in labels"
      :key="index"
      :class="{ complete: index + 1 < step, current: index + 1 === step }"
      :aria-current="index + 1 === step ? 'step' : undefined"
    >
      <span class="step-dot" aria-hidden="true">{{ index + 1 < step ? '✓' : index + 1 }}</span>
      <span class="step-label">{{ label }}</span>
    </li>
  </ol>
</template>
<script setup lang="ts">
  defineProps<{ step: number; labels: string[] }>();
</script>
<style scoped lang="scss">
  .wizard-steps {
    display: flex;
    padding: 0;
    margin: 0 0 2rem;
    list-style: none;
  }

  li {
    position: relative;
    flex: 1;
    min-width: 0;
    color: #6e746f;
    text-align: center;
  }

  li:not(:last-child)::after {
    position: absolute;
    top: 1rem;
    right: calc(-50% + 1.125rem);
    left: calc(50% + 1.125rem);
    content: '';
    border-top: 2px dotted #d5dad6;
  }

  .step-dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    font-weight: 600;
    background: #fff;
    border: 1px solid #d5dad6;
    border-radius: 50%;
  }

  .current .step-dot {
    color: #fff;
    background: #1989fa;
    border-color: #1989fa;
  }

  .complete .step-dot {
    color: #fff;
    background: #319f69;
    border-color: #319f69;
  }

  .step-label {
    display: block;
    padding: 0 0.125rem;
    margin-top: 0.5rem;
    font-size: 0.6875rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
</style>
