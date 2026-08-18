<template>
  <nut-tabs v-model="value" align="left" size="large" swipeable background="#fff" title-gutter="10" :ellipsis="false">
    <nut-tab-pane :title="t('list.strategyTab')" pane-key="1">
      <nut-cell center :sub-title="t('list.costSubtitle')" is-link @click="() => toCreate(1)">
        <template #title>
          <text style="font-size: 15px; color: #101010">{{ t('list.dcaStrategy') }}</text>
        </template>
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
            <g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
              <path d="M9 20H6a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4v3M8 2v2m7-2v2M2 8h19m-2.5 7.643l-1.5 1.5" />
              <circle cx="17" cy="17" r="5" />
            </g>
          </svg>
        </template>
      </nut-cell>
    </nut-tab-pane>
    <nut-tab-pane :title="t('list.runningTab', { count: plans.length })" pane-key="2">
      <div v-if="plans.length">
        <PlanCard v-for="plan in plans" :key="plan.id" :plan="plan" @show-popup="handleShowPopup" @update-status="updateStatus" />
      </div>
      <nut-empty v-else>
        <template #image>
          <img src="@/assets/empty.svg" :alt="t('list.emptyAlt')" />
        </template>
      </nut-empty>
    </nut-tab-pane>
  </nut-tabs>
  <nut-popup v-model:visible="show" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '30%' }">
    <nut-row style="margin-top: 20px; text-align: center" type="flex">
      <nut-col span="24">
        <div style="font-size: 18px">{{ popupType === 'coinAverage' ? t('list.avgPricePopup') : t('list.coinProportionPopup') }}</div>
      </nut-col>
    </nut-row>
    <div v-if="currentPlan" style="margin-top: 20px">
      <nut-row v-for="coin in currentPlan.coins" :key="coin.id" type="flex" justify="space-around" style="margin-top: 10px">
        <nut-col span="9">
          <text>{{ coin.symbol }}</text>
        </nut-col>
        <nut-col span="9" align="right">
          <text v-if="popupType === 'coinAverage'">{{ coin.average ? coin.average : '-' }}</text>
          <text v-else>{{ coin.proportion }}%</text>
        </nut-col>
      </nut-row>
    </div>
    <div v-else>
      <text>{{ t('common.loading') }}</text>
    </div>
  </nut-popup>

  <nut-popup v-model:visible="sharePopup" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '75%' }">
    <nut-row style="margin-top: 23px; text-align: center" type="flex">
      <nut-col span="24">
        <div style="font-size: 18px">{{ t('list.sharePage') }}</div>
      </nut-col>
    </nut-row>
    <div id="capture" style="height: 460px; padding: 20px; margin: 15px; background-color: black; border: #999 solid 2px">
      <nut-row>
        <nut-col align="left" span="12">
          <div style="display: flex; align-items: center">
            <img style="margin-right: 10px; border-radius: 10px" src="../../assets/logo.png" height="30" width="30" alt="logo" />
            <text style="font-size: 18px; color: white; text-align: left">{{ getUserInfo }}</text>
          </div>
        </nut-col>
        <nut-col align="right" span="12">
          <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
            <text style="font-family: Osaka, Arial, sans-serif; font-size: 12px; color: #999; text-align: center">{{
              currentTime.time
            }}</text>
            <text style="font-family: Osaka, Arial, sans-serif; font-size: 12px; color: #999; text-align: center">{{
              currentTime.date
            }}</text>
          </nut-space>
        </nut-col>
      </nut-row>

      <img
        style="position: absolute; top: 100px; right: 60px; z-index: 1; transform: rotate(20deg)"
        src="../../assets/rocket.png"
        height="250"
        width="210"
        alt="rocket"
      />

      <nut-row style="margin-top: 130px" type="flex" wrap="nowrap">
        <nut-col span="24">
          <div
            style="font-family: 'PingFang HK', Avenir, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: bold; color: whitesmoke"
            >bitpongo</div
          >
        </nut-col>
      </nut-row>

      <nut-row style="margin-top: 10px" type="flex" wrap="nowrap">
        <nut-col span="24">
          <div style="font-size: 15px; color: #999">{{ t('list.totalReturnRate') }}</div>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col span="24">
          <div style="font-size: 40px; font-weight: bold; color: greenyellow">{{ currentPlan?.total_ratio }}%</div>
        </nut-col>
      </nut-row>

      <nut-row style="margin-top: 20px" type="flex" wrap="nowrap" :gutter="10">
        <nut-col align="center" :span="5">
          <nut-avatar-group max-count="2" z-index="left" span="-20" size="20">
            <nut-avatar v-for="(coin, index) in currentPlan?.coins" :key="index" size="35">
              <img :src="getCoinIconUrl(coin.symbol)" :alt="`${coin.symbol}`" />
            </nut-avatar>
          </nut-avatar-group>
        </nut-col>
        <nut-col align="left" :span="19">
          <nut-row>
            <nut-col span="8">
              <text style="font-size: 14px; color: white">{{ currentPlan?.strategy.name }}</text>
            </nut-col>
          </nut-row>
          <nut-row>
            <nut-col span="8">
              <text style="font-size: 12px; color: white" :style="{ color: currentPlan?.status === 'stop' ? '#FFA900' : 'white' }">
                {{ currentPlan?.status === 'stop' ? t('list.paused') : t('list.active') }}
              </text>
            </nut-col>
          </nut-row>
        </nut-col>
      </nut-row>

      <nut-row style="margin-top: 20px" type="flex" justify="space-around" wrap>
        <nut-col span="12">
          <div style="font-size: 15px; color: #999">{{ t('planCard.avgPrice') }}</div>
        </nut-col>
        <nut-col align="right" span="12">
          <div style="font-size: 16px; color: white">{{ coinAverageText }}</div>
        </nut-col>
      </nut-row>
      <nut-row style="margin-top: 5px" type="flex" justify="space-around" wrap>
        <nut-col span="12">
          <div style="font-size: 15px; color: #999">{{ t('planCard.frequencyTriggered') }}</div>
        </nut-col>
        <nut-col align="right" span="12">
          <div style="font-size: 16px; color: white">{{ currentPlan?.strategy.frequency }}</div>
        </nut-col>
      </nut-row>
      <nut-row style="margin-top: 5px" type="flex" justify="space-around" wrap>
        <nut-col span="12">
          <div style="font-size: 15px; color: #999">{{ t('planCard.totalReturn') }}</div>
        </nut-col>
        <nut-col align="right" span="12">
          <div style="font-size: 16px; color: greenyellow">{{ currentPlan?.total_revenue }} USDT</div>
        </nut-col>
      </nut-row>
    </div>
    <nut-row>
      <nut-col align="center" span="5" @click="saveFile">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              background-color: azure;
              border-radius: 50%;
            "
          >
            <Download width="20px" height="20px" />
          </div>
          <text style="font-size: 13px">{{ t('common.download') }}</text>
        </nut-space>
      </nut-col>
    </nut-row>
  </nut-popup>
