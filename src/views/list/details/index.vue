<template>
  <div v-if="loading" class="loading-container">
    <text style="margin-left: 10px">加载中...</text>
  </div>

  <div v-else-if="plan">
    <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-top: 10px">
      <nut-col align="left" span="18">
        <text style="font-size: 15px">{{ plan.strategy.name }}</text
        >&nbsp;<Edit width="13px" height="13px" @click="strategyNameHandler(plan.strategy.name)" />
      </nut-col>
      <nut-col align="right" span="6">
        <text style="font-size: 15px">{{ plan.status === 'active' ? '运行中' : '已暂停' }}</text>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-top: 5px">
      <nut-col align="left" span="24">
        <nut-space>
          <nut-tag style="font-size: 11px">定投策略</nut-tag>
          <nut-tag style="font-size: 11px">Binance</nut-tag>
        </nut-space>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-top: 5px">
      <nut-col align="left" span="12">
        <nut-space>
          <text style="font-size: 13px; color: #999">{{ runTimeText }}</text>
        </nut-space>
      </nut-col>
      <nut-col align="right" span="12">
        <text style="font-size: 13px; color: #999">创建</text>&nbsp;
        <text style="font-size: 13px; color: #999">{{ formatDateTime(plan.created_at) }}</text>
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
      <nut-tab-pane pane-key="c1">
        <nut-row>
          <nut-col>
            <text>总收益（USDT）</text>
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
            <text>金额</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>{{ plan.total_value }} USDT</text>
          </nut-col>
        </nut-row>

        <nut-row type="flex" justify="space-between" wrap="nowrap">
          <nut-col span="18">
            <text>累计定投</text>
          </nut-col>

          <nut-col align="right" span="6">
            <text>{{ plan.total_funds }} USDT</text>
          </nut-col>
        </nut-row>

        <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-top: 40px">
          <nut-col span="24">
            <text style="font-size: 16px">收益变化</text>
          </nut-col>
        </nut-row>

        <nut-row>
          <nut-col :span="24">
            <canvas id="chartDetails"></canvas>
          </nut-col>
        </nut-row>
      </nut-tab-pane>

      <nut-tab-pane pane-key="c2">
        <nut-row type="flex">
          <nut-col span="12">
            <text>买入币对的计价</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>USDT</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>定投频率</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>{{ plan.strategy.frequency }}</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>下次买入时间</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>{{ formatDateTime(plan.next_time) }}</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>每期金额</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>{{ plan.strategy.instalment }} USDT</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>已触发定投期数</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>{{ plan.triggered_count }}</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" style="margin-top: 10px">
          <nut-col span="12">
            <text>交易币种</text>
          </nut-col>
          <nut-col align="right" span="12">
            <text>USDT</text>
          </nut-col>
        </nut-row>

        <nut-divider :hairline="true" style="margin-top: 20px; margin-bottom: 20px" />
        <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
          <nut-col>
            <text style="font-size: 18px">币种配置</text>
          </nut-col>
        </nut-row>

        <div v-for="(coin, index) in plan.coins" :key="coin.symbol" style="margin-bottom: 10px">
          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col style="display: flex; align-items: center; justify-content: flex-start">
              <img :src="getCoinIconUrl(coin.symbol)" :alt="`${coin.symbol}`" height="16" width="16" />
              <text> {{ coin.symbol }} </text>&nbsp;|&nbsp;<text>{{ coin.proportion }}%</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ currentPrices[coin.symbol] || '加载中...' }}</text>
            </nut-col>
          </nut-row>

          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col>
              <text>价格区间</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ coin.min || '' }} - {{ coin.max || '' }}</text>
            </nut-col>
          </nut-row>

          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col>
              <text>累计购入数量</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ coin.total_amount || '' }}</text>
            </nut-col>
          </nut-row>

          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col>
              <text>定投收益（USDT）</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ coin.income || '' }}</text>
            </nut-col>
          </nut-row>

          <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-bottom: 10px">
            <nut-col>
              <text>定投均价（USDT)</text>
            </nut-col>
            <nut-col align="right">
              <text>{{ coin.average }}</text>
            </nut-col>
          </nut-row>
          <nut-divider v-if="index < plan.coins.length - 1" :hairline="true" dashed style="margin-top: 10px; margin-bottom: 10px" />
        </div>
      </nut-tab-pane>

      <nut-tab-pane pane-key="c3">
        <nut-pull-refresh v-model="refresh" @refresh="refreshFun">
          <nut-infinite-loading v-model="infinityValue" :has-more="hasMore" @load-more="loadMore">
            <div v-if="plan.orders">
              <div v-for="(order, index) in plan.orders" :key="order.id">
                <nut-row>
                  <nut-col span="18">
                    <nut-row>
                      <nut-col>
                        <text style="font-size: 15px; font-weight: bold">{{ order.symbol }}</text>
                      </nut-col>
                    </nut-row>
                    <nut-row type="flex" justify="start" wrap="nowrap">
                      <nut-col span="4">
                        <nut-tag style="font-size: 12px">买入</nut-tag>
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
                    <text style="color: #999">成交均价</text>
                  </nut-col>
                  <nut-col align="right" span="12">
                    <text>{{ order.average_price }} USDT</text>
                  </nut-col>
                </nut-row>
                <nut-row type="flex" justify="start" wrap="nowrap" style="margin-top: 10px">
                  <nut-col span="12">
                    <text style="color: #999">已成交</text>
                  </nut-col>
                  <nut-col align="right" span="12">
                    <text>{{ order.total_amount }} USDT</text>
                  </nut-col>
                </nut-row>
                <nut-divider v-if="index < plan.orders.length - 1" :hairline="true" dashed style="margin-top: 10px; margin-bottom: 10px" />
              </div>
            </div>
            <nut-empty v-else></nut-empty>
          </nut-infinite-loading>
        </nut-pull-refresh>
      </nut-tab-pane>
    </nut-tabs>

    <nut-sticky position="bottom">
      <nut-row type="flex" :gutter="10" style="padding-top: 10px; padding-bottom: 10px; background-color: whitesmoke">
        <nut-col align="center" :span="12">
          <nut-button v-if="plan.status === 'active'" @click="handleClick('stop')">
            <template #icon>
              <PlayStop />
            </template>
            暂停
          </nut-button>
          <nut-button v-else @click="handleClick('active')">
            <template #icon>
              <PlayStart />
            </template>
            重启
          </nut-button>
        </nut-col>
        <nut-col align="center" :span="12">
          <nut-button>
            <template #icon>
              <CheckDisabled />
            </template>
            停止
          </nut-button>
        </nut-col>
      </nut-row>
    </nut-sticky>
  </div>

  <div v-else class="empty-container">
    <nut-empty description="数据加载失败" />
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
        <div style="font-size: 18px">成交明细</div>
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
            <nut-tag style="font-size: 12px">买入</nut-tag>
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
            <text style="font-size: 14px; color: #999">成交总额（USDT）</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <text>{{ currentOrder?.total_amount }} </text>
        </nut-row>
      </nut-col>
      <nut-col span="10">
        <nut-row>
          <nut-col span="24">
            <text style="font-size: 14px; color: #999">成交均价（USDT）</text>
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
            <text style="font-size: 14px; color: #999">成交数量（{{ currentOrder?.symbol.split('/')[0] }}）</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <text>{{ currentOrder?.total_cost }}</text>
        </nut-row>
      </nut-col>
      <nut-col span="10">
        <nut-row>
          <nut-col span="24">
            <text style="font-size: 14px; color: #999">手续费（{{ currentOrder?.symbol.split('/')[0] }}）</text>
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
        <div style="font-size: 18px">修改策略名称</div>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around" style="margin-top: 20px">
      <nut-col span="22">
        <text style="font-size: 15px; font-weight: bold">策略名称</text>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-around" style="margin-top: 10px">
      <nut-col span="22">
        <nut-input
          v-model="strategyName"
          placeholder="请输入策略名称"
          :border="true"
          style="background-color: #eee; border: #999 1px solid; border-radius: 5px"
        />
      </nut-col>
    </nut-row>
    <nut-sticky bottom="5" position="bottom">
      <nut-row type="flex" justify="center" :gutter="10" style="margin-top: 20px">
        <nut-col :span="22">
          <nut-button size="large" style="background-color: #101010" @click="strategyNameUpdateHandler">
            <text style="color: whitesmoke"> 保 存 </text>
          </nut-button>
        </nut-col>
      </nut-row>
    </nut-sticky>
  </nut-popup>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router';
  import { CheckDisabled, Edit, MoreX, PlayStart, PlayStop } from '@nutui/icons-vue';
  import { computed, onMounted, ref } from 'vue';

  import { Chart } from 'chart.js/auto';
  import { getPlanInfo, updatePlanStatus } from '@/api';
  import { calculateRunTime, formatDateTime } from '@/utils/timeUtils';
  import { useWebSocketBase } from '@/utils/useWebSocket';

  const route = useRoute();
  const planId = route.query.planId;
  const plan = ref<any>(null);
  const loading = ref(true);
  const showOrderDetailsPopup = ref(false);
  const editStrategyNamePopup = ref(false);
  const currentOrder = ref<any>(null);
  const value = ref('c1');
  const list = ref([
    {
      title: '收益详情',
      paneKey: 'c1',
    },
    {
      title: '策略信息',
      paneKey: 'c2',
    },
    {
      title: '成交记录',
      paneKey: 'c3',
    },
  ]);
  const strategyName = ref('');

  const strategyNameHandler = (name: string) => {
    // 确保 name 参数有效
    if (name !== undefined && name !== null) {
      strategyName.value = name; // 正确的赋值方式
    }
    editStrategyNamePopup.value = true;
  };

  const strategyNameUpdateHandler = () => {
    plan.value.strategy.name = strategyName.value;
    console.log('保存成功');
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
      plan.value = await getPlanInfo(planId);
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

  // 计算图表标签
  const chartLabels = computed(() => {
    try {
      if (!plan.value?.snapshots || plan.value?.snapshots.length === 0) {
        return [''];
      }
      return plan.value?.snapshots.map((snapshot: any) => {
        const date = new Date(snapshot.created_at);
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
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

  const infinityValue = ref(false);
  const hasMore = ref(true);
  const loadMore = () => {
    // setTimeout(() => {
    //   sum.value = sum.value + 24;
    //   cycle.value++;
    //   if (cycle.value > 2) hasMore.value = false;
    //   infinityValue.value = false;
    // }, 1000);
  };

  const refresh = ref(false);
  const refreshFun = () => {
    setTimeout(() => {
      refresh.value = false;
    }, 3000);
  };

  const handleClick = (newStatus: string) => {
    updatePlanStatus(plan.value.id, newStatus)
      .then(() => {
        emit('update-status');
      })
      .catch((error) => {
        console.error('更新计划状态失败:', error);
      });
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
    max-height: 60vh;
    padding-right: 10px;
    padding-left: 10px;
    overflow-y: auto;
  }
</style>
