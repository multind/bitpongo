<template>
  <div style="padding: 5px; background-color: #101010; border-radius: 10px">
    <nut-row type="flex" justify="start" style="padding: 5px 0; margin: 5px 0">
      <nut-col span="6" align="center">
        <div
          style="display: flex; align-items: center; justify-content: center; color: whitesmoke; background-color: #999; border-radius: 5px"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style="margin-left: 2px">
            <g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
              <path d="M9 20H6a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4v3M8 2v2m7-2v2M2 8h19m-2.5 7.643l-1.5 1.5" />
              <circle cx="17" cy="17" r="5" />
            </g>
          </svg>
          <text style="margin-left: 2px; font-size: 14px">{{ t('list.dcaStrategy') }}</text>
        </div>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="spase-around" style="margin: 5px 0">
      <nut-col span="17">
        <nut-row type="flex" justify="start" style="">
          <nut-col span="24">
            <text style="font-size: 16px; font-weight: bold; color: whitesmoke">BTC, ETH</text>
          </nut-col>
        </nut-row>
        <nut-row type="flex" justify="start" style="">
          <nut-col span="24">
            <text style="font-size: 12px; color: #c8c8c8">{{ t('home.strategySource') }}：cor***@gmail.com</text>
          </nut-col>
        </nut-row>
      </nut-col>
      <nut-col align="right" span="7">
        <nut-avatar-group size="22" max-count="3" max-content="..." z-index="left" style="display: inline-flex">
          <nut-avatar size="22" v-for="i in 40" :key="i">
            <img src="../../assets/coins/ADA.png" alt="" />
          </nut-avatar>
        </nut-avatar-group>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="space-between">
      <nut-col span="12" style="background-color: slategray; border-radius: 5px">
        <nut-row>
          <nut-col style="padding: 5px">
            <text style="font-size: 14px; color: #eee">{{ t('home.userCount') }}</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <nut-col style="padding: 5px">
            <text style="font-size: 12px; font-weight: bold; color: white">121</text>
          </nut-col>
        </nut-row>
      </nut-col>
      <nut-col span="0.5"></nut-col>
      <nut-col span="12" style="background-color: slategray; border-radius: 5px">
        <nut-row>
          <nut-col style="padding: 5px">
            <text style="font-size: 14px; color: #eee">{{ t('home.copyScale') }}</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <nut-col style="padding: 5px">
            <text style="font-size: 12px; font-weight: bold; color: white">1,231.31</text>
          </nut-col>
        </nut-row>
      </nut-col>
    </nut-row>
  </div>

  <nut-row>
    <nut-col span="24">
      <text>{{ t('home.performance') }}</text>
    </nut-col>
  </nut-row>
  <nut-divider :hairline="true" dashed />

  <nut-row type="flex" justify="space-around">
    <nut-col span="12" style="">
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 12px; color: #8c8c8c">{{ t('home.returnRate') }}</text>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 16px; font-weight: bold; color: green">+121%</text>
        </nut-col>
      </nut-row>
    </nut-col>
    <nut-col span="12" style="" align="right">
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 12px; color: #8c8c8c">{{ t('home.maxDrawdown7d') }}</text>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 16px; font-weight: bold; color: #101010">31.31%</text>
        </nut-col>
      </nut-row>
    </nut-col>
  </nut-row>

  <canvas id="myChart"></canvas>

  <nut-row :gutter="10">
    <nut-col :span="8" style="border: 1px solid #999; border-radius: 5px">
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 14px; color: #8c8c8c">{{ t('home.last3d') }}</text>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 16px; font-weight: bold; color: green">+0.74%</text>
        </nut-col>
      </nut-row>
    </nut-col>

    <nut-col :span="8" style="border: 1px solid #999; border-radius: 5px">
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 12px; color: #8c8c8c">{{ t('home.last7d') }}</text>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 16px; font-weight: bold; color: indianred">+0.74%</text>
        </nut-col>
      </nut-row>
    </nut-col>
    <nut-col :span="8" style="border: 1px solid #999; border-radius: 5px">
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 12px; color: #8c8c8c">{{ t('home.last30d') }}</text>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col style="padding: 5px">
          <text style="font-size: 16px; font-weight: bold; color: indianred">+12.74%</text>
        </nut-col>
      </nut-row>
    </nut-col>
  </nut-row>

  <nut-row>
    <nut-col span="24">
      <text>{{ t('home.detailParams') }}</text>
    </nut-col>
  </nut-row>

  <nut-row type="flex" justify="space-around">
    <nut-col style="padding: 5px">
      <text style="font-size: 14px; color: #8c8c8c">{{ t('home.frequency') }}</text>
    </nut-col>
    <nut-col align="right" style="padding: 5px">
      <text style="font-size: 14px; font-weight: bold; color: green">+121%</text>
    </nut-col>
  </nut-row>

  <nut-row type="flex" justify="space-around">
    <nut-col style="padding: 5px">
      <text style="font-size: 14px; color: #8c8c8c">{{ t('common.time') }}</text>
    </nut-col>
    <nut-col align="right" style="padding: 5px">
      <text style="font-size: 14px; font-weight: bold; color: green">+121%</text>
    </nut-col>
  </nut-row>

  <nut-row type="flex" justify="space-around">
    <nut-col style="padding: 5px">
      <text style="font-size: 14px; color: #8c8c8c">{{ t('list.coinProportionPopup') }}</text>
    </nut-col>
  </nut-row>

  <nut-row type="flex" justify="start" flex-wrap="wrap" :gutter="10">
    <nut-col v-for="i in 4" :key="i" span="12" style="background-color: slategray; border-radius: 5px">
      <nut-row type="flex" justify="space-around">
        <nut-col :span="10" style="padding: 5px">
          <nut-avatar size="20">
            <img src="../../assets/coins/ADA.png" alt="" />
          </nut-avatar>
          <text style="margin-left: 5px; font-size: 15px; font-weight: bold">ADA</text>
        </nut-col>
        <nut-col :span="4"></nut-col>
        <nut-col align="right" :span="10" style="padding: 5px">
          <text style="font-size: 14px; color: #eee">100%</text>
        </nut-col>
      </nut-row>
    </nut-col>
  </nut-row>

  <nut-row>
    <nut-col span="24">
      <text style="font-size: 18px">{{ t('home.whatIsDca') }}</text>
    </nut-col>
  </nut-row>
  <nut-row>
    <nut-col span="24">
      <text style="font-size: 16px">{{ t('home.dcaDesc1') }}</text>
    </nut-col>
  </nut-row>
  <nut-row>
    <nut-col span="24">
      <text style="font-size: 14px">{{ t('home.dcaDesc2') }}</text>
    </nut-col>
  </nut-row>
  <nut-row>
    <nut-col span="24">
      <text style="font-size: 16px">{{ t('home.dcaDesc3') }}</text>
    </nut-col>
  </nut-row>
  <nut-row>
    <nut-col span="24">
      <text style="font-size: 14px">{{ t('home.dcaDesc4') }}</text>
    </nut-col>
  </nut-row>

  <nut-button block size="small" @click="ha"> {{ t('home.useStrategy') }}</nut-button>

  <nut-popup v-model:visible="visible" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '60%' }">
    <div style="margin: 15px">
      <nut-row style="margin-top: 18px; text-align: center" type="flex">
        <nut-col span="24">
          <div style="font-size: 18px">{{ t('home.investmentAmount') }}</div>
        </nut-col>
      </nut-row>
      <nut-divider :hairline="true" dashed />

      <nut-row type="flex" justify="space-around">
        <nut-col :span="12" style="padding: 5px">
          <text style="font-size: 12px; color: slategray"> {{ t('home.inputAmount') }} </text>
        </nut-col>
        <nut-col align="right" :span="12" style="padding: 5px">
          <text style="font-size: 12px; color: slategray">{{ t('home.available') }}</text>
          <text style="font-size: 12px; color: black">{{ availableBalance }} USDT</text>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-between">
        <nut-col :span="24">
          <nut-input
            v-model="value"
            :placeholder="t('home.inputAmountPlaceholder')"
            type="number"
            style="padding: 1vw; margin-bottom: 10px; border: 1px solid #eee; border-radius: 5px"
          >
            <template #right>
              <nut-button @click="reduce" size="mini">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 12 12">
                    <path
                      fill="#000"
                      d="M4 5.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zM6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1M2 6a4 4 0 1 1 8 0a4 4 0 0 1-8 0"
                    />
                  </svg>
                </template>
              </nut-button>
              <nut-button @click="add" size="mini">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#000"
                      d="M12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m1 5h-2v4H7v2h4v4h2v-4h4v-2h-4z"
                    />
                  </svg>
                </template>
              </nut-button>
            </template>
          </nut-input>
        </nut-col>
      </nut-row>
      <nut-progress
        :percentage="val"
        text-inside
        stroke-color="linear-gradient(270deg, rgba(18,126,255,1) 0%,rgba(32,147,255,1) 32.815625%,rgba(13,242,204,1) 100%)"
        status="active"
      />

      <nut-row type="flex" justify="space-around">
        <nut-col :span="24" style="margin: 15px 5px">
          <text style="font-size: 12px; color: grey"> {{ t('home.firstBuyTime') }}2022-12-16 09:00:00 </text>
        </nut-col>
      </nut-row>
      <nut-divider :hairline="true" dashed />

      <nut-row type="flex" justify="start" style="">
        <nut-col style="padding: 5px" span="12">
          <text style="font-size: 14px; color: grey">{{ t('home.strategySource') }}</text>
        </nut-col>

        <nut-col align="right" span="12">
          <nut-avatar size="20">
            <img src="../../assets/coins/ADA.png" alt="" />
          </nut-avatar>
          <text style="font-size: 14px; color: #000">cor***@gmail.com</text>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-around">
        <nut-col style="padding: 5px">
          <text style="font-size: 14px; color: grey">{{ t('home.frequency') }}</text>
        </nut-col>
        <nut-col align="right" style="padding: 5px">
          <text style="font-size: 14px; font-weight: bold; color: #000">{{ t('frequency.daily') }}</text>
        </nut-col>
      </nut-row>

      <nut-row type="flex" justify="space-around">
        <nut-col style="padding: 5px">
          <text style="font-size: 14px; color: grey">{{ t('common.time') }}</text>
        </nut-col>
        <nut-col align="right" style="padding: 5px">
          <text style="font-size: 14px; font-weight: bold; color: #000">15：00</text>
        </nut-col>
      </nut-row>
      <nut-divider :hairline="true" dashed />
      <nut-row type="flex" justify="space-around">
        <nut-col span="24" style="padding: 5px">
          <text style="font-size: 14px; color: grey">{{ t('home.sameParamsDisclaimer') }}</text>
        </nut-col>
      </nut-row>
      <nut-button block size="small" color="black"> {{ t('home.useStrategy') }} </nut-button>
    </div>
  </nut-popup>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Chart, type ChartConfiguration } from 'chart.js/auto';

  const { t } = useI18n();
  const availableBalance = ref(485.37);
  const val = ref(0);
  const value = ref(0);
  const add = () => {
    if (val.value >= 100) {
      return false;
    }
    val.value += 10;
    value.value = (val.value * availableBalance.value) / 100;
  };
  const reduce = () => {
    if (val.value <= 0) {
      return false;
    }
    val.value -= 10;
    value.value = (val.value * availableBalance.value) / 100;
  };

  const visible = ref(false);

  const ha = () => {
    visible.value = true;
  };
  // 为每个数据点设置不同的颜色
  const getDataColors = (data: number[]) => {
    return data.map((value) => (value < 0 ? 'darkred' : 'green'));
  };

  const data = {
    labels: ['12-16', '12-17', '12-18', '12-19', '12-20', '12-21', '12-22', '12-23', '12-24'],
    datasets: [
      {
        data: [32, 23, 54, 22, 17, 42, 51, -22, 13],
        borderWidth: 2,
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
        borderColor: 'green',
        // backgroundColor: 'green',
        fill: true,
        pointRadius: 1.5, // 调小数据点的半径
        pointHoverRadius: 3, // 设置鼠标悬停时的点半径
        // 为每个数据点设置颜色
        // pointBackgroundColor: getDataColors([32, 23, 54, 22, 17, 42, 51, -22, 13]),
        pointBorderColor: getDataColors([32, 23, 54, 22, 17, 42, 51, -22, 13]),
      },
    ],
  };

  const config: ChartConfiguration = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
      },
      interaction: {
        intersect: true,
      },
      elements: {
        line: {
          tension: 0.5,
        },
      },
      scales: {
        x: {
          display: true,
        },
        y: {
          display: true,
        },
      },
    },
  };
  onMounted(() => {
    const ctx = document.getElementById('myChart');
    if (ctx) {
      new Chart(ctx as HTMLCanvasElement, config);
    }
  });
</script>

<style lang="scss" scoped>
  ::v-deep(.nut-input) {
    padding: 0.6667vw;
  }
</style>
