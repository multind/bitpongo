<template>
  <nut-row>
    <nut-col span="24">
      <nut-cell title="币种配置" is-link @click="showPopup = true">
        <template #desc>
          <span style="color: black">{{ coinDistributionDesc }}</span>
        </template>
      </nut-cell>
    </nut-col>
    <nut-popup v-model:visible="showPopup" position="bottom" round :style="{ height: '60%', paddingTop: '4%', backgroundColor: '' }">
      <nut-row
        v-for="coin in props.strategy.coins"
        :key="coin.symbol"
        type="flex"
        justify="space-evenly"
        wrap="nowrap"
        style="margin-top: 20px"
      >
        <nut-col span="22">
          <nut-input v-model="coin.proportion" input-align="right" :border="true" style="background-color: #eee">
            <template #left>
              <text>{{ coin.symbol }}</text>
            </template>
            <template #right>
              <text>%</text>
            </template>
          </nut-input>
        </nut-col>
      </nut-row>
      <nut-row type="flex" justify="space-evenly" style="margin-top: 20px">
        <nut-col span="22">
          <text style="font-size: 13px; color: red">{{ percentageError }}</text>
        </nut-col>
      </nut-row>
      <nut-row type="flex" justify="space-evenly" wrap="nowrap" style="margin-top: 20px">
        <nut-col span="8">
          <text style="font-size: 13px">每期金额</text>
        </nut-col>
        <nut-col span="4"></nut-col>
        <nut-col span="8" style="text-align: right">
          <text style="font-size: 13px">{{ strategy.instalment || 0 }} USDT</text>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-evenly" style="margin-top: 20px">
        <nut-col span="22">
          <text style="font-size: 13px">根据您设定的定投频率，每期金额将按比例买入数字货币。</text>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-evenly" style="margin-top: 40px">
        <nut-col span="10">
          <nut-button size="large" type="default" @click="resetDistribution">重置比例</nut-button>
        </nut-col>
        <nut-col span="10">
          <nut-button size="large" color="black" @click="confirmDistribution">确认</nut-button>
        </nut-col>
      </nut-row>
    </nut-popup>
  </nut-row>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import type { Strategy } from '@/views/list/types/strategy.ts';

  interface Props {
    strategy: Strategy;
  }

  interface Emits {
    (e: 'confirm'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const showPopup = ref(false);
  const percentageError = ref('');
  const coinDistributionDesc = ref('');

  // 重置分配比例
  const resetDistribution = () => {
    const coins = props.strategy.coins;
    if (coins.length === 0) return [];
    return coins.map((coin) => {
      const basePercent = Math.floor(100 / coins.length);
      const remainder = 100 % coins.length;
      const index = coins.findIndex((c) => c.symbol === coin.symbol);
      coin.proportion = basePercent + (index < remainder ? 1 : 0);
      return coin;
    });
  };

  // 确认分配比例
  const confirmDistribution = () => {
    const total = props.strategy.coins.reduce((sum, coin) => {
      return sum + (Number(coin.proportion) || 0);
    }, 0);

    if (total !== 100) {
      percentageError.value = `总比例必须等于100%，当前为${total}%`;
      return;
    }
    percentageError.value = '';
    showPopup.value = false;
    coinDistributionDesc.value = `已设置 ${props.strategy.coins.length} 个币种`;
    // Emit confirm event
    emit('confirm');
  };

  // 监听币种变化，当币种发生变化时清空描述
  watch(
    () => props.strategy.coins.length,
    (newLength, oldLength) => {
      if (oldLength !== undefined && newLength !== oldLength) {
        coinDistributionDesc.value = '';
      }
    },
    { immediate: true },
  );
</script>
