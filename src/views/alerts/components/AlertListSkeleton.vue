<template>
  <VanSkeleton class="alert-skeleton" :loading="true" :row="0" aria-hidden="true">
    <template #template>
      <div class="skeleton-list" data-test="alert-skeleton">
        <div v-for="index in rows" :key="index" class="skeleton-entry">
          <div class="skeleton-content">
            <div class="skeleton-heading">
              <span class="skeleton-block skeleton-title" />
              <span class="skeleton-block skeleton-date" />
            </div>
            <div class="skeleton-summary">
              <span class="skeleton-block skeleton-symbol" />
              <span class="skeleton-block skeleton-badge" />
            </div>
            <span class="skeleton-block skeleton-condition" />
          </div>
          <span class="skeleton-block skeleton-more" />
        </div>
      </div>
    </template>
  </VanSkeleton>
</template>
<script setup lang="ts">
  import { Skeleton as VanSkeleton } from 'vant';

  withDefaults(
    defineProps<{
      rows?: number;
    }>(),
    { rows: 8 },
  );
</script>
<style scoped lang="scss">
  .alert-skeleton {
    display: block;
    padding: 0;
  }

  .skeleton-entry {
    box-sizing: border-box;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    min-height: 6rem;
    padding: 1rem 0.5rem;
    background: var(--app-page-background, #fffaf5);
    border-bottom: 1px solid #eae4de;
  }

  .skeleton-content {
    flex: 1;
    min-width: 0;
  }

  .skeleton-heading {
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
    justify-content: space-between;
  }

  .skeleton-block {
    display: block;
    background: #eee8e2;
    border-radius: 0.5rem;
  }

  .skeleton-title {
    width: 55%;
    height: 0.95rem;
  }

  .skeleton-date {
    flex-shrink: 0;
    width: 3.5rem;
    height: 0.65rem;
  }

  .skeleton-summary {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    margin-top: 0.6rem;
  }

  .skeleton-symbol {
    width: 3.25rem;
    height: 0.8rem;
  }

  .skeleton-badge {
    width: 2.5rem;
    height: 0.9rem;
    border-radius: 0.3rem;
  }

  .skeleton-condition {
    width: 70%;
    height: 0.65rem;
    margin-top: 0.6rem;
  }

  .skeleton-more {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
  }
</style>
