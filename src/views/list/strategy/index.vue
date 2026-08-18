<template>
  <CoinSelection :strategy="strategy" @update:selectedCoins="updateSelectedCoins" />

  <nut-divider dashed></nut-divider>

  <ExchangeSelection :strategy="strategy" @update:strategy="updateExchangeAndCheck" />

  <nut-row>
    <nut-col span="24">
      <nut-cell :title="t('exchange.availableBalance')">
        <template #link>
          <span v-if="isLoading">
            <Loading color="red" />
          </span>
        </template>
        <template #desc>
          <span v-if="!isLoading" style="color: red">{{ availableAmount }}</span>
        </template>
      </nut-cell>
    </nut-col>
  </nut-row>

  <StrategyBasicInfo :strategy="strategy" @update:strategy="updateStrategy" />

  <FrequencySetting :strategy="strategy" @update:strategy="updateStrategy" />

  <PriceRangeSetting :strategy="strategy" />

  <CoinDistribution :strategy="strategy" @confirm="onDistributionConfirm" />

  <CoinAverageDown :strategy="strategy" @confirm="onAverageDownConfirm" />

  <StrategyCreation :strategy="strategy" @create="onCreateStrategy" @update:strategy="updateStrategy" />
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { showToast } from '@nutui/nutui';
  import { checkExchange, createStrategy } from '@/api';
  import CoinSelection from '../components/CoinSelection.vue';
  import StrategyBasicInfo from '../components/StrategyBasicInfo.vue';
  import FrequencySetting from '../components/FrequencySetting.vue';
  import PriceRangeSetting from '../components/PriceRangeSetting.vue';
  import CoinDistribution from '../components/CoinDistribution.vue';
  import CoinAverageDown from '../components/CoinAverageDown.vue';
  import StrategyCreation from '../components/StrategyCreation.vue';
  import ExchangeSelection from '@/views/list/components/ExchangeSelection.vue';
  import type { Coin, Strategy } from '@/views/list/types/strategy.ts';
  import type { CheckExchangeData } from '@/views/list/types/exchange.ts';
  import { Loading } from '@nutui/icons-vue';

  const { t } = useI18n();
  const strategy = ref<Strategy>({
    id: NaN,
    name: '',
    exchange_id: NaN,
    instalment: '',
    frequency: '',
    condition: '',
    cron: '',
    coins: [],
  });

  const router = useRouter();

  // 更新选中的币种
  const updateSelectedCoins = (coins: Coin[]) => {
    strategy.value.coins = coins;
    // 更新币种比例
    if (coins.length === 0) return [];
    coins.map((coin) => {
      const basePercent = Math.floor(100 / coins.length);
      const remainder = 100 % coins.length;
      const index = coins.findIndex((c) => c.symbol === coin.symbol);
      coin.proportion = basePercent + (index < remainder ? 1 : 0);
      return coin;
    });
  };

  // 在 script setup 中添加
  const isLoading = ref<boolean>(false);
  // 可用金额状态
  const availableAmount = ref<string>('0.000');
  // 更新交易所后查询可用金额
  const updateExchangeAndCheck = async (newStrategy: Partial<Strategy>) => {
    // 更新策略信息
    updateStrategy(newStrategy);

    // 如果有交易所ID，则查询可用金额
    if (newStrategy.exchange_id) {
      isLoading.value = true; // 开始加载
      try {
        const response = await checkExchange(<CheckExchangeData>{ id: newStrategy.exchange_id });
        availableAmount.value = response.free || '0.000';
      } catch (error) {
        console.error('查询可用金额失败:', error);
        availableAmount.value = '0.000';
      } finally {
        isLoading.value = false; // 结束加载
      }
    }
  };

  // 更新策略信息，采用对象合并。每个子组件只需传递它关心的字段，不会影响其他字段的值。
  const updateStrategy = (newStrategy: Partial<Strategy>) => {
    strategy.value = { ...strategy.value, ...newStrategy };
  };

  // 确认币种分配
  const onDistributionConfirm = () => {
    console.log('币种分配已确认');
  };

  // 确认币种分配
  const onAverageDownConfirm = () => {
    console.log('逢低买入已设置');
  };

  // 创建策略
  const onCreateStrategy = async () => {
    if (!strategy.value.exchange_id || Number.isNaN(strategy.value.exchange_id)) {
      showToast.fail(t('strategy.selectExchangeFirst'));
      return;
    }
    const instalment = Number(strategy.value.instalment);
    if (!Number.isFinite(instalment) || instalment <= 0) {
      showToast.fail(t('strategy.instalmentRequired'));
      return;
    }
    if (!strategy.value.cron) {
      showToast.fail(t('strategy.frequencyRequired'));
      return;
    }
    if (strategy.value.coins.length === 0) {
      showToast.fail(t('strategy.coinsRequired'));
      return;
    }
    const totalProportion = strategy.value.coins.reduce((sum, coin) => sum + (Number(coin.proportion) || 0), 0);
    if (totalProportion !== 100) {
      showToast.fail(t('strategy.proportionTotal'));
      return;
    }

    const validatedStrategy = {
      ...strategy.value,
      instalment,
      coins: strategy.value.coins.map((coin) => {
        // 确保 min 和 max 是字符串类型再进行比较
        const minValue = coin.min?.toString() || '';
        const maxValue = coin.max?.toString() || '';

        return {
          symbol: coin.symbol,
          checked: coin.checked ?? true,
          min: minValue === '' ? null : Number(minValue),
          max: maxValue === '' ? null : Number(maxValue),
          proportion: coin.proportion,
          average_down: coin.average_down,
        };
      }),
    };
    console.log('创建策略', validatedStrategy);
    try {
      await createStrategy(validatedStrategy as unknown as Strategy);
      showToast.success(t('common.createSuccess'));
      router.push('/list');
    } catch (error) {
      showToast.fail(error instanceof Error ? error.message : t('common.createFailed'));
    }
  };

  // 初始化默认币种
  onMounted(() => {
    if (strategy.value.coins.length === 0) {
      strategy.value.coins = [
        {
          symbol: 'BTC',
          icon: new URL('../../../assets/coins/BTC.png', import.meta.url).href,
          checked: true,
          max: NaN,
          min: NaN,
          proportion: 100,
          average_down: false,
        },
      ];
    }
  });
</script>
