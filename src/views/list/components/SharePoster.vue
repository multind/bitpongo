<template>
  <div class="share-content">
    <article id="capture" class="poster">
      <header class="poster-header">
        <div class="brand"><img src="../../../assets/logo.png" alt="" /><strong>Bitpongo</strong></div>
        <div class="date">{{ date }}<br />{{ time }}</div>
      </header>
      <div class="author"
        ><span class="author-avatar"><Avatar /></span><span>{{ username }}</span></div
      >
      <section class="return-block">
        <p>{{ t('list.totalReturnRate') }}</p>
        <strong data-test="share-return" :class="returnClass">{{
          plan?.total_ratio == null ? '—' : `${displayValue(plan.total_ratio)}%`
        }}</strong>
      </section>
      <section class="strategy-block">
        <div class="coins"
          ><img v-for="coin in (plan?.coins || []).slice(0, 2)" :key="coin.symbol" :src="coinIcon?.(coin.symbol)" :alt="coin.symbol"
        /></div>
        <div class="strategy-text"
          ><strong>{{ plan?.strategy?.name }}</strong
          ><span>{{ t(plan?.status === 'stop' ? 'list.paused' : 'list.active') }}</span></div
        >
      </section>
      <dl class="poster-stats">
        <div
          ><dt>{{ t('planCard.avgPrice') }}</dt
          ><dd>{{ average || '—' }}</dd></div
        >
        <div
          ><dt>{{ t('planCard.frequencyTriggered') }}</dt
          ><dd>{{ plan?.strategy?.frequency || '—' }}</dd></div
        >
        <div
          ><dt>{{ t('planCard.totalReturn') }}</dt
          ><dd :class="returnClass">{{ displayValue(plan?.total_revenue) }} USDT</dd></div
        >
      </dl>
    </article>
    <button type="button" class="download" @click="$emit('download')"
      ><span class="download-icon"><Download width="20px" height="20px" /></span><span>{{ t('common.download') }}</span></button
    >
  </div>
</template>
<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Download } from '@nutui/icons-vue';
  import Avatar from '@/views/member/profile/Avatar.vue';
  const props = defineProps<{
    plan: any;
    username: string;
    average: string;
    date: string;
    time: string;
    coinIcon?: (symbol: string) => string;
  }>();
  defineEmits<{ download: [] }>();
  const { t } = useI18n();
  const returnClass = computed(() => (Number(props.plan?.total_ratio) < 0 ? 'negative' : 'positive'));
  const displayValue = (value: unknown) => (value == null || value === '' ? '—' : String(value));
</script>
<style scoped lang="scss">
  .share-content {
    padding: 0 1rem max(1rem, env(safe-area-inset-bottom));
  }

  .poster {
    padding: 1.25rem;
    color: #29382f;
    overflow-wrap: anywhere;
    background: #fffaf5;
    border: 1px solid #f2e5da;
    border-radius: 1.25rem;
  }

  .poster-header {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
  }

  .brand {
    display: flex;
    gap: 0.625rem;
    align-items: center;
    font-size: 1rem;
  }

  .brand img {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
  }

  .date {
    font-size: 0.7rem;
    line-height: 1.5;
    color: #8a8681;
    text-align: right;
  }

  .author {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin: 1rem 0 0;
    font-size: 0.75rem;
    color: #777;
  }

  .author-avatar {
    display: block;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
  }

  .return-block {
    padding: 1.75rem 0 1.5rem;
  }

  .return-block p {
    margin: 0 0 0.4rem;
    font-size: 0.875rem;
    color: #817c77;
  }

  .return-block strong {
    font-size: 2.5rem;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .positive {
    color: #198754;
  }

  .negative {
    color: #d24c41;
  }

  .strategy-block {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.875rem;
    background: #fff;
    border-radius: 0.875rem;
  }

  .coins {
    display: flex;
    flex-shrink: 0;
  }

  .coins img {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
  }

  .coins img + img {
    margin-left: -0.5rem;
  }

  .strategy-text {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    font-size: 0.875rem;
  }

  .strategy-text span {
    font-size: 0.75rem;
    color: #8a8681;
  }

  .poster-stats {
    margin: 1rem 0 0;
    font-size: 0.8125rem;
  }

  .poster-stats div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid #eee5dd;
  }

  .poster-stats div:last-child {
    border: 0;
  }

  .poster-stats dt {
    color: #817c77;
  }

  .poster-stats dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }

  .download {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    align-items: center;
    justify-content: center;
    min-width: 5rem;
    padding: 0;
    margin: 1rem auto 0;
    font: inherit;
    font-size: 0.8125rem;
    color: #4a514b;
    cursor: pointer;
    background: transparent;
    border: 0;
  }

  .download-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    color: #1989fa;
    background: #e8f3ff;
    border-radius: 50%;
  }
</style>
