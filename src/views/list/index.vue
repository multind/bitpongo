<template>
  <RouterLink class="presets-entry" to="/presets">
    <span class="presets-icon"><PageIcon name="chart" /></span>
    <span class="presets-copy">
      <strong>{{ t('presets.entry') }}</strong>
      <small>{{ t('presets.entryHint') }}</small>
    </span>
    <PageIcon class="presets-chevron" name="chevron" />
  </RouterLink>
  <nut-tabs class="plan-tabs" v-model="value" align="left" size="large" swipeable background="#fff" title-gutter="32" :ellipsis="false">
    <nut-tab-pane :title="t('list.strategyTab')" pane-key="1">
      <nut-cell-group>
        <nut-cell class="strategy-choice" center :sub-title="t('list.costSubtitle')" is-link @click="() => toCreate(1)">
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
        <nut-cell class="strategy-choice" center :sub-title="t('list.fngSubtitle')" is-link @click="router.push('/fng/create')">
          <template #title>
            <text style="font-size: 15px; color: #101010">{{ t('list.fngStrategy') }}</text>
          </template>
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
              <g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                <path d="M3 3v18h18M7 14l4-5 4 3 5-7" />
              </g>
            </svg>
          </template>
        </nut-cell>
      </nut-cell-group>
    </nut-tab-pane>
    <nut-tab-pane :title="t('list.runningTab', { count: runningCount })" pane-key="2">
      <div v-if="plans.length || fngStrategies.length">
        <section v-if="fngStrategies.length" class="fng-list">
          <h2 class="fng-list-title">{{ t('fng.listTitle') }}</h2>
          <article v-for="strategy in fngStrategies" :key="strategy.id" class="fng-card">
            <div class="fng-head">
              <img class="fng-coin" :src="getCoinIconUrl(strategy.symbol.replace(/USDT$/, ''))" alt="" />
              <div class="fng-title">
                <strong>{{ strategy.name }}</strong>
                <span>{{ t('fng.listTitle') }}</span>
              </div>
              <span class="fng-status" :class="{ active: strategy.enabled }">{{
                strategy.enabled ? t('list.active') : t('list.paused')
              }}</span>
            </div>
            <p class="fng-runtime">{{ calculateRunTime(strategy.createdAt) }}</p>
            <dl class="fng-stats">
              <div
                ><dt>{{ t('fng.symbol') }}</dt
                ><dd>{{ strategy.symbol }}</dd></div
              >
              <div
                ><dt>{{ t('fng.exchange') }}</dt
                ><dd>{{ strategy.exchange }}</dd></div
              >
              <div
                ><dt>{{ t('fng.direction') }}</dt
                ><dd>{{ strategy.direction === 'LONG' ? t('fng.long') : t('fng.short') }}</dd></div
              >
              <div
                ><dt>{{ t('fng.basicAmount') }}</dt
                ><dd>{{ strategy.basicAmount }} USDT</dd></div
              >
              <div
                ><dt>{{ t('fng.leverage') }}</dt
                ><dd>{{ strategy.leverage }}x</dd></div
              >
              <div
                ><dt>{{ t('fng.upper') }} / {{ t('fng.lower') }}</dt
                ><dd>{{ strategy.upperLimitValue }} / {{ strategy.lowerLimitValue }}</dd></div
              >
              <div>
                <dt>{{ t('fng.profitTargetPercent') }} / {{ t('fng.profitDrawdownPercent') }}</dt>
                <dd>{{ strategy.profitTargetPercent }}% / {{ strategy.profitDrawdownPercent }}%</dd>
              </div>
              <div>
                <dt>{{ t('fng.maxOrders') }} / {{ t('fng.maxPositions') }}</dt>
                <dd>{{ strategy.maxOrders }} / {{ strategy.maxPositions }}</dd>
              </div>
            </dl>
            <div class="fng-actions">
              <button type="button" class="fng-action" @click="toggleFng(strategy)">{{
                strategy.enabled ? t('common.pause') : t('common.resume')
              }}</button>
              <button type="button" class="fng-action danger" @click="removeFng(strategy)">{{ t('common.delete') }}</button>
              <button type="button" class="fng-action" @click="router.push(`/fng/details/${strategy.id}`)">{{
                t('planCard.details')
              }}</button>
            </div>
          </article>
        </section>
        <div v-if="plans.length">
          <PlanCard v-for="plan in plans" :key="plan.id" :plan="plan" @show-popup="handleShowPopup" @update-status="updateStatus" />
        </div>
        <button v-if="planMore || fngMore" class="running-load-more" type="button" :disabled="listBusy" @click="loadRunning(true)">{{
          listBusy ? t('common.loading') : t('fng.loadMore')
        }}</button>
      </div>
      <p v-else-if="listBusy" role="status">{{ t('common.loading') }}</p>
      <nut-empty v-else-if="!listError">
        <template #image>
          <img src="@/assets/empty.svg" :alt="t('list.emptyAlt')" />
        </template>
      </nut-empty>
      <p v-if="listError" role="alert"
        >{{ t('alerts.failed') }}
        <button type="button" :disabled="listBusy" @click="loadRunning(plans.length > 0 || fngStrategies.length > 0)">{{
          t('market.retry')
        }}</button></p
      >
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
            <text style="font-size: 12px; color: #999; text-align: center">{{ currentTime.time }}</text>
            <text style="font-size: 12px; color: #999; text-align: center">{{ currentTime.date }}</text>
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
          <div style="font-size: 22px; font-weight: bold; color: whitesmoke">Bitpongo</div>
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
  import PageIcon from '@/components/PageIcon.vue';
  import { useI18n } from 'vue-i18n';
  import PlanCard from './components/PlanCard.vue';
  import { planPage } from '@/api';
  import { ref, onUnmounted } from 'vue';
  import { useUserStore } from '@/store/modules/user';
  import html2canvas from 'html2canvas';
  import { hasNativeChannel, saveCanvasImage } from '@/mobile/bridge';
  import { showDialog, showToast } from '@nutui/nutui';
  import { calculateRunTime } from '@/utils/timeUtils';
  import { deleteFngStrategy, fngStrategyPage, setFngStrategyEnabled, type FngStrategy } from '@/api/fngStrategies';

  const { t } = useI18n();
  const userStore = useUserStore();
  const router = useRouter();
  const value = ref('1');
  const plans = ref<any[]>([]);
  const fngStrategies = ref<FngStrategy[]>([]);
  const runningCount = ref(0);
  const planMore = ref(false),
    fngMore = ref(false),
    listBusy = ref(false),
    listError = ref(false);
  let planCursor = -1,
    fngCursor = -1,
    listRequest = 0;
  async function loadRunning(append = false) {
    if (append && listBusy.value) return;
    const request = ++listRequest;
    listBusy.value = true;
    listError.value = false;
    try {
      const [p, f] = await Promise.all([
        !append || planMore.value ? planPage(append ? planCursor + 1 : 0) : null,
        !append || fngMore.value ? fngStrategyPage(append ? fngCursor + 1 : 0) : null,
      ]);
      if (request !== listRequest) return;
      if (p) {
        plans.value = append
          ? [...plans.value, ...p.items.filter((item) => !plans.value.some((existing) => existing.id === item.id))]
          : p.items;
        planMore.value = p.hasMore;
        planCursor = append ? planCursor + 1 : 0;
      }
      if (f) {
        fngStrategies.value = append
          ? [...fngStrategies.value, ...f.items.filter((item) => !fngStrategies.value.some((existing) => existing.id === item.id))]
          : f.items;
        fngMore.value = f.hasMore;
        fngCursor = append ? fngCursor + 1 : 0;
      }
      runningCount.value = (p?.activeTotal ?? planActive) + (f?.activeTotal ?? fngActive);
      if (p) planActive = p.activeTotal;
      if (f) fngActive = f.activeTotal;
    } catch {
      if (request === listRequest) listError.value = true;
    } finally {
      if (request === listRequest) listBusy.value = false;
    }
  }
  let planActive = 0,
    fngActive = 0;
  onUnmounted(() => listRequest++);

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
    await loadRunning();
  };

  const toCreate = (index: number) => {
    router.push({ path: '/create', query: { id: index } });
  };

  async function loadFngStrategies() {
    await loadRunning();
  }

  async function toggleFng(strategy: FngStrategy) {
    try {
      await setFngStrategyEnabled(strategy.id, !strategy.enabled);
      strategy.enabled = !strategy.enabled;
      await loadRunning();
    } catch {
      showToast.fail(t('fng.createFailed'));
    }
  }

  function removeFng(strategy: FngStrategy) {
    showDialog({
      title: t('common.delete'),
      content: t('fng.deleteConfirm'),
      onOk: async () => {
        try {
          await deleteFngStrategy(strategy.id);
          await loadFngStrategies();
        } catch {
          showToast.fail(t('fng.createFailed'));
        }
      },
    });
  }

  onMounted(async () => {
    await loadRunning();
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
  const saveFile = async () => {
    const element = document.querySelector('#capture');
    if (!element) return;
    const toast = showToast.loading(t('common.loading'), {
      'cover-color': 'rgba(0, 0, 0, 0.5)',
      duration: 0,
      cover: true,
    });
    try {
      const canvas = await html2canvas(<HTMLElement>element, { useCORS: true, scale: 2 });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      if (hasNativeChannel()) {
        const saved = await saveCanvasImage(dataUrl);
        toast.hide();
        if (saved) {
          showToast.success(t('common.saveSuccess'));
        } else {
          showToast.fail(t('common.saveFailed'));
        }
        return;
      }
      toast.hide();
      canvas.toBlob(function (blob) {
        if (!blob) return;
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        const filename = 'poster.png';
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // 当图片文件加载完成释放这个url
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      });
    } catch (error) {
      console.error('保存海报失败:', error);
      toast.hide();
      showToast.fail(t('common.saveFailed'));
    }
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
  .running-load-more {
    width: 100%;
    min-height: 2.75rem;
    margin: 0.75rem 0;
    font-size: 0.78rem;
    color: #1989fa;
    background: #f5f1ee;
    border: 0;
    border-radius: 0.75rem;
  }

  .plan-tabs {
    --nut-tabs-horizontal-tab-line-color: #1989fa;
    --nut-tabs-titles-item-active-color: #1989fa;
  }

  .fng-list {
    margin-bottom: 0.75rem;
  }

  .fng-list-title {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    color: #615a53;
  }

  .fng-card {
    padding: 1rem;
    margin-bottom: 0.75rem;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .fng-head {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }

  .fng-coin {
    flex-shrink: 0;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 50%;
  }

  .fng-title {
    flex: 1;
    min-width: 0;
  }

  .fng-title strong {
    display: block;
    font-size: 0.9rem;
    overflow-wrap: anywhere;
  }

  .fng-title span {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.65rem;
    color: #9a8d82;
  }

  .fng-runtime {
    margin: 0.55rem 0 0;
    font-size: 0.7rem;
    color: #8a8681;
  }

  .fng-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem 0.75rem;
    margin: 0.75rem 0 0;
  }

  .fng-stats dt {
    font-size: 0.65rem;
    color: #8a8681;
  }

  .fng-stats dd {
    margin: 0.15rem 0 0;
    font-size: 0.78rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .fng-status {
    flex-shrink: 0;
    padding: 0.15rem 0.4rem;
    font-size: 0.65rem;
    color: #81766b;
    background: #eee8e2;
    border-radius: 0.3rem;
  }

  .fng-status.active {
    color: #328642;
    background: #e7f4e8;
  }

  .fng-meta {
    margin: 0.45rem 0 0;
    font-size: 0.72rem;
    line-height: 1.5;
    color: #8a8681;
  }

  .fng-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.6rem;
  }

  .fng-action {
    flex: 1;
    min-height: 2.2rem;
    font: inherit;
    font-size: 0.75rem;
    color: #1989fa;
    background: #f5f1ee;
    border: 0;
    border-radius: 0.55rem;
  }

  .fng-action.danger {
    color: #b93d31;
  }

  .presets-entry {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.9rem 1rem;
    margin: 0.75rem 0;
    color: inherit;
    text-decoration: none;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  :deep(.strategy-choice) {
    padding: 1rem;
    margin: 0.75rem 0;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
    box-shadow: none;
  }

  .presets-icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    color: #fb791a;
    background: #fff1e4;
    border-radius: 50%;
  }

  .presets-copy {
    flex: 1;
    min-width: 0;
  }

  .presets-copy strong {
    display: block;
    font-size: 0.9rem;
  }

  .presets-copy small {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.72rem;
    color: #8a8681;
  }

  .presets-chevron {
    width: 1rem;
    color: #b8aba0;
  }

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
</style>
