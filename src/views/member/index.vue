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
        <div class="info"> {{ t('member.slogan') }} </div>
      </div>
    </div>
    <nut-cell-group>
      <nut-cell :title="`&nbsp;${t('member.exchangeInfo')}`" is-link @click="goExchangeInfo">
        <template #icon>
          <Link />
        </template>
      </nut-cell>
      <nut-cell :title="`&nbsp;${t('member.noticeInfo')}`" is-link @click="goNoticeInfo">
        <template #icon>
          <Notice />
        </template>
      </nut-cell>
      <nut-cell :title="`&nbsp;${t('member.account')}`" is-link @click="goAccountSettings">
        <template #icon>
          <Setting />
        </template>
      </nut-cell>
      <nut-cell :title="`&nbsp;${t('member.about')}`" is-link @click="goAbout">
        <template #icon>
          <Issue />
        </template>
      </nut-cell>
      <nut-cell :title="`&nbsp;${t('language.label')}`" is-link @click="languagePopup = true">
        <template #icon>
          <Message />
        </template>
      </nut-cell>
    </nut-cell-group>
    <nut-cell is-link @click="goLogout">
      <template #title>
        <text style="color: red">{{ t('member.signOut') }}</text>
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
  <main v-else class="guest-member">
    <section class="guest-hero" data-test="guest-welcome">
      <div class="guest-mark" aria-hidden="true"><span>B</span><i>✦</i></div>
      <h1>{{ t('member.guestTitle') }}</h1>
      <p>{{ t('member.guestDescription') }}</p>
      <div class="guest-actions">
        <nut-button block class="guest-login" data-test="guest-login" @click="goLogin">
          {{ t('member.goLogin') }}
        </nut-button>
        <nut-button block class="guest-register" data-test="guest-register" @click="goRegister">
          {{ t('member.goRegister') }}
        </nut-button>
      </div>
    </section>

    <section class="guest-features" aria-label="Bitpongo capabilities">
      <article v-for="feature in guestFeatures" :key="feature.title" class="guest-feature" data-test="guest-feature">
        <component :is="feature.icon" aria-hidden="true" />
        <div
          ><h2>{{ feature.title }}</h2
          ><p>{{ feature.description }}</p></div
        >
      </article>
    </section>

    <button class="guest-language" data-test="guest-language" type="button" @click="languagePopup = true">
      <Message aria-hidden="true" />
      <span>{{ t('language.label') }}</span
      ><span aria-hidden="true">›</span>
    </button>
  </main>

  <nut-popup v-model:visible="languagePopup" position="bottom" round :style="{ height: '30%' }">
    <nut-row style="margin-top: 23px; text-align: center" type="flex">
      <nut-col span="24">
        <div style="font-size: 18px">{{ t('language.label') }}</div>
      </nut-col>
    </nut-row>
    <nut-cell-group style="margin-top: 10px">
      <nut-cell :title="t('language.zhCn')" @click="switchLanguage('zh-cn')" />
      <nut-cell :title="t('language.zhTw')" @click="switchLanguage('zh-tw')" />
      <nut-cell :title="t('language.enUs')" @click="switchLanguage('en-us')" />
    </nut-cell-group>
  </nut-popup>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { Issue, Link, Message, Notice, Setting } from '@nutui/icons-vue';
  import { showDialog } from '@nutui/nutui';
  import { computed, ref } from 'vue';
  import { switchLang, type LocaleKey } from '@/i18n';

  const { t } = useI18n();
  const router = useRouter();
  const userStore = useUserStore();
  const languagePopup = ref(false);

  const getUserInfo = computed(() => {
    const { email = '', name = '' } = userStore.getUserInfo || {};
    console.log('getUserInfo', email, name);
    return email.replace(/(.{2}).*(@.*)/, '$1***$2');
  });
  const guestFeatures = computed(() => [
    { icon: Setting, title: t('member.guestStrategyTitle'), description: t('member.guestStrategyDescription') },
    { icon: Link, title: t('member.guestExchangeTitle'), description: t('member.guestExchangeDescription') },
    { icon: Notice, title: t('member.guestNoticeTitle'), description: t('member.guestNoticeDescription') },
  ]);
  const goLogin = () => {
    router.push('/login');
  };
  const goRegister = () => router.push('/register');
  const goExchangeInfo = () => {
    router.push('/member/exchange');
  };
  const goNoticeInfo = () => {
    router.push('/member/notice');
  };
  const goAccountSettings = () => {
    router.push('/member/account');
  };
  const goAbout = () => {
    router.push('/member/about');
  };
  const switchLanguage = (locale: LocaleKey) => {
    languagePopup.value = false;
    switchLang(locale);
  };
  const goLogout = async () => {
    // 显示确认退出弹窗
    // 可以在这里添加跳转到币种详情页或其他交互逻辑
    showDialog({
      textAlign: 'center',
      title: t('member.signOutConfirmTitle'),
      content: t('member.signOutConfirmContent'),
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

<style scoped lang="scss">
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
        color: #2f2f2f;
      }
    }
  }

  .guest-member {
    min-height: 100%;
    padding: 1rem;
    background: #fffaf5;
  }

  .guest-hero {
    padding: 2rem 1.5rem;
    color: #fff;
    background: linear-gradient(135deg, #fb923c, #f97316);
    border-radius: 1.5rem;
    box-shadow: 0 0.75rem 1.5rem rgb(234 88 12 / 20%);

    h1 {
      margin: 1.25rem 0 0.5rem;
      font-size: 1.75rem;
      line-height: 1.25;
    }

    p {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.6;
    }
  }

  .guest-mark {
    position: relative;
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    font-size: 1.75rem;
    font-weight: 800;
    background: rgb(255 255 255 / 20%);
    border-radius: 1rem;

    i {
      position: absolute;
      top: -0.25rem;
      right: -0.375rem;
      font-size: 1rem;
      font-style: normal;
    }
  }

  .guest-actions {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .guest-actions :deep(.nut-button),
  .guest-actions button {
    min-height: 2.875rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 0.875rem;
  }

  .guest-login {
    color: #9a3412;
    background: #fff;
    border: 0;
  }

  .guest-register {
    color: #fff;
    background: transparent;
    border: 0.0625rem solid rgb(255 255 255 / 70%);
  }

  .guest-features {
    display: grid;
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .guest-feature {
    display: flex;
    gap: 0.875rem;
    align-items: flex-start;
    padding: 1rem;
    background: #fff;
    border: 0.0625rem solid #fed7aa;
    border-radius: 1rem;

    > svg {
      flex: 0 0 auto;
      width: 1.5rem;
      height: 1.5rem;
      margin-top: 0.125rem;
      color: #ea580c;
    }

    h2 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.4;
      color: #431407;
    }

    p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #78716c;
    }
  }

  .guest-language {
    display: flex;
    gap: 0.625rem;
    align-items: center;
    width: 100%;
    min-height: 2.875rem;
    padding: 0.75rem 1rem;
    font-size: 0.9375rem;
    color: #7c2d12;
    text-align: left;
    background: #fff;
    border: 0.0625rem solid #fed7aa;
    border-radius: 0.875rem;

    svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    span:last-child {
      margin-left: auto;
      font-size: 1.5rem;
      line-height: 1;
    }
  }
</style>
