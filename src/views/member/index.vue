<template>
  <div v-if="getUserInfo">
    <div class="avatar-wrap" v-if="getUserInfo">
      <nut-avatar class="avatar" size="50">
        <img src="../../assets/logo.png" alt="avatar" />
      </nut-avatar>
      <div class="member-detail">
        <div class="nickname">
          <span> {{ getUserInfo }} </span>
        </div>
        <div class="info"> 智慧投资，轻松理财 </div>
      </div>
    </div>
    <nut-cell-group>
      <nut-cell title="&nbsp;API管理" is-link @click="goExchangeInfo">
        <template #icon>
          <Link />
        </template>
      </nut-cell>
      <nut-cell title="&nbsp;通知" is-link @click="goNoticeInfo">
        <template #icon>
          <Notice />
        </template>
      </nut-cell>
      <nut-cell title="&nbsp;关于" is-link @click="goAbout">
        <template #icon>
          <Issue />
        </template>
      </nut-cell>
    </nut-cell-group>
    <nut-cell is-link @click="goLogout">
      <template #title>
        <text style="color: red">退出</text>
      </template>
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 1024 1024" color="red">
          <path
            fill="currentColor"
            d="M868 732h-70.3c-4.8 0-9.3 2.1-12.3 5.8c-7 8.5-14.5 16.7-22.4 24.5a353.8 353.8 0 0 1-112.7 75.9A352.8 352.8 0 0 1 512.4 866c-47.9 0-94.3-9.4-137.9-27.8a353.8 353.8 0 0 1-112.7-75.9a353.3 353.3 0 0 1-76-112.5C167.3 606.2 158 559.9 158 512s9.4-94.2 27.8-137.8c17.8-42.1 43.4-80 76-112.5s70.5-58.1 112.7-75.9c43.6-18.4 90-27.8 137.9-27.8s94.3 9.3 137.9 27.8c42.2 17.8 80.1 43.4 112.7 75.9c7.9 7.9 15.3 16.1 22.4 24.5c3 3.7 7.6 5.8 12.3 5.8H868c6.3 0 10.2-7 6.7-12.3C798 160.5 663.8 81.6 511.3 82C271.7 82.6 79.6 277.1 82 516.4C84.4 751.9 276.2 942 512.4 942c152.1 0 285.7-78.8 362.3-197.7c3.4-5.3-.4-12.3-6.7-12.3m88.9-226.3L815 393.7c-5.3-4.2-13-.4-13 6.3v76H488c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h314v76c0 6.7 7.8 10.5 13 6.3l141.9-112a8 8 0 0 0 0-12.6"
          />
        </svg>
      </template>
    </nut-cell>
  </div>
  <div v-else class="not-login-center">
    <img src="../../assets/not_login.png" height="350" width="350" alt="not login" />
    <nut-button color="linear-gradient(to right, #101010, #112233)" size="small" @click="goLogin"> 去登录 </nut-button>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user';
  import { useRouter } from 'vue-router';
  import { Issue, Link, Notice } from '@nutui/icons-vue';
  import { showDialog } from '@nutui/nutui';

  const router = useRouter();
  const userStore = useUserStore();
  const getUserInfo = computed(() => {
    const { email = '', name = '' } = userStore.getUserInfo || {};
    console.log('getUserInfo', email, name);
    return email.replace(/(.{2}).*(@.*)/, '$1***$2');
  });
  const goLogin = () => {
    router.push('/login');
  };
  const goExchangeInfo = () => {
    router.push('/member/exchange');
  };
  const goNoticeInfo = () => {
    router.push('/member/notice');
  };
  const goAbout = () => {
    router.push('/member/about');
  };
  const goLogout = async () => {
    // 显示确认退出弹窗
    // 可以在这里添加跳转到币种详情页或其他交互逻辑
    showDialog({
      textAlign: 'center',
      title: '确认退出',
      content: '您确定要退出登录吗？',
      onOk: async () => {
        // 用户确认退出时执行登出操作
        userStore.logout();
      },
      onCancel: () => {
        // 用户取消退出，不做任何操作
        console.log('用户取消退出');
      },
    });
  };
</script>

<style lang="scss">
  .avatar-wrap {
    display: flex;
    align-items: center;
    margin: 40px 10px;

    .member-detail {
      margin-left: 20px;

      .nickname {
        font-family: 'STIX Two Math', serif;
        font-size: 32px;
        font-weight: bold;

        .nut-button {
          margin-left: 20px;
        }
      }

      .info {
        margin-top: 10px;
        font-size: 24px;
      }
    }
  }

  .not-login-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }
</style>
