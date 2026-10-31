<template>
  <main class="dca-create-page">
    <section class="dca-form-card">
      <CoinSelection :strategy="strategy" @update:selectedCoins="updateSelectedCoins" />

      <div class="dca-field"><ExchangeSelection :strategy="strategy" @update:strategy="updateExchangeAndCheck" /></div>

      <nut-row class="dca-field">
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

      <div class="dca-field"><StrategyBasicInfo :strategy="strategy" @update:strategy="updateStrategy" /></div>
    </section>
    <section class="dca-form-card">
      <div class="dca-setting"><FrequencySetting :strategy="strategy" @update:strategy="updateStrategy" /></div>

      <div class="dca-setting"><PriceRangeSetting :strategy="strategy" /></div>

      <div class="dca-setting"><CoinDistribution :strategy="strategy" @confirm="onDistributionConfirm" /></div>

      <div class="dca-setting"><CoinAverageDown :strategy="strategy" @confirm="onAverageDownConfirm" /></div>
    </section>
    <div class="dca-create-action"
      ><StrategyCreation :strategy="strategy" @create="onCreateStrategy" @update:strategy="updateStrategy"
    /></div>
  </main>
</template>

<style scoped lang="scss">
  .dca-create-page {
    padding: 1rem 0.5rem 1.5rem;
    color: #232323;
  }

  .dca-form-card {
    padding: 1rem;
    margin-bottom: 0.875rem;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .dca-field {
    margin-top: 1rem;
  }

  .dca-setting + .dca-setting {
    margin-top: 0.875rem;
  }

  .dca-setting :deep(.timezone-field) {
    margin-top: 0.875rem;
    margin-bottom: 0;
  }

  .dca-form-card > :deep(.nut-row) {
    margin-top: 0.75rem;
  }

  .dca-form-card > :deep(.nut-row:first-child) {
    margin-top: 0;
  }

  .dca-field > :deep(.nut-row > .nut-col > .nut-cell),
  .dca-setting > :deep(.nut-row > .nut-col > .nut-cell),
  .dca-setting > :deep(.nut-row > .nut-cell) {
    min-height: 2.8rem;
    padding: 0.5rem 0.75rem;
    margin: 0;
    font-size: 0.875rem;
    background: #f5f1ee;
    border-radius: 0.6rem;
    box-shadow: none;
  }

  .dca-field > :deep(.nut-row > .nut-col > .custom-input) {
    min-height: 2.8rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    background: #f5f1ee;
    border-radius: 0.6rem;
  }

  .dca-create-action > :deep(.nut-row .nut-button) {
    width: 100%;
    min-height: 3rem;
    font-size: 0.9rem;
    background: #1989fa !important;
    border-color: #1989fa !important;
    border-radius: 0.75rem;
  }
</style>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import { showToast } from '@nutui/nutui';
  import { checkExchange, createStrategy } from '@/api';
  import type { PresetItem } from '@/api/presets';
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
  import { getAppContext } from '@/mobile/app-context';

  const { t } = useI18n();
  const strategy = ref<Strategy>({
    id: NaN,
    name: '',
    exchange_id: NaN,
    instalment: '',
    frequency: '',
    condition: '',
    cron: '',
    schedule_timezone: getAppContext()?.timeZone || 'UTC',
    coins: [],
  });

  const router = useRouter();
  const route = useRoute();
  const coinFiles = import.meta.glob<string>('../../../assets/coins/*.png', { eager: true, import: 'default' });
  const coinIcons = Object.fromEntries(Object.entries(coinFiles).map(([path, url]) => [path.split('/').pop()!.replace('.png', ''), url]));

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
  const onAverageDownConfirm = (updatedStrategy: Strategy) => {
    updateStrategy(updatedStrategy);
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

  const applyPreset = (preset: PresetItem) => {
    const params = preset.params;
    strategy.value = {
      ...strategy.value,
      name: params.name ?? preset.name,
      instalment: params.instalment == null ? strategy.value.instalment : String(params.instalment),
      frequency: params.frequency ?? strategy.value.frequency,
      cron: params.cron ?? strategy.value.cron,
      condition: params.condition ?? strategy.value.condition,
      schedule_timezone: params.scheduleTimezone ?? strategy.value.schedule_timezone,
      coins: (params.coins ?? []).map((coin) => ({
        symbol: coin.symbol,
        icon: coinIcons[coin.symbol] ?? '',
        checked: true,
        min: coin.min == null ? null : Number(coin.min),
        max: coin.max == null ? null : Number(coin.max),
        proportion: coin.proportion == null ? null : Number(coin.proportion),
        average_down: coin.averageDown,
      })),
    };
  };

  // 初始化默认币种
  onMounted(async () => {
    const presetKey = route.query.presetKey;
    if (typeof presetKey === 'string' && presetKey) {
      try {
        const { getPreset } = await import('@/api/presets');
        applyPreset(await getPreset(presetKey));
        showToast.success(t('presets.dcaRedirect'));
      } catch {
        showToast.fail(t('presets.loadFailed'));
      }
    }
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
