<template>
  <div class="plan-container">
    <nut-row type="flex" wrap="nowrap" :gutter="10">
      <nut-col align="center" :span="6">
        <nut-avatar-group max-count="2" z-index="left" span="-20" size="20">
          <nut-avatar v-for="(coin, index) in props.plan.coins" :key="index" size="35">
            <img :src="getCoinIconUrl(coin.symbol)" :alt="`${coin.symbol}`" />
          </nut-avatar>
        </nut-avatar-group>
      </nut-col>
      <nut-col align="left" :span="20">
        <nut-row>
          <nut-col span="8">
            <text style="font-size: 14px">{{ plan.strategy.name }}</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <nut-col span="8">
            <text style="font-size: 12px; color: #999" :style="{ color: plan.status === 'stop' ? '#FFA900' : '' }">
              {{ plan.status === 'stop' ? t('planCard.paused') : runTimeText }}
            </text>
          </nut-col>
        </nut-row>
      </nut-col>
      <nut-col align="right" :span="8">
        <nut-button size="small" @click="handleCoinClick('shareButton')">
          <template #icon>
            <Share />
          </template>
          {{ t('planCard.share') }}
        </nut-button>
      </nut-col>
    </nut-row>

    <nut-row align="flex-start" type="flex" justify="space-around" wrap>
      <nut-col :span="12">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 12px; color: #999">{{ t('planCard.totalInvested') }}</text>
          <text style="font-size: 15px">{{ plan.total_funds }}</text>
        </nut-space>
      </nut-col>
      <nut-col align="right" :span="12">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 12px; color: #999">{{ t('planCard.totalReturn') }}</text>
          <text style="font-size: 15px">{{ plan.total_revenue }} ({{ plan.total_ratio }}%)</text>
        </nut-space>
      </nut-col>
    </nut-row>

    <nut-row align="flex-start" type="flex" justify="flex-start" flex-wrap="wrap">
      <nut-col align="left" :span="8">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 12px; color: #999">{{ t('planCard.coinProportion') }}</text>
          <text style="font-size: 15px; border-bottom: 1px dashed #999" @click="handleCoinClick('coinProportion')">
            {{ coinProportionText }}
          </text>
        </nut-space>
      </nut-col>
      <nut-col align="center-left" :span="8">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 12px; color: #999">{{ t('planCard.frequencyTriggered') }}</text>
          <text style="font-size: 15px">{{ plan.strategy.frequency }} / {{ plan.triggered_count }}</text>
        </nut-space>
      </nut-col>
      <nut-col align="left" :span="8">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 12px; color: #999">{{ t('planCard.perCycleAmount') }}</text>
          <text style="font-size: 15px">{{ plan.strategy.instalment }}</text>
        </nut-space>
      </nut-col>
      <nut-col align="center-left" :span="8">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 12px; color: #999">{{ t('common.exchange') }}</text>
          <text style="font-size: 15px">Binance</text>
        </nut-space>
      </nut-col>
      <nut-col align="left" :span="8">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 12px; color: #999">{{ t('planCard.avgPrice') }}</text>
          <text style="font-size: 15px; border-bottom: 1px dashed #999" @click="handleCoinClick('coinAverage')">{{ coinAverageText }}</text>
        </nut-space>
      </nut-col>
      <nut-col align="center-left" :span="8">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 12px; color: #999">{{ t('planCard.nextBuyTime') }}</text>
          <text style="font-size: 15px">{{ nextBuyTimeText }}</text>
        </nut-space>
      </nut-col>
    </nut-row>

    <nut-row>
      <nut-col :span="24">
        <canvas :id="'myChart-' + plan.id"></canvas>
      </nut-col>
    </nut-row>

    <nut-row style="margin-top: 5px" type="flex" justify="end" flex-wrap="wrap">
      <nut-col align="right" :span="6">
        <nut-button size="small" @click="handleClick(plan.status === 'active' ? 'stop' : 'active')">
          <template #icon>
            <PlayStop v-if="plan.status === 'active'" />
            <PlayStart v-else />
          </template>
          {{ plan.status === 'active' ? t('planCard.pause') : t('planCard.start') }}
        </nut-button>
      </nut-col>
      <nut-col align="right" :span="6">
        <nut-button size="small" @click="handleClick('close')">
          <template #icon>
            <CheckDisabled />
          </template>
          {{ t('planCard.stop') }}
        </nut-button>
      </nut-col>
      <nut-col align="right" :span="6">
        <nut-button size="small" @click="goToDetails">
          <template #icon>
            <Order />
          </template>
          {{ t('planCard.details') }}
        </nut-button>
      </nut-col>
    </nut-row>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { CheckDisabled, Order, PlayStart, PlayStop, Share } from '@nutui/icons-vue';
  import { Chart } from 'chart.js/auto';
  import { useRouter } from 'vue-router';

  import { calculateRunTime, formatDateTime } from '@/utils/timeUtils';
  import { updatePlanStatus } from '@/api';

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
        const date = new Date(snapshot.created_at);
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        return `${day}/${hour}:00`;
      });
    } catch (error) {
      console.error('生成图表标签出错:', error);
      return [''];
    }
  });

  function numbers() {
    const data: number[] = [];
    props.plan.snapshots.map((snapshot: any) => {
      data.push(snapshot.value);
    });
    return data;
  }

  const generateData = () => numbers();
  const data = {
    labels: chartLabels.value,
    datasets: [
      {
        data: generateData(),
        borderColor: 'green',
        fill: true,
      },
    ],
  };

  onMounted(() => {
    const ctx = document.getElementById('myChart-' + props.plan.id);
    if (ctx) {
      new Chart(ctx as HTMLCanvasElement, {
        type: 'line',
        data: data,
        options: {
          plugins: {
            filler: {
              propagate: true,
            },
            title: {
              display: false,
            },
            legend: {
              display: false,
            },
          },
          interaction: {
            intersect: true,
          },
          elements: {
            line: {
              tension: 0.4,
            },
          },
        },
      });
    }
  });

  // 计算运行时间文本
  const runTimeText = computed(() => {
    return calculateRunTime(props.plan?.created_at);
  });

  // 格式化下次买入时间
  const nextBuyTimeText = computed(() => {
    return formatDateTime(props.plan?.next_time);
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
    padding: 20px;
    margin-bottom: 20px;
    background-color: #f5f5f5;
    border-radius: 15px;
  }

  ::v-deep(.nut-avatar-20) {
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 26px;
    line-height: 24px;
    color: white;
    text-align: center;
    background: red;
    border-radius: 50%;
  }
</style>
