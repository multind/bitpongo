<template>
  <nut-row>
    <nut-col span="24">
      <nut-cell :title="t('coinAverageDown.title')" is-link @click="showPopup = true">
        <template #desc>
          <span style="color: black">{{ coinAverageDownDesc }}</span>
        </template>
      </nut-cell>
    </nut-col>
    <nut-popup v-model:visible="showPopup" position="bottom" round :style="{ height: '60%', paddingTop: '4%', backgroundColor: '' }">
      <!-- 使用本地副本 localCoins 替代 props.strategy.coins -->
      <nut-row v-for="coin in localCoins" :key="coin.symbol" type="flex" justify="space-evenly" wrap="nowrap" style="margin-top: 20px">
        <nut-col span="10">
          <text>{{ coin.symbol }}</text>
        </nut-col>
        <nut-col span="10" align="right">
          <!-- 绑定到本地副本的属性 -->
          <nut-switch v-model="coin.average_down"></nut-switch>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-evenly" style="margin-top: 20px">
        <nut-col span="22">
          <text style="font-size: 13px"> {{ t('coinAverageDown.description') }} </text>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-evenly" style="margin-top: 40px">
        <nut-col span="22">
          <text style="font-size: 13px">{{ t('coinAverageDown.setAveragePrice') }}</text>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-evenly" style="margin-top: 20px">
        <nut-col span="22">
          <!-- 使用本地副本 localCondition 替代 props.strategy.condition -->
          <nut-radio-group v-model="localCondition" direction="horizontal">
            <nut-radio label="total_average" shape="button">{{ t('coinAverageDown.byPositionAverage') }}</nut-radio>
            <nut-radio label="last_average" shape="button">{{ t('coinAverageDown.byLastOrderAverage') }}</nut-radio>
          </nut-radio-group>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-evenly" style="margin-top: 40px">
        <nut-col span="22">
          <nut-button size="large" color="black" @click="confirmDistribution">{{ t('coinAverageDown.confirm') }}</nut-button>
        </nut-col>
      </nut-row>
    </nut-popup>
  </nut-row>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { Strategy } from '@/views/list/types/strategy.ts';

  interface Props {
    strategy: Strategy;
  }

  const { t } = useI18n();
  const props = defineProps<Props>();

  // 创建本地副本避免直接修改 prop
  const localCoins = ref([...props.strategy.coins]);
  const localCondition = ref(props.strategy.condition);

  const showPopup = ref(false);
  const coinAverageDownDesc = ref('');

  interface Emits {
    (e: 'confirm', updatedStrategy: Strategy): void;
  }

  const emit = defineEmits<Emits>();

  // 确认分配比例
  const confirmDistribution = () => {
    showPopup.value = false;
    coinAverageDownDesc.value = t('coinAverageDown.setCount', { count: localCoins.value.length });
    // 将本地修改后的数据通过事件传递给父组件
    emit('confirm', {
      ...props.strategy,
      coins: localCoins.value,
      condition: localCondition.value,
    });
  };

  // 监听 prop 变化并同步到本地副本
  watch(
    () => props.strategy,
    (newStrategy) => {
      localCoins.value = [...newStrategy.coins];
      localCondition.value = newStrategy.condition;
    },
    { deep: true },
  );

  // 监听币种数量变化并重置描述
  watch(
    () => localCoins.value.length,
    (newLength, oldLength) => {
      if (oldLength !== undefined && newLength !== oldLength) {
        coinAverageDownDesc.value = '';
      }
    },
    { immediate: true },
  );
</script>
