<template>
  <nut-row class="row-content" type="flex" justify="space-between" wrap="nowrap">
    <div class="coin-icons">
      <nut-avatar-group size="small" max-count="8" z-index="left">
        <nut-avatar size="small" v-for="i in props.strategy.coins.length" :key="i">
          <img :src="props.strategy.coins[i - 1]?.icon" :alt="props.strategy.coins[i - 1]?.symbol" />
        </nut-avatar>
      </nut-avatar-group>
    </div>
    <div class="coin-action" data-test="coin-selection-action">
      <nut-button class="coin-select-btn" size="normal" @click="coinChoice = true">{{ t('strategy.buyCoins') }}</nut-button>
      <CoinPicker v-model:visible="coinChoice" @confirm="handleCoinConfirm" />
    </div>
  </nut-row>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { Coin, Strategy } from '@/views/list/types/strategy.ts';
  import CoinPicker from '../components/CoinPicker.vue';

  interface Props {
    strategy: Strategy;
  }

  interface Emits {
    (e: 'update:selectedCoins', value: Coin[]): void;
  }

  const { t } = useI18n();
  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const coinChoice = ref(false);

  const handleCoinConfirm = (coins: Coin[]) => {
    emit('update:selectedCoins', coins);
  };
</script>

<style scoped>
  .coin-select-btn {
    min-width: 0;
    white-space: nowrap;
  }

  ::v-deep(.coin-select-btn .nut-button__warp) {
    white-space: nowrap;
  }

  .row-content {
    box-sizing: border-box;
    gap: 12px;
    align-items: center;
    padding-right: 12px;
    margin-top: 15px;
    margin-bottom: 15px;
  }

  .coin-icons {
    flex: 1 1 0;
    align-items: center;
    min-width: 0;
    margin-left: 25px;
    overflow: hidden;
  }

  .coin-action {
    flex: 0 0 auto;
    min-width: 0;
  }
</style>
