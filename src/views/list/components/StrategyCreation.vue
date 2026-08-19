<template>
  <nut-row type="flex" justify="space-evenly" style="margin-top: 10px">
    <nut-col span="23">
      <nut-button size="large" color="black" @click="showPopup = true"> {{ t('strategy.createButton') }} </nut-button>
    </nut-col>
  </nut-row>
  <nut-popup v-model:visible="showPopup" position="bottom" round :style="{ height: '92%', paddingTop: '6%' }">
    <nut-row style="margin-top: 30px" id="strategyCreationPopup" type="flex" justify="center">
      <nut-col :span="22">
        <div class="content">{{ t('strategy.investmentAmount') }}</div>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="center" style="margin-top: 10px; margin-bottom: 60px">
      <nut-col align="center" :span="22">
        <nut-avatar :size="22">
          <img src="../../../assets/coins/USDT.png" alt="USDT" />
        </nut-avatar>
        {{ props.strategy.instalment }} USDT
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around">
      <nut-col :span="10">
        <div>{{ t('strategy.frequency') }}</div>
      </nut-col>
      <nut-col align="right" :span="10">
        <div>{{ props.strategy.frequency }}</div>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around" style="margin-top: 20px">
      <nut-col :span="10">
        <div>{{ t('strategy.nextBuyTime') }}</div>
      </nut-col>
      <nut-col align="right" :span="10">
        <div>{{ nextBuyTime }}</div>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around" style="margin-top: 20px">
      <nut-col :span="10">
        <div>{{ t('strategy.buyCoins') }}</div>
      </nut-col>
      <nut-col style="text-align: right" :span="10">
        <nut-avatar-group size="25" max-count="3" z-index="left" style="display: inline-flex">
          <nut-avatar size="25" v-for="i in props.strategy.coins.length" :key="i" @click="handleCoinClick('#strategyCreationPopup')">
            <img :src="props.strategy.coins[i - 1]?.icon" :alt="props.strategy.coins[i - 1]?.symbol" />
          </nut-avatar>
        </nut-avatar-group>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around" style="margin-top: 20px">
      <nut-col :span="10">
        <div>{{ t('strategy.buyPriceRange') }}</div>
      </nut-col>
      <nut-col align="right" :span="10">
        <div>
          <text style="border-bottom: 1px dashed #999" @click="handleIntervalClick('#strategyCreationPopup')">{{
            t('strategy.setCoinsCount', { count: strategy.coins.length })
          }}</text>
        </div>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around" style="margin-top: 20px">
      <nut-col :span="8">
        <div>{{ t('strategy.name') }}</div>
      </nut-col>
      <nut-col align="right" :span="12">
        <div>{{ strategyNamePlaceholder }}</div>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around" style="margin-top: 20px">
      <nut-col :span="22">
        <nut-divider :hairline="true" dashed />
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around">
      <nut-col :span="22">
        <text style="font-size: 13px; color: #555">
          {{ t('strategy.riskNotice') }}
        </text>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-evenly" style="margin-top: 40px">
      <nut-col span="22">
        <nut-button size="large" color="black" @click="confirmCreation"> {{ t('common.confirm') }} </nut-button>
      </nut-col>
    </nut-row>
  </nut-popup>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { showDialog } from '@nutui/nutui';
  import type { Coin, Strategy } from '@/views/list/types/strategy.ts';
  import { CronExpressionParser } from 'cron-parser';

  interface Props {
    strategy: Strategy;
  }

  interface Emits {
    (e: 'create'): void;
    (e: 'update:strategy', strategy: Strategy): void;
  }

  const { t } = useI18n();
  const props = defineProps<Props>();

  const emit = defineEmits<Emits>();

  const showPopup = ref(false);

  const confirmCreation = () => {
    console.log('创建策略');
    // 创建包含默认名称的新策略对象
    const updatedStrategy = {
      ...props.strategy,
      name: strategyNamePlaceholder.value,
    };
    // 通过事件传递给父组件处理
    emit('update:strategy', updatedStrategy);
    showPopup.value = false;
    emit('create');
  };

  // 当输入框为空时显示计算出的名称作为占位符
  const strategyNamePlaceholder = computed(() => {
    return !props.strategy.name ? computedDefaultName() : props.strategy.name;
  });

  const handleCoinClick = (teleport: string) => {
    // 处理点击事件的逻辑
    console.log('币种点击事件触发');

    // 生成基于 coins 参数的 HTML 内容
    let coinsContent = '';
    if (props.strategy.coins && props.strategy.coins.length > 0) {
      coinsContent = '<div style="width: 100%;">';
      props.strategy.coins.forEach((coin) => {
        coinsContent += `
          <div style="display: flex; justify-content: space-between;">
            <span >${coin.symbol}</span>
            <span >${coin.proportion}%</span>
          </div>
        `;
      });
      coinsContent += '</div>';
    } else {
      coinsContent = `<p>${t('strategy.noCoins')}</p>`;
    }

    // 可以在这里添加跳转到币种详情页或其他交互逻辑
    showDialog({
      textAlign: 'center',
      teleport,
      title: t('strategy.coinProportionTitle'),
      content: coinsContent,
      noCancelBtn: true,
      onCancel: () => {
        console.log('event cancel');
      },
      onOk: () => {
        console.log('event ok');
      },
    });
  };

  const handleIntervalClick = (teleport: string) => {
    // 处理点击事件的逻辑
    console.log('区间点击事件触发');

    // 生成基于 coins 参数的 HTML 内容
    let coinsContent = '';
    if (props.strategy.coins && props.strategy.coins.length > 0) {
      coinsContent = '<div style="width: 100%;">';
      props.strategy.coins.forEach((coin) => {
        coinsContent += `
          <div style="display: flex; justify-content: space-between;">
            <span >${coin.symbol}</span>
            <span >${coin.min} - ${coin.max}</span>
          </div>
        `;
      });
      coinsContent += '</div>';
    } else {
      coinsContent = `<p>${t('strategy.noRange')}</p>`;
    }
    // 可以在这里添加跳转到币种详情页或其他交互逻辑
    showDialog({
      textAlign: 'center',
      teleport,
      title: t('strategy.priceRangeTitle'),
      content: coinsContent,
      noCancelBtn: true,
      onCancel: () => {
        console.log('event cancel');
      },
      onOk: () => {
        console.log('event ok');
      },
    });
  };

  const computedDefaultName = () => {
    if (props.strategy.coins.length > 3) {
      // 修改条件为大于3
      return t('strategy.comboName', {
        symbols: `${props.strategy.coins
          .slice(0, 3)
          .map((coin: any) => coin.symbol)
          .join('/')}...`,
      });
    } else if (props.strategy.coins.length > 0) {
      if (props.strategy.coins.length === 1) {
        const coin0: Coin | undefined = props.strategy.coins[0];
        if (coin0) {
          return t('strategy.singleName', { symbol: coin0.symbol });
        }
      } else {
        // 2-3个币种的情况：直接列出所有币种，不加...
        return t('strategy.comboName', {
          symbols: props.strategy.coins.map((coin: any) => coin.symbol).join('/'),
        });
      }
    }
    return t('strategy.defaultName');
  };

  // 计算下次买入时间
  const nextBuyTime = computed(() => {
    try {
      if (props.strategy.cron) {
        const interval = CronExpressionParser.parse(props.strategy.cron, {});
        const nextDate = interval.next().toDate();
        return formatDate(nextDate);
      }
      return t('common.notSet');
    } catch (error) {
      console.error('解析 cron 表达式失败:', error);
      return t('common.parseFailed');
    }
  });

  // 格式化日期时间
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
</script>

<style scoped>
  .content {
    margin-bottom: 10px;
    font-size: 36px;
    line-height: 40px;
    color: #2c3e50;
    text-align: center;
    border-radius: 6px;
  }

  ::v-deep(.nut-dialog__content) {
    white-space: unset;
  }
</style>
