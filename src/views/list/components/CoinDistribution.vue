<template>
  <nut-row>
    <nut-col span="24">
      <nut-cell :title="t('coinDistribution.title')" is-link @click="showPopup = true">
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
          <nut-input
            :model-value="coin.proportion ?? undefined"
            input-align="right"
            :border="true"
            style="background-color: #eee"
            @update:model-value="coin.proportion = $event == null ? null : Number($event)"
          >
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
          <text style="font-size: 13px">{{ t('coinDistribution.perCycleAmount') }}</text>
        </nut-col>
        <nut-col span="4"></nut-col>
        <nut-col span="8" style="text-align: right">
          <text style="font-size: 13px">{{ strategy.instalment || 0 }} USDT</text>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-evenly" style="margin-top: 20px">
        <nut-col span="22">
          <text style="font-size: 13px">{{ t('coinDistribution.description') }}</text>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-evenly" style="margin-top: 40px">
        <nut-col span="10">
          <nut-button size="large" type="default" @click="resetDistribution">{{ t('coinDistribution.resetProportion') }}</nut-button>
        </nut-col>
        <nut-col span="10">
          <nut-button size="large" color="black" @click="confirmDistribution">{{ t('coinDistribution.confirm') }}</nut-button>
        </nut-col>
      </nut-row>
    </nut-popup>
  </nut-row>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { Strategy } from '@/views/list/types/strategy.ts';

  interface Props {
    strategy: Strategy;
  }

  interface Emits {
    (e: 'confirm'): void;
  }

  const { t } = useI18n();
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
      percentageError.value = t('coinDistribution.totalError', { total });
      return;
    }
    percentageError.value = '';
    showPopup.value = false;
    coinDistributionDesc.value = t('coinDistribution.setCount', { count: props.strategy.coins.length });
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
