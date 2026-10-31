<template>
  <div class="plan-container">
    <div class="plan-head">
      <div v-if="plan.coins?.length" class="plan-coins">
        <img
          v-for="(coin, index) in plan.coins.slice(0, 2)"
          :key="coin.symbol"
          class="plan-coin"
          :class="{ stacked: index !== 0 }"
          :src="getCoinIconUrl(coin.symbol)"
          :alt="coin.symbol"
        />
      </div>
      <img v-else class="plan-coin" :src="getCoinIconUrl('BTC')" alt="" />
      <div class="plan-title">
        <strong>{{ plan.strategy.name }}</strong>
        <span>{{ t('details.dcaStrategyTag') }}</span>
      </div>
      <div class="plan-head-right">
        <button type="button" class="plan-share" :aria-label="t('planCard.share')" @click="handleCoinClick('shareButton')">
          <Share />
        </button>
        <span class="plan-status" :class="{ active: plan.status !== 'stop' }">
          {{ plan.status === 'stop' ? t('planCard.paused') : t('list.active') }}
        </span>
      </div>
    </div>
    <p class="plan-runtime">{{ runTimeText }}</p>
    <dl class="plan-stats">
      <div>
        <dt>{{ t('planCard.totalInvested') }}</dt>
        <dd>{{ plan.total_funds }}</dd>
      </div>
      <div>
        <dt>{{ t('planCard.totalReturn') }}</dt>
        <dd>{{ plan.total_revenue }} ({{ plan.total_ratio }}%)</dd>
      </div>
      <div>
        <dt>{{ t('planCard.coin') }}</dt>
        <dd class="plan-link" @click="handleCoinClick('coinProportion')">{{ coinProportionText }}</dd>
      </div>
      <div>
        <dt>{{ t('planCard.frequencyTriggered') }}</dt>
        <dd>{{ plan.strategy.frequency }} / {{ plan.triggered_count }}</dd>
      </div>
      <div>
        <dt>{{ t('planCard.perCycleAmount') }}</dt>
        <dd>{{ plan.strategy.instalment }}</dd>
      </div>
      <div>
        <dt>{{ t('common.exchange') }}</dt>
        <dd>Binance</dd>
      </div>
      <div>
        <dt>{{ t('planCard.avgPrice') }}</dt>
        <dd class="plan-link" @click="handleCoinClick('coinAverage')">{{ coinAverageText }}</dd>
      </div>
      <div>
        <dt>{{ t('planCard.nextBuyTime') }}</dt>
        <dd data-test="next-buy-time">{{ nextBuyTimeText.primary }}</dd>
        <dd v-if="nextBuyTimeText.secondary" class="plan-secondary">{{ nextBuyTimeText.secondary }}</dd>
      </div>
    </dl>
    <DcaChart :values="chartValues" :labels="chartLabels" :aria-label="t('planCard.chartLabel')" :empty-text="t('planCard.noChartData')" />
    <div class="plan-actions">
      <button type="button" class="plan-action" @click="handleClick(plan.status === 'active' ? 'stop' : 'active')">
        {{ plan.status === 'active' ? t('planCard.pause') : t('planCard.start') }}
      </button>
      <button type="button" class="plan-action danger" @click="handleClick('close')">{{ t('planCard.stop') }}</button>
      <button type="button" class="plan-action" @click="goToDetails">{{ t('planCard.details') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Share } from '@nutui/icons-vue';
  import { useRouter } from 'vue-router';

  import { calculateRunTime, formatScheduleInstant, parseInstant } from '@/utils/timeUtils';
  import { displayTimeZone } from '@/mobile/app-context';
  import { updatePlanStatus } from '@/api';
  import DcaChart from './DcaChart.vue';

  interface Props {
    plan: any;
  }

  // 定义 emits
  interface Emits {
    (e: 'show-popup', plan: any, type: string): void;
    (e: 'update-status'): void;
  }

  const { t } = useI18n();
  const emit = defineEmits<Emits>(); // 添加 emit 定义

  const props = defineProps<Props>();
  const router = useRouter();

  const defaultAvatar = new URL('../../../assets/coins/BTC.png', import.meta.url).href;
  // 获取币种图标路径
  const getCoinIconUrl = (symbol: string) => {
    try {
      return new URL(`../../../assets/coins/${symbol}.png`, import.meta.url).href;
    } catch (error) {
      // 如果找不到对应图标，则使用默认 BTC 图标
      console.log(error);
      return defaultAvatar;
    }
  };

  const goToDetails = () => {
    router.push({ path: '/details', query: { planId: props.plan.id } });
  };

  // 计算图表标签
  const chartLabels = computed(() => {
    try {
      if (!props.plan?.snapshots || props.plan.snapshots.length === 0) {
        return [''];
      }

      // 提取 snapshots 中的 created_at 属性并格式化
      return props.plan.snapshots.map((snapshot: any) => {
        const date = parseInstant(snapshot.created_at).setZone(displayTimeZone());
        const day = String(date.day).padStart(2, '0');
        const hour = String(date.hour).padStart(2, '0');
        return `${day}/${hour}:00`;
      });
    } catch (error) {
      console.error('生成图表标签出错:', error);
      return [''];
    }
  });

  const chartValues = computed(() => (props.plan?.snapshots ?? []).map((snapshot: any) => Number(snapshot.value)));

  // 计算运行时间文本
  const runTimeText = computed(() => {
    return calculateRunTime(props.plan?.created_at);
  });

  // 格式化下次买入时间
  const nextBuyTimeText = computed(() => {
    const nextTime = props.plan?.next_time;
    if (!nextTime) return { primary: '' };
    const scheduleZone = props.plan?.strategy?.schedule_timezone || 'UTC';
    return formatScheduleInstant(nextTime, scheduleZone, displayTimeZone());
  });

  // 币种 | 目标比例
  const coinProportionText = computed(() => {
    try {
      let coinProportion = '';
      if (props.plan.coins && props.plan.coins.length > 0) {
        if (props.plan.coins.length <= 2) {
          // 币种数量不超过2个，全部显示
          props.plan.coins.forEach((coin: any) => {
            coinProportion += `${coin.symbol} ${coin.proportion}%, `;
          });
        } else {
          // 币种数量超过2个，只显示前两个并加上省略号
          for (let i = 0; i < 2; i++) {
            const coin = props.plan.coins[i];
            coinProportion += `${coin.symbol} ${coin.proportion}%, `;
          }
          coinProportion += '...';
        }
      }
      return coinProportion.trim();
    } catch (error) {
      console.error('计算 币种 | 目标比例 出错:', error);
      return '';
    }
  });

  // 币种 | 均价
  const coinAverageText = computed(() => {
    try {
      let coinAverage = '';
      if (props.plan.coins && props.plan.coins.length > 0) {
        if (props.plan.coins.length <= 2) {
          // 币种数量不超过2个，全部显示
          props.plan.coins.forEach((coin: any) => {
            coinAverage += `${coin.symbol}, ${coin.average || 0} `;
          });
        } else {
          // 币种数量超过2个，只显示前两个并加上省略号
          for (let i = 0; i < 2; i++) {
            const coin = props.plan.coins[i];
            coinAverage += `${coin.symbol} ${coin.average || 0}, `;
          }
          coinAverage += '...';
        }
      }
      return coinAverage.trim();
    } catch (error) {
      console.error('计算 币种 | 均价 出错:', error);
      return '';
    }
  });

  const handleCoinClick = (type: string) => {
    // 发送事件给父组件
    emit('show-popup', props.plan, type);
  };

  const handleClick = (newStatus: string) => {
    updatePlanStatus(props.plan?.id, newStatus)
      .then(() => {
        emit('update-status');
      })
      .catch((error) => {
        console.error('更新计划状态失败:', error);
      });
  };
</script>

<style lang="scss" scoped>
  .plan-container {
    padding: 1rem;
    margin-bottom: 0.75rem;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .plan-head {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }

  .plan-coins {
    display: flex;
    flex-shrink: 0;
  }

  .plan-coin {
    flex-shrink: 0;
    width: 2.2rem;
    height: 2.2rem;
    object-fit: cover;
    border: 2px solid #fff;
    border-radius: 50%;
  }

  .plan-coin.stacked {
    margin-left: -0.6rem;
  }

  .plan-title {
    flex: 1;
    min-width: 0;
  }

  .plan-title strong {
    display: block;
    font-size: 0.9rem;
    overflow-wrap: anywhere;
  }

  .plan-title span {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.65rem;
    color: #9a8d82;
  }

  .plan-head-right {
    display: flex;
    flex-shrink: 0;
    gap: 0.4rem;
    align-items: center;
  }

  .plan-share {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    color: #615a53;
    background: transparent;
    border: 0;
    border-radius: 50%;
  }

  .plan-share svg {
    width: 1rem;
    height: 1rem;
  }

  .plan-status {
    flex-shrink: 0;
    padding: 0.15rem 0.4rem;
    font-size: 0.65rem;
    color: #81766b;
    background: #eee8e2;
    border-radius: 0.3rem;
  }

  .plan-status.active {
    color: #328642;
    background: #e7f4e8;
  }

  .plan-runtime {
    margin: 0.55rem 0 0;
    font-size: 0.7rem;
    color: #8a8681;
  }

  .plan-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem 0.75rem;
    margin: 0.75rem 0 0;
  }

  .plan-stats dt {
    font-size: 0.65rem;
    color: #8a8681;
  }

  .plan-stats dd {
    margin: 0.15rem 0 0;
    font-size: 0.78rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .plan-stats .plan-secondary {
    margin-top: 0.1rem;
    font-size: 0.65rem;
    font-weight: 400;
    color: #8a8681;
  }

  .plan-link {
    cursor: pointer;
    border-bottom: 1px dashed #999;
  }

  .plan-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.6rem;
  }

  .plan-action {
    flex: 1;
    min-height: 2.2rem;
    font: inherit;
    font-size: 0.75rem;
    color: #1989fa;
    background: #f5f1ee;
    border: 0;
    border-radius: 0.55rem;
  }

  .plan-action.danger {
    color: #b93d31;
  }
</style>
