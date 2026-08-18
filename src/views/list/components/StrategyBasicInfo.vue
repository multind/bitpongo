<template>
  <nut-row type="flex" justify="space-evenly" wrap="nowrap">
    <nut-col span="24">
      <nut-input
        :model-value="props.strategy.name"
        @update:model-value="(value) => emit('update:strategy', { ...props.strategy, name: value })"
        :placeholder="computedName"
        type="text"
        input-align="right"
        class="custom-input"
      >
        <template #left>
          <text style="color: #666">{{ t('basicInfo.name') }}</text>
        </template>
      </nut-input>
    </nut-col>
  </nut-row>

  <nut-row type="flex" justify="space-evenly" wrap="nowrap" style="margin-top: 20px">
    <nut-col span="24">
      <nut-input
        :model-value="props.strategy.instalment"
        @update:model-value="(value) => emit('update:strategy', { ...props.strategy, instalment: value })"
        :placeholder="`${t('basicInfo.inputPlaceholder').replace('（> 0 USDT）', '')}${instalmentPlaceholder}`"
        type="number"
        input-align="right"
        class="custom-input"
      >
        <template #left>
          <text style="color: #666">{{ t('basicInfo.perCycleAmount') }}</text>
        </template>
      </nut-input>
    </nut-col>
  </nut-row>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { Coin, Strategy } from '@/views/list/types/strategy.ts';
  import { minimumAmount } from '@/api';

  const { t } = useI18n();
  const instalmentPlaceholder = ref('（> 0 USDT）');

  interface Props {
    strategy: Strategy;
  }

  interface Emits {
    (e: 'update:strategy', value: Strategy): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  // 实时计算基于币种的策略名称
  const computedName = computed(() => {
    if (props.strategy.coins.length > 3) {
      return t('basicInfo.comboName', {
        symbols: `${props.strategy.coins
          .slice(0, 3)
          .map((coin: any) => coin.symbol)
          .join('/')}...`,
      });
    } else if (props.strategy.coins.length > 1 && props.strategy.coins.length <= 3) {
      return t('basicInfo.comboName', {
        symbols: props.strategy.coins
          .slice(0, props.strategy.coins.length)
          .map((coin: any) => coin.symbol)
          .join('/'),
      });
    } else if (props.strategy.coins.length > 0) {
      const coin0: Coin | undefined = props.strategy.coins[0];
      if (coin0) {
        return t('basicInfo.singleName', { symbol: coin0.symbol });
      }
    }
    return t('basicInfo.defaultName');
  });

  watch(
    () => [props.strategy.exchange_id, props.strategy.coins],
    async ([newExchangeId, newCoins]) => {
      instalmentPlaceholder.value = '';
      if (newExchangeId && newCoins && Array.isArray(newCoins)) {
        // 查询最小定投金额的汇总
        const minimumAmountSum = await minimumAmount({
          exchange_id: newExchangeId as number,
          coins: newCoins.map((coin: any) => coin.symbol),
        });
        if (minimumAmountSum) {
          instalmentPlaceholder.value = `（> ${minimumAmountSum} USDT）`;
        }
      }
    },
  );
</script>

<style scoped>
  ::v-deep(.nut-input) {
    padding: 2.6667vw 4vw;
  }
</style>
