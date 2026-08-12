<template>
  <nut-row type="flex" justify="center" flex-wrap="nowrap" style="margin: 10px 0">
    <nut-col span="22">
      <text style="font-size: 12px; color: grey">
        通知方式是您获取应用程序中发生事件的通知渠道。在设置通知方式完成后，应用程序将会实时推送发生事件到已设置的通知方式渠道，从而帮助您及时获取最新动态。
      </text>
    </nut-col>
  </nut-row>
  <nut-row type="flex" justify="center" flex-wrap="nowrap" style="margin: 20px 0">
    <nut-col span="22">
      <text style="font-size: 13px; color: black; border-bottom: 1px dashed #999"> 查看如何创建通知方式 </text>
    </nut-col>
  </nut-row>
  <nut-cell-group>
    <nut-cell title="钉钉" is-link @click="dingDingHandler">
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#000"
            d="M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0-2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m4.49 9.04l-.006.014c-.42.898-1.516 2.66-1.516 2.66l-.005-.012l-.32.558h1.543l-2.948 3.919l.67-2.666h-1.215l.422-1.763a17 17 0 0 0-1.223.349s-.646.378-1.862-.729c0 0-.82-.722-.344-.902c.202-.077.981-.175 1.595-.257a80 80 0 0 1 1.338-.172s-2.555.039-3.161-.057c-.606-.095-1.375-1.107-1.539-1.996c0 0-.253-.488.545-.257s4.101.9 4.101.9S8.27 9.312 7.983 8.99c-.286-.32-.841-1.754-.769-2.634c0 0 .031-.22.257-.16c0 0 3.176 1.45 5.347 2.245s4.06 1.199 3.816 2.228c-.02.087-.072.216-.144.37"
          />
        </svg>
      </template>
    </nut-cell>
    <!--    <nut-cell title="Email" is-link @click="emailPopup = true">-->
    <!--      <template #icon>-->
    <!--        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 28 28">-->
    <!--          <path-->
    <!--            fill="#000"-->
    <!--            d="M6.25 5h13.5a3.25 3.25 0 0 1 3.245 3.066L23 8.25v9.5a3.25 3.25 0 0 1-3.066 3.245L19.75 21H6.25a3.25 3.25 0 0 1-3.245-3.066L3 17.75v-9.5a3.25 3.25 0 0 1 3.066-3.245zm15.25 5.373l-8.15 4.29a.75.75 0 0 1-.603.043l-.096-.042l-8.151-4.29v7.376a1.75 1.75 0 0 0 1.606 1.744l.144.006h13.5a1.75 1.75 0 0 0 1.744-1.607l.006-.143zM19.75 6.5H6.25a1.75 1.75 0 0 0-1.744 1.606L4.5 8.25v.429l8.5 4.474l8.5-4.475V8.25a1.75 1.75 0 0 0-1.607-1.744zM6.012 22a3.25 3.25 0 0 0 2.739 1.5h11.5c2.9 0 5.25-2.35 5.25-5.25v-7.5a3.25 3.25 0 0 0-1.5-2.74v10.24A3.75 3.75 0 0 1 20.25 22z"-->
    <!--          />-->
    <!--        </svg>-->
    <!--      </template>-->
    <!--    </nut-cell>-->
    <!--    <nut-cell title="Telegram" is-link @click="telegramPopup = true">-->
    <!--      <template #icon>-->
    <!--        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">-->
    <!--          <g fill="none" stroke="#000" stroke-linejoin="round" stroke-width="1">-->
    <!--            <path-->
    <!--              stroke-linecap="round"-->
    <!--              d="M5.144 11.44a.255.255 0 0 0-.162.235c0 .102.067.198.162.234l2.987 1.09l6.154-3.177a.154.154 0 0 1 .19.05a.154.154 0 0 1-.022.195l-4.417 3.894l4.916 3.558c.067.048.157.06.234.032a.25.25 0 0 0 .156-.177L17.8 7.036a.25.25 0 0 0-.078-.246a.25.25 0 0 0-.254-.046z"-->
    <!--            />-->
    <!--            <path-->
    <!--              stroke-linecap="round"-->
    <!--              d="m8.131 13l.769 3.917c.024.112.13.198.244.198a.256.256 0 0 0 .245-.198l.643-2.956m1.871 1.355l-2.6 1.748"-->
    <!--            />-->
    <!--            <path d="M1.5 12a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0-21 0" />-->
    <!--          </g>-->
    <!--        </svg>-->
    <!--      </template>-->
    <!--    </nut-cell>-->
  </nut-cell-group>

  <nut-popup v-model:visible="telegramPopup" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '60%' }">
    <nut-row style="margin-top: 18px; text-align: center" type="flex">
      <nut-col span="24">
        <div style="font-size: 18px">Telegram 设置</div>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="end" style="margin-top: 20px">
      <nut-col span="20">
        <nut-input placeholder="请输入 Bot token" type="text" :border="false" style="max-width: 85vw">
          <template #left>
            <text>Bot Token:</text>
          </template>
        </nut-input>
      </nut-col>
      <nut-col span="2"> </nut-col>
    </nut-row>
    <nut-row type="flex" justify="end">
      <nut-col span="20">
        <nut-input placeholder="请输入 Chat ID" type="text" :border="false" style="max-width: 85vw">
          <template #left>
            <text>&nbsp;&nbsp;&nbsp;&nbsp; Chat ID:</text>
          </template>
        </nut-input>
      </nut-col>
      <nut-col span="2"> </nut-col>
    </nut-row>
    <nut-row type="flex" style="margin-top: 20px">
      <nut-col align="right" span="8">
        <nut-button size="small" color="#101010" @click="testClick" :loading="testLoading">
          <template #icon>
            <Tips v-if="!testSuccess" />
            <Success v-if="testSuccess" />
          </template>
          {{ testSuccess ? '发送成功' : '测试' }}
        </nut-button>
      </nut-col>
    </nut-row>
  </nut-popup>

  <nut-popup v-model:visible="dingDingPopup" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '60%' }">
    <nut-row style="margin-top: 18px; text-align: center" type="flex">
      <nut-col span="24">
        <div style="font-size: 18px">钉钉设置</div>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="start" style="padding-left: 13px; margin-top: 20px">
      <nut-col>
        <text style="font-family: 'Apple SD Gothic Neo', serif; font-size: 14px; color: black"> Webhook </text>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="start" style="margin: 0 10px">
      <nut-col span="22">
        <nut-input
          v-model="notices.dingTalkParam.webhook"
          placeholder="请输入 Webhook"
          type="text"
          :border="false"
          style="padding: 1vh; border: 1px solid #eee; border-radius: 5px"
        />
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="start" style="padding-left: 13px; margin-top: 20px">
      <nut-col>
        <text style="font-family: 'Apple SD Gothic Neo', serif; font-size: 14px; color: black"> 加 签 </text>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="start" style="margin: 0 10px">
      <nut-col span="22">
        <nut-input
          v-model="notices.dingTalkParam.secret"
          placeholder="请输入加签"
          type="text"
          :border="false"
          style="padding: 1vh; border: 1px solid #eee; border-radius: 5px"
        >
        </nut-input>
      </nut-col>
    </nut-row>

    <nut-row type="flex" justify="center" style="margin-top: 30px">
      <nut-col span="22">
        <nut-button block size="24" color="#101010" @click="testClick" :loading="testLoading">
          <template #icon>
            <Tips v-if="!testSuccess" />
            <Success v-if="testSuccess" />
          </template>
          {{ testSuccess ? '发送成功' : ' 测 试 ' }}
        </nut-button>
      </nut-col>
    </nut-row>
  </nut-popup>

  <nut-popup v-model:visible="emailPopup" position="bottom" closeable round close-icon-position="top-left" :style="{ height: '60%' }">
    <nut-row style="margin-top: 18px; text-align: center" type="flex">
      <nut-col span="24">
        <div style="font-size: 18px">Email 设置</div>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="end" style="margin-top: 20px">
      <nut-col span="20">
        <nut-input placeholder="请输入接收邮件的电子邮箱地址" type="text" :border="false" style="max-width: 85vw">
          <template #left>
            <text>电子邮箱:</text>
          </template>
        </nut-input>
      </nut-col>
      <nut-col span="2"> </nut-col>
    </nut-row>
    <nut-row type="flex" style="margin-top: 20px">
      <nut-col align="right" span="8">
        <nut-button size="large" color="#101010" @click="testClick" :loading="testLoading">
          <template #icon>
            <Tips v-if="!testSuccess" />
            <Success v-if="testSuccess" />
          </template>
          {{ testSuccess ? '发送成功' : ' 测 试 ' }}
        </nut-button>
      </nut-col>
    </nut-row>
  </nut-popup>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { Success, Tips } from '@nutui/icons-vue';
  import { ding, noticeInfo } from '@/api';

  const loading = ref(false);
  const notices = ref({
    dingTalkParam: {
      secret: '',
      webhook: '',
    },
    emailParam: {
      to: '',
    },
    telegramParam: {},
  });

  // 添加测试状态管理
  const testLoading = ref(false);
  const testSuccess = ref(false);

  // 添加通知信息相关变量
  const dingDingPopup = ref(false);
  const emailPopup = ref(false);
  const telegramPopup = ref(false);

  const testClick = async (prop: any) => {
    console.log('[Button]: on click', prop);
    // 设置加载状态
    testLoading.value = true;
    testSuccess.value = false;
    try {
      const result = await ding({ webhook: notices.value.dingTalkParam.webhook, signed: notices.value.dingTalkParam.secret });
      console.log(result);
      if (result) {
        testLoading.value = false;
        testSuccess.value = true;
        setTimeout(() => {
          dingDingPopup.value = false;
        }, 2000);
      }
    } catch (error) {
      console.error('发送测试消息失败:', error);
      testLoading.value = false;
      testSuccess.value = false;
    }
  };

  const dingDingHandler = () => {
    dingDingPopup.value = true;
  };

  // 页面加载时获取通知信息
  onMounted(async () => {
    try {
      loading.value = true;
      const result = await noticeInfo();
      const notice = JSON.parse(result);
      // 解析返回的数据
      notices.value = {
        telegramParam: notice.telegramParam ? JSON.parse(notice.telegramParam) : {},
        dingTalkParam: notice.dingTalkParam ? JSON.parse(notice.dingTalkParam) : { secret: '', webhook: '' },
        emailParam: notice.emailParam ? JSON.parse(notice.emailParam) : { to: '' },
      };
      console.log('解析后的数据:', notices.value);
    } catch (error) {
      console.error('获取通知信息失败:', error);
    } finally {
      loading.value = false;
    }
  });
</script>
<style scoped lang="scss"></style>
