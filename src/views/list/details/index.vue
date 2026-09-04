<template>
  <div v-if="loading" class="loading-container">
    <text style="margin-left: 10px">{{ t('common.loading') }}</text>
  </div>

  <div v-else-if="plan" class="details-page" style="padding-right: 16px; padding-left: 16px">
    <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-top: 10px">
      <nut-col align="left" span="18">
        <text style="font-size: 15px">{{ plan.strategy.name }}</text
        >&nbsp;<Edit width="13px" height="13px" @click="strategyNameHandler(plan.strategy.name)" />
      </nut-col>
      <nut-col align="right" span="6">
        <text style="font-size: 15px">{{ plan.status === 'active' ? t('details.running') : t('details.paused') }}</text>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-top: 5px">
      <nut-col align="left" span="24">
        <nut-space>
          <nut-tag style="font-size: 11px">{{ t('details.dcaStrategyTag') }}</nut-tag>
          <nut-tag style="font-size: 11px">Binance</nut-tag>
        </nut-space>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-top: 5px">
      <nut-col align="left" span="12">
        <nut-space>
          <text style="font-size: 13px; color: #2f2f2f">{{ runTimeText }}</text>
        </nut-space>
      </nut-col>
      <nut-col align="right" span="12">
        <text style="font-size: 13px; color: #2f2f2f">{{ t('details.created') }}</text
        >&nbsp;
        <text style="font-size: 13px; color: #2f2f2f">{{ formatDateTime(plan.created_at) }}</text>
      </nut-col>
    </nut-row>

    <nut-tabs
      v-model="value"
      align="left"
      size="large"
      swipeable
      title-gutter="30"
      :ellipsis="false"
      :title-scroll="false"
      style="margin-top: 20px; font-size: 14px"
    >
      <template #titles>
        <div v-for="item in list" :key="item.paneKey" class="custom-tab-item" @click="value = item.paneKey">
          <div
            class="custom-title"
            :class="{
              active: value === item.paneKey,
            }"
          >
            {{ item.title }}
          </div>
        </div>
      </template>
      <nut-tab-pane pane-key="c1" :style="tabPaneScrollStyle">
        <nut-row>
          <nut-col>
            <text>{{ t('details.totalReturn') }}</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <nut-col>
            <text style="font-size: 18px">{{ plan.total_revenue }}</text>
            &nbsp;
            <text style="font-size: 12px">{{ plan.total_ratio }}%</text>
          </nut-col>
        </nut-row>
        <nut-divider :hairline="true" style="margin-top: 10px; margin-bottom: 10px" />
        <nut-row type="flex" justify="space-between" wrap="nowrap">
          <nut-col span="12">
            <text>{{ t('details.amount') }}</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>{{ plan.total_value }} USDT</text>
          </nut-col>
        </nut-row>

        <nut-row type="flex" justify="space-between" wrap="nowrap">
          <nut-col span="18">
            <text>{{ t('details.totalInvested') }}</text>
          </nut-col>

          <nut-col align="right" span="6">
            <text>{{ plan.total_funds }} USDT</text>
          </nut-col>
        </nut-row>

        <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-top: 40px">
          <nut-col span="24">
            <text style="font-size: 16px">{{ t('details.returnTrend') }}</text>
          </nut-col>
        </nut-row>

        <nut-row>
          <nut-col :span="24">
            <canvas v-if="plan.snapshots?.length" id="chartDetails"></canvas>
            <nut-empty v-else :description="t('details.noReturnData')" />
          </nut-col>
        </nut-row>
      </nut-tab-pane>

      <nut-tab-pane pane-key="c2" :style="tabPaneScrollStyle">
        <nut-row type="flex">
          <nut-col span="12">
            <text>{{ t('details.quoteCurrency') }}</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>USDT</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>{{ t('details.frequency') }}</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>{{ plan.strategy.frequency }}</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>{{ t('details.nextBuyTime') }}</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text data-test="details-next-buy-time">{{ nextBuyTimeText.primary }}</text>
            <text v-if="nextBuyTimeText.secondary" style="display: block; font-size: 11px; color: #777">
              {{ nextBuyTimeText.secondary }}
            </text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>{{ t('details.perCycleAmount') }}</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>{{ plan.strategy.instalment }} USDT</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>{{ t('details.triggeredCycles') }}</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>{{ plan.triggered_count }}</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>{{ t('details.tradeCurrency') }}</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>USDT</text>
          </nut-col>
        </nut-row>

        <nut-divider :hairline="true" style="margin-top: 20px; margin-bottom: 20px" />
        <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
          <nut-col>
            <text style="font-size: 18px">{{ t('details.coinConfig') }}</text>
          </nut-col>
        </nut-row>

        <div v-for="(coin, index) in plan.coins" :key="coin.symbol" style="margin-bottom: 10px">
          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col style="display: flex; align-items: center; justify-content: flex-start">
              <img :src="getCoinIconUrl(coin.symbol)" :alt="`${coin.symbol}`" height="16" width="16" />
              <text> {{ coin.symbol }} </text>&nbsp;|&nbsp;<text>{{ coin.proportion }}%</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ currentPrices[coin.symbol] || t('common.loading') }}</text>
            </nut-col>
          </nut-row>

          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col>
              <text>{{ t('details.priceRange') }}</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ coin.min || '' }} - {{ coin.max || '' }}</text>
            </nut-col>
          </nut-row>

          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col>
              <text>{{ t('details.totalPurchased') }}</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ coin.total_amount || '' }}</text>
            </nut-col>
          </nut-row>

          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col>
              <text>{{ t('details.dcaReturn') }}</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ coin.income || '' }}</text>
            </nut-col>
          </nut-row>

          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col>
              <text>{{ t('details.dcaAvgPrice') }}</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ coin.average }}</text>
            </nut-col>
          </nut-row>
          <nut-divider v-if="Number(index) < plan.coins.length - 1" :hairline="true" dashed style="margin-top: 10px; margin-bottom: 10px" />
        </div>
      </nut-tab-pane>

      <nut-tab-pane pane-key="c3" :style="tabPaneScrollStyle">
        <nut-pull-refresh v-model="refresh" @refresh="refreshFun">
          <nut-infinite-loading v-model="infinityValue" :has-more="hasMore" @load-more="loadMore">
            <div v-if="tradeOrders.length">
              <div v-for="(order, index) in tradeOrders" :key="order.id">
                <nut-row>
                  <nut-col span="18">
                    <nut-row>
                      <nut-col>
                        <text style="font-size: 15px; font-weight: bold">{{ order.symbol }}</text>
                      </nut-col>
                    </nut-row>
                    <nut-row type="flex" justify="start" wrap="nowrap">
                      <nut-col span="4">
                        <nut-tag style="font-size: 12px">{{ t('common.buy') }}</nut-tag>
                      </nut-col>
                      <nut-col span="12">
                        <text>{{ formatDateTime(order.created_at) }}</text>
                      </nut-col>
                    </nut-row>
                  </nut-col>
                  <nut-col align="right" span="6">
                    <MoreX @click="tradeDetails(order)" />
                    <!--                <nut-button size="small" type="default" @click="tradeDetails(order)">查看明细</nut-button>-->
                  </nut-col>
                </nut-row>
                <nut-row type="flex" justify="start" wrap="nowrap" style="margin-top: 10px">
                  <nut-col span="12">
                    <text style="color: #2f2f2f">{{ t('details.filledAvgPrice') }}</text>
                  </nut-col>
                  <nut-col align="right" span="12">
                    <text>{{ order.average_price }} USDT</text>
                  </nut-col>
                </nut-row>
                <nut-row type="flex" justify="start" wrap="nowrap" style="margin-top: 10px">
                  <nut-col span="12">
                    <text style="color: #2f2f2f">{{ t('details.filledTotal') }}</text>
                  </nut-col>
                  <nut-col align="right" span="12">
                    <text>{{ order.total_cost }} USDT</text>
                  </nut-col>
                </nut-row>
                <nut-divider
                  v-if="Number(index) < tradeOrders.length - 1"
                  :hairline="true"
                  dashed
                  style="margin-top: 10px; margin-bottom: 10px"
                />
              </div>
            </div>
            <nut-empty v-else>
              <template #image>
                <img src="@/assets/empty.svg" :alt="t('list.emptyAlt')" />
              </template>
            </nut-empty>
          </nut-infinite-loading>
        </nut-pull-refresh>
      </nut-tab-pane>
    </nut-tabs>

    <nut-sticky position="bottom">
      <nut-row type="flex" :gutter="10" style="padding-top: 10px; padding-bottom: 10px; background-color: whitesmoke">
        <nut-col align="center" :span="12">
          <nut-button v-if="plan.status === 'active'" :disabled="updatingStatus" :loading="updatingStatus" @click="handleClick('stop')">
            <template #icon>
              <PlayStop />
            </template>
            {{ t('planCard.pause') }}
          </nut-button>
          <nut-button v-else :disabled="updatingStatus" :loading="updatingStatus" @click="handleClick('active')">
            <template #icon>
              <PlayStart />
            </template>
            {{ t('planCard.resume') }}
          </nut-button>
        </nut-col>
        <nut-col align="center" :span="12">
          <nut-button :disabled="updatingStatus" :loading="updatingStatus" @click="handleClick('close')">
            <template #icon>
              <CheckDisabled />
            </template>
            {{ t('planCard.stop') }}
          </nut-button>
        </nut-col>
      </nut-row>
    </nut-sticky>
  </div>

  <div v-else class="empty-container">
    <nut-empty :description="t('common.loadDataFailed')">
      <template #image>
        <img src="@/assets/empty.svg" :alt="t('common.loadDataFailed')" />
      </template>
    </nut-empty>
  </div>

  <nut-popup
    v-model:visible="showOrderDetailsPopup"
    position="bottom"
    closeable
    round
    close-icon-position="top-left"
    :style="{ height: '30%' }"
  >
    <nut-row style="margin-top: 23px; text-align: center" type="flex">
      <nut-col span="24">
        <div style="font-size: 18px">{{ t('details.tradeDetailsTitle') }}</div>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="space-around" style="margin-top: 20px">
      <nut-col span="22">
        <nut-row>
          <nut-col>
            <text style="font-size: 15px; font-weight: bold">{{ currentOrder?.symbol }}</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" justify="start" wrap="nowrap">
          <nut-col span="3">
            <nut-tag style="font-size: 12px">{{ t('common.buy') }}</nut-tag>
          </nut-col>
          <nut-col span="12">
            <text>{{ formatDateTime(currentOrder?.created_at) }}</text>
          </nut-col>
        </nut-row>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="space-around" wrap="nowrap" style="margin-top: 10px">
      <nut-col span="10">
        <nut-row>
          <nut-col span="24">
            <text style="font-size: 14px; color: #2f2f2f">{{ t('details.filledTotal') }}</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <text>{{ currentOrder?.total_amount }} </text>
        </nut-row>
      </nut-col>
      <nut-col span="10">
        <nut-row>
          <nut-col span="24">
            <text style="font-size: 14px; color: #2f2f2f">{{ t('details.filledAvgPrice') }}</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <text>{{ currentOrder?.average_price }} </text>
        </nut-row>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="space-around" wrap="nowrap" style="margin-top: 10px">
      <nut-col span="10">
        <nut-row>
          <nut-col span="24">
            <text style="font-size: 14px; color: #2f2f2f">{{
              t('details.filledQuantity', { symbol: currentOrder?.symbol.split('/')[0] })
            }}</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <text>{{ currentOrder?.total_cost }}</text>
        </nut-row>
      </nut-col>
      <nut-col span="10">
        <nut-row>
          <nut-col span="24">
            <text style="font-size: 14px; color: #2f2f2f">{{ t('details.fee', { symbol: currentOrder?.symbol.split('/')[0] }) }}</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <text>{{ currentOrder?.fee }}</text>
        </nut-row>
      </nut-col>
    </nut-row>
  </nut-popup>

  <nut-popup
    v-model:visible="editStrategyNamePopup"
    position="bottom"
    closeable
    round
    close-icon-position="top-left"
    :style="{ height: '40%' }"
  >
    <nut-row style="margin-top: 23px; text-align: center" type="flex">
      <nut-col span="24">
        <div style="font-size: 18px">{{ t('details.editStrategyName') }}</div>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around" style="margin-top: 20px">
      <nut-col span="22">
        <text style="font-size: 15px; font-weight: bold">{{ t('details.strategyName') }}</text>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around" style="margin-top: 10px">
      <nut-col span="22">
        <nut-input
          v-model="strategyName"
          :placeholder="t('details.strategyNamePlaceholder')"
          :border="true"
          style="background-color: #eee; border: #999 1px solid; border-radius: 5px"
        />
      </nut-col>
    </nut-row>
    <nut-sticky bottom="5" position="bottom">
      <nut-row type="flex" justify="center" :gutter="10" style="margin-top: 20px">
        <nut-col :span="22">
          <nut-button size="large" style="background-color: #101010" @click="strategyNameUpdateHandler">
            <text style="color: whitesmoke"> {{ t('common.save') }} </text>
          </nut-button>
        </nut-col>
      </nut-row>
    </nut-sticky>
  </nut-popup>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { CheckDisabled, Edit, MoreX, PlayStart, PlayStop } from '@nutui/icons-vue';
  import { computed, onMounted, ref } from 'vue';

  import { Chart } from 'chart.js/auto';
  import { getPlanInfo, getPlanOrders, updatePlanStatus } from '@/api';
  import { calculateRunTime, formatDateTime, formatScheduleInstant, parseInstant } from '@/utils/timeUtils';
  import { displayTimeZone } from '@/mobile/app-context';
  import { useWebSocketBase } from '@/utils/useWebSocket';

  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const planIdQuery = route.query.planId;
  const planId = Array.isArray(planIdQuery) ? planIdQuery[0] : planIdQuery;
  const emit = defineEmits<{ 'update-status': [] }>();
  const plan = ref<any>(null);
  const loading = ref(true);
  const updatingStatus = ref(false);
  const showOrderDetailsPopup = ref(false);
  const editStrategyNamePopup = ref(false);
  const currentOrder = ref<any>(null);
  const value = ref('c1');
  const list = ref([
    {
      title: t('details.tabs.returns'),
      paneKey: 'c1',
    },
    {
      title: t('details.tabs.strategyInfo'),
      paneKey: 'c2',
    },
    {
      title: t('details.tabs.trades'),
      paneKey: 'c3',
    },
  ]);
  const strategyName = ref('');
  const tradeOrders = ref<any[]>([]);
  const ordersPage = ref(0);
  const ordersLoading = ref(false);
  const infinityValue = ref(false);
  const hasMore = ref(false);
  const refresh = ref(false);
  const ORDER_PAGE_SIZE = 20;
  const tabPaneScrollStyle = { height: 'auto', overflow: 'visible' };

  const strategyNameHandler = (name: string) => {
    // 确保 name 参数有效
    if (name !== undefined && name !== null) {
      strategyName.value = name; // 正确的赋值方式
    }
    editStrategyNamePopup.value = true;
  };

  const strategyNameUpdateHandler = () => {
    plan.value.strategy.name = strategyName.value;
    console.log(t('details.saveSuccess'));
    // updatePlanName(plan.value.id, strategyName.value)
    //   .then(() => {
    //     emit('update-name');
    //   })
    //   .catch((error) => {
    //     console.error('更新计划名称失败:', error);
    //   });
    editStrategyNamePopup.value = false;
  };

  // 使用公共的WebSocket Hook
  // const { currentPrices, connect, disconnect } = useWebSocketBase();
  const { currentPrices, connect } = useWebSocketBase();

  onMounted(async () => {
    if (!planId) {
      loading.value = false;
      return;
    }
    try {
      plan.value = await getPlanInfo(planId, false);
      await loadOrders(true);
      initChart();

      // 建立WebSocket连接，订阅币种价格
      if (plan.value?.coins && plan.value.coins.length > 0) {
        const symbols = plan.value.coins.map((coin: any) => coin.symbol);
        // 基于当前页面URL构建WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/api/ws/price`;
        connect(wsUrl, symbols);
        // connect('http://127.0.0.1:8000/api/ws/price', symbols);
      }
    } catch (error) {
      console.error('Failed to load plan info:', error);
    } finally {
      loading.value = false;
    }
  });

  // 计算运行时间文本
  const runTimeText = computed(() => {
    return plan.value?.created_at ? calculateRunTime(plan.value.created_at) : '';
  });

  const nextBuyTimeText = computed(() => {
    if (!plan.value?.next_time) return { primary: '' };
    return formatScheduleInstant(plan.value.next_time, plan.value.strategy?.schedule_timezone || 'UTC', displayTimeZone());
  });

  // 计算图表标签
  const chartLabels = computed(() => {
    try {
      if (!plan.value?.snapshots || plan.value?.snapshots.length === 0) {
        return [''];
      }
      return plan.value?.snapshots.map((snapshot: any) => {
        const date = parseInstant(snapshot.created_at).setZone(displayTimeZone());
        const day = String(date.day).padStart(2, '0');
        const hour = String(date.hour).padStart(2, '0');
        return `${day}/${hour}:00`;
      });
    } catch (error) {
      console.error('生成图表标签出错:', error);
      return [''];
    }
  });

  function numbers() {
    const data: number[] = [];
    plan.value?.snapshots.map((snapshot: any) => {
      data.push(snapshot.value);
    });
    return data;
  }

  const generateData = () => numbers();

  // 将图表初始化逻辑提取为单独函数
  const initChart = () => {
    setTimeout(() => {
      const ctx = document.getElementById('chartDetails');
      if (ctx && plan.value?.snapshots?.length > 0) {
        // 重新计算数据
        const updatedData = {
          labels: chartLabels.value,
          datasets: [
            {
              data: generateData(),
              borderColor: 'green',
              fill: false,
              pointRadius: 0.6, // 调小数据点的半径
              pointHoverRadius: 1, // 设置鼠标悬停时的点半径
            },
          ],
        };

        new Chart(ctx as HTMLCanvasElement, {
          type: 'line',
          data: updatedData,
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
              intersect: false,
            },
            elements: {
              line: {
                tension: 0.8,
              },
            },
          },
        });
      }
    }, 100);
  };

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

  const tradeDetails = (order: any) => {
    try {
      console.log('tradeDetails', order);
      currentOrder.value = order;
      showOrderDetailsPopup.value = true;
      console.log('currentOrder', currentOrder.value);
    } catch (error) {
      console.error('Failed to load trade details:', error);
    }
  };

  const loadOrders = async (reset: boolean) => {
    if (!planId || ordersLoading.value || (!reset && !hasMore.value)) {
      infinityValue.value = false;
      refresh.value = false;
      return;
    }
    ordersLoading.value = true;
    const page = reset ? 0 : ordersPage.value;
    try {
      const result = await getPlanOrders(planId, page, ORDER_PAGE_SIZE);
      const incoming = result.items || [];
      tradeOrders.value = reset
        ? incoming
        : [...tradeOrders.value, ...incoming.filter((item) => !tradeOrders.value.some((current) => current.id === item.id))];
      ordersPage.value = result.page + 1;
      hasMore.value = result.has_more;
    } catch (error) {
      console.error('Failed to load trade history:', error);
    } finally {
      ordersLoading.value = false;
      infinityValue.value = false;
      refresh.value = false;
    }
  };

  const loadMore = async () => {
    await loadOrders(false);
  };

  const refreshFun = async () => {
    await loadOrders(true);
  };

  const handleClick = async (newStatus: string) => {
    if (!plan.value || updatingStatus.value) return;
    updatingStatus.value = true;
    try {
      await updatePlanStatus(plan.value.id, newStatus);
      if (newStatus === 'close') {
        router.back();
        return;
      }
      plan.value.status = newStatus;
      emit('update-status');
    } catch (error) {
      console.error('更新计划状态失败:', error);
    } finally {
      updatingStatus.value = false;
    }
  };
</script>

<style scoped>
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
  }

  .empty-container {
    padding: 20px;
  }

  .custom-tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
  }

  .custom-title {
    color: black;
    cursor: pointer;
  }

  .custom-title.active {
    color: cadetblue;
  }

  ::v-deep(.nut-tab-pane) {
    padding-right: 10px;
    padding-left: 10px;
  }
</style>
