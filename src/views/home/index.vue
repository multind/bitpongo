<template>
  <div class="container">
    <nut-row type="flex" justify="space-around" style="margin: 10px 0">
      <nut-col span="12">
        <nut-row>
          <nut-col span="24">
            <text style="font-size: 12px; color: #2f2f2f">{{ t('home.totalValue') }}</text>
          </nut-col>
        </nut-row>
        <nut-row>
          <nut-col> <text style="font-size: 16px; font-weight: bold">249.12</text><text style="font-size: 11px"> USDT</text> </nut-col>
        </nut-row>
      </nut-col>
      <nut-col align="right" span="12">
        <nut-avatar>
          <img src="https://p9-passport.byteacctimg.com/img/user-avatar/42fccde2ed5d5ffe2de81ca2c7e4e698~80x80.awebp" alt="avatar" />
        </nut-avatar>
      </nut-col>
    </nut-row>
    <nut-tabs align="left" size="normal" swipeable :ellipsis="false" style="font-size: 14px">
      <nut-tab-pane :title="t('home.strategy')" pane-key="1">
        <nut-row type="flex" justify="space-around" style="margin-top: 10px; border-bottom: 1px dashed #ccc">
          <nut-col span="12">
            <text>{{ t('home.strategySquare') }}</text>
          </nut-col>
          <nut-col align="right" span="12">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" @click="showTips">
              <path
                fill="currentColor"
                d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4l-4 4l-4-4H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m0 2v12h4.83L12 19.17L15.17 16H20V4zm2 3h12v2H6zm0 4h10v2H6z"
              />
            </svg>
          </nut-col>
        </nut-row>
        <nut-row type="flex" justify="space-between" style="margin-top: 10px">
          <nut-col align="left" span="5">
            <nut-row>
              <nut-col span="20">
                <div
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2px;
                    text-align: center;
                    background-color: #5f5f5f;
                    border-radius: 10px;
                  "
                  @click="showSortList"
                >
                  <text style="font-size: 12px">{{ t('home.revenueAmount') }}</text>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                    <path fill="currentColor" stroke="currentColor" stroke-linejoin="round" stroke-width="4" d="M36 19L24 31L12 19z" />
                  </svg>
                </div>
              </nut-col>
            </nut-row>
          </nut-col>
          <nut-col align="right" span="3">
            <nut-row>
              <nut-col span="12">
                <div style="display: flex; align-items: center; justify-content: center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" @click="showSearch">
                    <path
                      fill="currentColor"
                      d="M232.49 215.51L185 168a92.12 92.12 0 1 0-17 17l47.53 47.54a12 12 0 0 0 17-17ZM44 112a68 68 0 1 1 68 68a68.07 68.07 0 0 1-68-68"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    style="margin-left: 5px"
                    @click="showFilter"
                  >
                    <g fill="none" fill-rule="evenodd">
                      <path
                        d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"
                      />
                      <path
                        fill="currentColor"
                        d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v2.086A2 2 0 0 1 20.414 8L15 13.414v7.424a1.1 1.1 0 0 1-1.592.984l-3.717-1.858A1.25 1.25 0 0 1 9 18.846v-5.432L3.586 8A2 2 0 0 1 3 6.586zM5 5v1.586l5.56 5.56a1.5 1.5 0 0 1 .44 1.061v5.175l2 1v-6.175c0-.398.158-.78.44-1.06L19 6.585V5z"
                      />
                    </g>
                  </svg>
                </div>
              </nut-col>
            </nut-row>
          </nut-col>
        </nut-row>
        <div class="scrollable-content">
          <div v-for="i in 2" :key="i" style="padding: 10px 0">
            <nut-row type="flex" justify="start">
              <nut-col span="20" style="padding: 5px 0">
                <nut-row type="flex" justify="start">
                  <nut-col span="2">
                    <nut-avatar size="25">
                      <img
                        src="https://p9-passport.byteacctimg.com/img/user-avatar/42fccde2ed5d5ffe2de81ca2c7e4e698~80x80.awebp"
                        alt="avatar"
                      />
                    </nut-avatar>
                  </nut-col>
                  <nut-col align="left" span="22"> <text style="font-size: 16px">co***@outlook.com</text></nut-col>
                </nut-row>

                <nut-row type="flex" justify="start" style="padding: 5px 0">
                  <nut-col align="left" span="5">
                    <nut-tag>
                      <template #default>
                        <text style="font-size: 12px; color: whitesmoke">{{ t('list.dcaStrategy') }}</text>
                      </template>
                    </nut-tag>
                  </nut-col>
                  <nut-col align="left" span="17">
                    <text style="font-size: 14px">BTC, ETH</text>
                  </nut-col>
                </nut-row>
              </nut-col>
              <nut-col align="right" span="4" style="padding: 5px 0">
                <nut-button size="small" color="linear-gradient(to right, #101010, #112233)" @click="useHandler">
                  <template #default>
                    <text style="font-size: 12px; color: white">{{ t('home.use') }}</text>
                  </template>
                </nut-button>
              </nut-col>
            </nut-row>

            <nut-row type="flex" justify="space-around">
              <nut-col span="12" align="center-left" style="padding: 10px 0">
                <nut-row type="flex" style="margin: 3px 0">
                  <nut-col span="24">
                    <text style="font-size: 10px; color: #2f2f2f">{{ t('home.revenue') }}</text>
                  </nut-col>
                </nut-row>
                <nut-row type="flex" style="margin: 3px 0">
                  <nut-col span="24">
                    <text style="font-size: 14px; color: green">+38.24%</text>
                  </nut-col>
                </nut-row>
                <nut-row type="flex" style="margin: 3px 0">
                  <nut-col span="24">
                    <text style="font-size: 14px; color: green">+472431.21 USDT</text>
                  </nut-col>
                </nut-row>
              </nut-col>
              <nut-col align="right" span="12"> <canvas :id="'myChart' + i"></canvas></nut-col>
            </nut-row>

            <nut-row>
              <nut-col span="12">
                <text style="font-size: 10px; color: #2f2f2f"
                  >{{ t('home.runtime') }} 560 {{ t('common.dayUnit') }} 18 {{ t('common.hourUnit') }} 39 {{ t('common.minuteUnit') }}</text
                >
              </nut-col>
              <nut-col align="right" span="12" style="display: flex; align-items: center; justify-content: end">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M5.5 6a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m0 1.5a3 3 0 1 0 0-6a3 3 0 0 0 0 6m-3.029 2.886c-.777.54-.971 1.063-.971 1.306c0 .446.362.808.808.808h6.384a.81.81 0 0 0 .808-.808c0-.244-.194-.767-.971-1.306C7.792 9.875 6.719 9.5 5.5 9.5s-2.292.375-3.029.886M0 11.692C0 9.846 2.475 8 5.5 8c1.18 0 2.278.281 3.177.734A5.67 5.67 0 0 1 11.5 8c2.475 0 4.5 1.538 4.5 3.077A1.923 1.923 0 0 1 14.077 13h-3.483c-.416.604-1.113 1-1.902 1H2.308A2.31 2.31 0 0 1 0 11.692m10.991-.192h3.086c.234 0 .423-.19.423-.423c0-.103-.096-.472-.688-.89c-.554-.393-1.375-.687-2.312-.687c-.517 0-.999.09-1.42.236c.526.534.854 1.146.911 1.764M12.5 5a1 1 0 1 1-2 0a1 1 0 0 1 2 0M14 5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0"
                    clip-rule="evenodd"
                  />
                </svg>
                <text style="font-size: 14px; color: #010101"> 4</text>
              </nut-col>
            </nut-row>

            <nut-row>
              <nut-col span="12">
                <text style="font-size: 10px; color: #2f2f2f">{{ t('home.maxDrawdown7d') }} 14.00%</text>
              </nut-col>
              <nut-col align="right" span="12">
                <nut-avatar-group size="15" max-count="3" max-content="..." z-index="left" style="display: inline-flex">
                  <nut-avatar size="15" v-for="i in 40" :key="i">
                    <img src="../../assets/coins/ADA.png" alt="" />
                  </nut-avatar>
                </nut-avatar-group>
              </nut-col>
            </nut-row>
          </div>
        </div>
      </nut-tab-pane>
    </nut-tabs>
    <nut-popup v-model:visible="searchPopup" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '60%' }">
      {{ t('home.searchName') }}
    </nut-popup>
    <nut-popup v-model:visible="filterPopup" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '60%' }">
      <text>{{ t('home.coin') }}</text>
      <text>{{ t('home.runtime') }}</text>
      <text>{{ t('home.returnRate') }}</text>
      <nut-button type="primary">{{ t('common.reset') }}</nut-button>
      <nut-button type="primary">{{ t('common.confirm') }}</nut-button>
    </nut-popup>

    <nut-popup v-model:visible="tipsPopup" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '60%' }">
      <p>{{ t('home.strategySquare') }}</p>
      <p>{{ t('home.squareRulesTitle') }}</p>
      <ul>
        <li>{{ t('home.squareRules.line1') }}</li>
        <li>{{ t('home.squareRules.line2') }}</li>
        <li>{{ t('home.squareRules.line3') }}</li>
        <li>{{ t('home.squareRules.line4') }}</li>
        <li>{{ t('home.squareRules.line5') }}</li>
      </ul>
      <p>{{ t('home.rankingDesc') }}</p>
      <p>{{ t('home.rankingPrivacy') }}</p>
    </nut-popup>

    <nut-popup v-model:visible="sortPopup" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '50%' }">
      <nut-row>
        <nut-col span="12">
          <text>{{ t('home.sortComposite') }}</text>
        </nut-col>
        <nut-col align="right" span="12">
          <text>{{ t('home.default') }}</text>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col span="12">
          <text>{{ t('home.sortByRevenue') }}</text>
        </nut-col>
        <nut-col align="right" span="12">
          <text>{{ t('home.default') }}</text>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col span="12">
          <text>{{ t('home.sortByReturnRate') }}</text>
        </nut-col>
        <nut-col align="right" span="12">
          <text>{{ t('home.default') }}</text>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col span="12">
          <text>{{ t('home.sortByUsers') }}</text>
        </nut-col>
        <nut-col align="right" span="12">
          <text>{{ t('home.default') }}</text>
        </nut-col>
      </nut-row>
      <nut-row>
        <nut-col span="12">
          <text>{{ t('home.sortByDrawdown') }}</text>
        </nut-col>
        <nut-col align="right" span="12">
          <text>{{ t('home.default') }}</text>
        </nut-col>
      </nut-row>
    </nut-popup>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { ChartConfiguration } from 'chart.js/auto';
  import { Chart } from 'chart.js/auto';
  import router from '@/router';

  const { t } = useI18n();
  const tipsPopup = ref(false);
  const sortPopup = ref(false);
  const filterPopup = ref(false);
  const searchPopup = ref(false);

  const showTips = () => {
    tipsPopup.value = true;
  };
  const showSortList = () => {
    sortPopup.value = true;
  };
  const showFilter = () => {
    filterPopup.value = true;
  };
  const showSearch = () => {
    searchPopup.value = true;
  };
  // 为每个数据点设置不同的颜色
  const getDataColors = (data: number[]) => {
    return data.map((value) => (value < 0 ? 'darkred' : 'green'));
  };

  const data = {
    labels: [
      '12-16 10:00',
      '12-16 11:00',
      '12-16 12:00',
      '12-16 13:00',
      '12-16 14:00',
      '12-16 15:00',
      '12-16 16:00',
      '12-16 17:00',
      '12-16 18:00',
    ],
    datasets: [
      {
        data: [32, 23, 54, 22, 17, 42, 51, -22, 13],
        borderWidth: 2,
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
        borderColor: 'green',
        backgroundColor: '#c8c8c8',
        fill: true,
        pointRadius: 0.6, // 调小数据点的半径
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
          display: false,
        },
        y: {
          display: false,
        },
      },
    },
  };

  onMounted(() => {
    for (let i = 1; i <= 2; i++) {
      const ctx = document.getElementById(`myChart${i}`);
      if (ctx) {
        new Chart(ctx as HTMLCanvasElement, config);
      }
    }
  });

  const useHandler = () => {
    router.push('/use');
  };
</script>

<style lang="scss" scoped>
  ::v-deep(.nut-tab-pane) {
    padding: 1.2vw 0.2vw !important;
  }

  .container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 92px);
  }

  .scrollable-content {
    flex: 1; /* 填充剩余空间 */
    overflow-y: auto; /* 启用垂直滚动 */
  }
</style>
