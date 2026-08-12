<template>
  <nut-row class="row-content" type="flex" justify="space-between" wrap="nowrap">
    <nut-col class="col-content" :span="18">
      <nut-avatar-group size="small" max-count="8" z-index="left">
        <nut-avatar size="small" v-for="i in props.strategy.coins.length" :key="i">
          <img :src="props.strategy.coins[i - 1]?.icon" :alt="props.strategy.coins[i - 1]?.symbol" />
        </nut-avatar>
      </nut-avatar-group>
    </nut-col>
    <nut-col :span="6">
      <nut-button size="small" @click="coinChoice = true">选择币种</nut-button>
      <CoinPicker v-model:visible="coinChoice" @confirm="handleCoinConfirm" />
    </nut-col>
  </nut-row>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import type { Coin, Strategy } from '@/views/list/types/strategy.ts';
  import CoinPicker from '../components/CoinPicker.vue';

  interface Props {
    strategy: Strategy;
  }

  interface Emits {
    (e: 'update:selectedCoins', value: Coin[]): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const coinChoice = ref(false);

  const handleCoinConfirm = (coins: Coin[]) => {
    emit('update:selectedCoins', coins);
  };
</script>

<style scoped>
  .row-content {
    align-items: center;
    margin-top: 15px;
    margin-bottom: 15px;
  }

  .col-content {
    align-items: center;
    margin-left: 25px;
  }
</style>