</template>

<script setup lang="ts">
  import { Download } from '@nutui/icons-vue';
  import { useI18n } from 'vue-i18n';
  import PlanCard from './components/PlanCard.vue';
  import { activePlanList } from '@/api';
  import { ref } from 'vue';
  import { useUserStore } from '@/store/modules/user';
  import html2canvas from 'html2canvas';

  const { t } = useI18n();
  const userStore = useUserStore();
  const router = useRouter();
  const value = ref('1');
  const plans = ref<any[]>([]);

  const show = ref(false);
  const sharePopup = ref(false);
  const currentPlan = ref();
  const popupType = ref('coinAverage');

  // 处理子组件发出的显示弹窗事件
  const handleShowPopup = (plan: any, type: string) => {
    currentPlan.value = plan;
    if (type === 'shareButton') {
      sharePopup.value = true;
    } else {
      popupType.value = type;
      show.value = true;
    }
  };
  const getUserInfo = computed(() => {
    const { name = '' } = userStore.getUserInfo || {};
    return name;
  });

  const updateStatus = async () => {
    console.log('updateStatus');
    plans.value = await activePlanList();
  };

  const toCreate = (index: number) => {
    router.push({ path: '/create', query: { id: index } });
  };

  onMounted(async () => {
    plans.value = await activePlanList();
  });

  const currentTime = computed(() => {
    const now = new Date();
    // 获取年月日
    const datePart = now.toLocaleDateString();
    // 获取时分秒
    const timePart = now.toLocaleTimeString();
    return { date: datePart, time: timePart };
  });

  const defaultAvatar = new URL('../../assets/coins/BTC.png', import.meta.url).href;
  // 获取币种图标路径
  const getCoinIconUrl = (symbol: string) => {
    try {
      return new URL(`../../assets/coins/${symbol}.png`, import.meta.url).href;
    } catch (error) {
      // 如果找不到对应图标，则使用默认 BTC 图标
      console.log(error);
      return defaultAvatar;
    }
  };

  // 保存海报
  const saveFile = () => {
    const options = { useCORS: true, scale: 6 };
    const element = document.querySelector('#capture');
    html2canvas(<HTMLElement>element, options).then((canvas) => {
      canvas.toBlob(function (blob) {
        if (!blob) return;
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        const filename = 'poster.png';
        a.href = url;
        a.download = filename;
        a.click();
        // 当图片文件加载完成释放这个url
        window.URL.revokeObjectURL(url);
      });
    });
  };

  // 币种 | 均价
  const coinAverageText = computed(() => {
    try {
      let coinAverage = '';
      if (currentPlan.value?.coins && currentPlan.value?.coins.length > 0) {
        if (currentPlan.value?.coins.length <= 2) {
          // 币种数量不超过2个，全部显示
          currentPlan.value?.coins.forEach((coin: any) => {
            coinAverage += `${coin.symbol}, ${coin.average || '-'} `;
          });
        } else {
          // 币种数量超过2个，只显示前两个并加上省略号
          for (let i = 0; i < 2; i++) {
            const coin = currentPlan.value?.coins[i];
            coinAverage += `${coin.symbol} ${coin.average || '-'}, `;
          }
          coinAverage += '...';
        }
      }
      return coinAverage.trim();
    } catch (error) {
      console.error('计算 币种 | 均价 出错:', error);
      return '';
    }
  });
</script>

<style lang="scss" scoped>
  ::v-deep(.nut-tab-pane) {
    padding: 1.2vw 0.2vw !important;
  }

  .content {
    margin-bottom: 10px;
    line-height: 40px;
    color: #fff;
    text-align: center;
    background: #ff8881;
    border-radius: 6px;
  }

  ::v-deep(.nut-avatar-20) {
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 26px;
    line-height: 24px;
    color: white;
    text-align: center;
    background: red;
    border-radius: 50%;
  }
</style>
