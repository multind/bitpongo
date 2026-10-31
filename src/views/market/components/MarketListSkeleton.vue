<template>
  <VanSkeleton class="market-skeleton" :loading="true" :row="0" aria-hidden="true">
    <template #template>
      <div class="skeleton-list" data-test="market-skeleton">
        <div v-for="index in rows" :key="index" class="skeleton-row">
          <div class="skeleton-identity">
            <span class="skeleton-block skeleton-avatar" />
            <span class="skeleton-name">
              <span class="skeleton-block skeleton-symbol" />
              <span class="skeleton-block skeleton-quote" />
            </span>
          </div>
          <span class="skeleton-block skeleton-trend" />
          <span class="skeleton-price">
            <span class="skeleton-block skeleton-value" />
            <span class="skeleton-block skeleton-change" />
          </span>
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
    { rows: 12 },
  );
</script>
<style scoped lang="scss">
  .market-skeleton {
    display: block;
    padding: 0;
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4rem minmax(6.25rem, 1fr);
    gap: 0.5rem;
    align-items: center;
    min-height: 5.25rem;
    border-bottom: 1px solid #eae4de;
  }

  .skeleton-identity {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    min-width: 0;
  }

  .skeleton-block {
    display: block;
    background: #eee8e2;
    border-radius: 0.5rem;
  }

  .skeleton-avatar {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
  }

  .skeleton-name {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.45rem;
    min-width: 0;
  }

  .skeleton-symbol {
    width: min(5.5rem, 70%);
    height: 0.95rem;
  }

  .skeleton-quote {
    width: 3rem;
    height: 0.7rem;
  }

  .skeleton-trend {
    width: 100%;
    height: 1.5rem;
  }

  .skeleton-price {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    align-items: flex-end;
    min-width: 0;
  }

  .skeleton-value {
    width: min(6rem, 100%);
    height: 1rem;
  }

  .skeleton-change {
    width: 3.25rem;
    height: 0.7rem;
  }

  @media (max-width: 350px) {
    .skeleton-row {
      grid-template-columns: minmax(0, 1fr) 2.5rem minmax(5.25rem, 1fr);
      gap: 0.35rem;
    }

    .skeleton-avatar {
      width: 2rem;
      height: 2rem;
    }

    .skeleton-identity {
      gap: 0.4rem;
    }
  }
</style>
