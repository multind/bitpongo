<template>
  <nut-popup
    @update:visible="emit('update:visible', $event)"
    position="bottom"
    closeable
    round
    close-icon-position="top-right"
    :style="{ height: '90%', display: 'flex', flexDirection: 'column' }"
  >
    <nut-row type="flex" justify="space-between" wrap="nowrap" style="margin-top: 8px">
      <nut-col :span="22">
        <nut-searchbar v-model="keyword" :focus-style="{ outline: '1px solid red' }">
          <template #leftin><Search2 /></template>
        </nut-searchbar>
      </nut-col>
      <nut-col :span="2"></nut-col>
    </nut-row>

    <view class="tips">支持选择 1 至 20 个币种</view>

    <div class="coin-scroll">
      <nut-cell-group>
        <nut-cell center v-for="c in filteredCoins" :key="c.symbol" @click="handleCoinClick(c)">
          <nut-avatar :size="24">
            <img :src="c.icon" :alt="c.symbol" />
          </nut-avatar>
          <text class="symbol">{{ c.symbol }}</text>
          <nut-checkbox
            v-model="c.checked"
            icon-size="20"
            style="

              --nut-checkbox-margin-right: 0;

              margin-left: auto;
            "
            @click="handleCoinClick(c)"
          >
            <template #icon> <CheckNormal /> </template>
            <template #checkedIcon> <Checked color="black" /> </template>
          </nut-checkbox>
        </nut-cell>
      </nut-cell-group>
    </div>

    <view class="btn-bar">
      <nut-button type="default" style="width: 150px" @click="cancel"> 取 消 </nut-button>
      <nut-button color="black" style="width: 150px" @click="confirm"> 确 定 ( {{ selectedCount }} ) </nut-button>
    </view>
  </nut-popup>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { Checked, CheckNormal, Search2 } from '@nutui/icons-vue';
  import { showToast } from '@nutui/nutui';
  import type { Coin } from '@/views/list/types/strategy.ts';

  const emit = defineEmits<{ 'update:visible': [v: boolean]; confirm: [coins: Coin[]] }>();
  const cancel = () => emit('update:visible', false);
  const confirm = () => {
    // 获取选中的币种
    const selectedCoins = coins.value.filter((c) => c.checked);
    if (selectedCoins.length < 1) {
      showToast.warn('请选择至少一个币种');
      // 先检查数组是否为空
      if (coins.value.length > 0 && coins.value[0]) {
        coins.value[0].checked = true;
      }
      return;
    }
    // 发射选中的币种数据
    emit('update:visible', false);
    emit('confirm', selectedCoins);
  };

  /* 搜索关键字 */
  const keyword = ref('');
  const coins = ref([
    {
      symbol: 'AAVE',
      icon: new URL('../../../assets/coins/AAVE.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'ADA',
      icon: new URL('../../../assets/coins/ADA.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'APT',
      icon: new URL('../../../assets/coins/APT.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'ASTER',
      icon: new URL('../../../assets/coins/ASTER.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'AVAX',
      icon: new URL('../../../assets/coins/AVAX.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'BCH',
      icon: new URL('../../../assets/coins/BCH.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'BNB',
      icon: new URL('../../../assets/coins/BNB.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'BTC',
      icon: new URL('../../../assets/coins/BTC.png', import.meta.url).href,
      checked: true,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'CC',
      icon: new URL('../../../assets/coins/CC.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'CRO',
      icon: new URL('../../../assets/coins/CRO.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'DAI',
      icon: new URL('../../../assets/coins/DAI.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'DOGE',
      icon: new URL('../../../assets/coins/DOGE.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'DOT',
      icon: new URL('../../../assets/coins/DOT.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'ECT',
      icon: new URL('../../../assets/coins/ECT.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'ENA',
      icon: new URL('../../../assets/coins/ENA.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'ETH',
      icon: new URL('../../../assets/coins/ETH.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'HBAR',
      icon: new URL('../../../assets/coins/HBAR.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'HYPE',
      icon: new URL('../../../assets/coins/HYPE.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'ICP',
      icon: new URL('../../../assets/coins/ICP.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'LEO',
      icon: new URL('../../../assets/coins/LEO.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'LINK',
      icon: new URL('../../../assets/coins/LINK.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'LTC',
      icon: new URL('../../../assets/coins/LTC.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'M',
      icon: new URL('../../../assets/coins/M.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'MATIC',
      icon: new URL('../../../assets/coins/MATIC.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'MNT',
      icon: new URL('../../../assets/coins/MNT.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'NEAR',
      icon: new URL('../../../assets/coins/NEAR.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'OKB',
      icon: new URL('../../../assets/coins/OKB.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'PEPE',
      icon: new URL('../../../assets/coins/PEPE.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'POL',
      icon: new URL('../../../assets/coins/POL.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'SHIB',
      icon: new URL('../../../assets/coins/SHIB.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'SOL',
      icon: new URL('../../../assets/coins/SOL.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'SUI',
      icon: new URL('../../../assets/coins/SUI.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'TAO',
      icon: new URL('../../../assets/coins/TAO.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'TON',
      icon: new URL('../../../assets/coins/TON.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'TRX',
      icon: new URL('../../../assets/coins/TRX.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'UNI',
      icon: new URL('../../../assets/coins/UNI.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'WBTC',
      icon: new URL('../../../assets/coins/WBTC.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'WLD',
      icon: new URL('../../../assets/coins/WLD.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'WLFI',
      icon: new URL('../../../assets/coins/WLFI.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'XLM',
      icon: new URL('../../../assets/coins/XLM.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'XMR',
      icon: new URL('../../../assets/coins/XMR.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'XRP',
      icon: new URL('../../../assets/coins/XRP.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
    {
      symbol: 'ZEC',
      icon: new URL('../../../assets/coins/ZEC.png', import.meta.url).href,
      checked: false,
      max: null,
      min: null,
      proportion: null,
      average_down: false,
    },
  ]);

  const filteredCoins = computed(() => coins.value.filter((c) => c.symbol.toLowerCase().includes(keyword.value.toLowerCase())));

  const handleCoinClick = (coin: Coin) => {
    coin.checked = !coin.checked;
  };

  // 计算已选币种数量
  const selectedCount = computed(() => {
    return coins.value.filter((c) => c.checked).length;
  });
</script>

<style scoped>
  .tips {
    padding: 0 16px 8px;
    font-size: 20px;
    color: #999;
  }

  .symbol {
    margin-top: 5px;
    margin-left: 15px;
    font-family: 'Apple SD Gothic Neo', serif;
    font-size: 30px;
    font-weight: bold;
    color: gray;
    text-align: center;
  }

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
