<template>
  <nut-row>
    <nut-col span="24">
      <nut-cell title="买入价格区间" :desc="priceRangeDesc" is-link @click="showPopup = true">
        <template #desc>
          <span style="color: black">{{ priceRangeDesc }}</span>
        </template>
      </nut-cell>
    </nut-col>
    <nut-popup v-model:visible="showPopup" position="bottom" round :style="{ height: '60%', paddingTop: '4%', backgroundColor: '' }">
      <div class="coin-scroll">
        <div v-for="coin in strategy.coins" :key="coin.symbol">
          <nut-row type="flex" justify="space-evenly" wrap="nowrap" style="margin-top: 20px; margin-bottom: 5px">
            <nut-col :span="9">
              <nut-avatar :size="22">
                <img :src="coin.icon" :alt="coin.symbol" />
              </nut-avatar>
              <text style="margin: 5px; font-size: 16px; text-align: center">{{ coin.symbol }}</text>
            </nut-col>
            <nut-col :span="2" />
            <nut-col :span="9">
              <div style="font-size: 16px; text-align: right">
                {{ currentPrices[coin.symbol] || '-' }}
              </div>
            </nut-col>
          </nut-row>
          <nut-row type="flex" justify="space-evenly" wrap="nowrap">
            <nut-col :span="9">
              <nut-input
                :model-value="coin.min ?? undefined"
                placeholder="最低价"
                type="number"
                :border="true"
                style="background-color: #eee; border: #999 1px solid; border-radius: 5px"
                @update:model-value="coin.min = $event == null ? null : Number($event)"
              />
            </nut-col>
            <nut-col :span="2" align="center">
              <text style="font-size: 30px; text-align: center">-</text>
            </nut-col>
            <nut-col :span="9">
              <nut-input
                :model-value="coin.max ?? undefined"
                placeholder="最高价"
                input-align="right"
                type="number"
                :border="true"
                style="background-color: #eee; border: #999 1px solid; border-radius: 5px"
                @update:model-value="coin.max = $event == null ? null : Number($event)"
              />
            </nut-col>
          </nut-row>
        </div>
      </div>

      <view class="btn-bar">
        <nut-row type="flex" justify="space-evenly" style="margin-top: 40px">
          <nut-col span="22">
            <div v-if="percentageError" style="margin-bottom: 10px; color: red; text-align: center">
              {{ percentageError }}
            </div>
            <nut-button size="large" color="black" @click="confirm"> 确 认 </nut-button>
          </nut-col>
        </nut-row>
      </view>
    </nut-popup>
  </nut-row>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import type { Strategy } from '@/views/list/types/strategy.ts';
  import { useWebSocketBase } from '@/utils/useWebSocket.ts';

  interface Props {
    strategy: Strategy;
  }
  const props = defineProps<Props>();

  const showPopup = ref(false);
  const percentageError = ref('');
  const priceRangeDesc = ref('');

  // 使用WebSocket组合函数
  const { currentPrices, connect, disconnect } = useWebSocketBase();

  // 监听showPopup变化，控制WebSocket连接
  watch(showPopup, (newVal) => {
    if (newVal) {
      // 弹窗打开时建立WebSocket连接
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws/price`;
      const symbols = props.strategy.coins.map((coin) => coin.symbol);
      connect(wsUrl, symbols);
    } else {
      // 弹窗关闭时断开WebSocket连接
      disconnect();
    }
  });

  const confirm = () => {
    showPopup.value = false;
    priceRangeDesc.value = `已设置 ${props.strategy.coins.length} 个币种`;
  };

  // 监听币种变化，当币种发生变化时清空描述
  watch(
    () => props.strategy.coins.length,
    (newLength, oldLength) => {
      if (oldLength !== undefined && newLength !== oldLength) {
        priceRangeDesc.value = '';
      }
    },
    { immediate: true },
  );
</script>

<style scoped>
  .btn-bar {
    display: flex;
    gap: 12px;
    justify-content: center;
    width: 100%;
    max-width: 500px;
    padding: 12px 16px;
    margin: 0 auto;
    background: #fff;
    border-top: 1px solid #eee;
  }

  .coin-scroll {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
</style>
