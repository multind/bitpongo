<template>
  <nut-navbar :title="t($route.meta.title as string)" :left-show="!tabBarVisible" @click-back="goBack" fixed />
  <div class="main-page" :class="{ tabbar: tabBarVisible, border: showBorder }">
    <RouterView v-slot="{ Component }" v-if="$route.meta.keepAlive">
      <keep-alive>
        <component :is="Component" :key="$route.path" />
      </keep-alive>
    </RouterView>
    <RouterView v-if="!$route.meta.keepAlive" :key="$route.path" />
  </div>
  <nut-tabbar unactive-color="#364636" active-color="#1989fa" bottom v-model="activeTab" v-show="tabBarVisible" @tab-switch="tabSwitch">
    <nut-tabbar-item v-for="item in tabItem" :key="item.key" :tab-title="t(`tabbar.${item.key}`)" :icon="item.icon" />
  </nut-tabbar>
</template>

<script lang="ts" setup>
  import { useI18n } from 'vue-i18n'; // 添加这行
  import { useRouter } from 'vue-router';
  // import { Home, Horizontal, My } from '@nutui/icons-vue';
  import { Horizontal, My } from '@nutui/icons-vue';

  defineOptions({
    name: 'BasicLayoutPage',
  });
  const { t } = useI18n(); // 添加这行
  const tabItem = [
    // { key: 'home', icon: Home },
    { key: 'list', icon: Horizontal },
    { key: 'member', icon: My },
  ];

  const router = useRouter();

  const activeTab = ref(0);

  const tabBarVisible = ref(true);

  const showBorder = ref(true);

  watch(
    () => router,
    () => {
      const judgeRoute = tabItem.some((item) => item.key === router.currentRoute.value.path.replace('/', ''));
      activeTab.value = tabItem.findIndex((item) => item.key === router.currentRoute.value.path.replace('/', ''));
      tabBarVisible.value = judgeRoute;
      showBorder.value = judgeRoute;
    },
    { deep: true, immediate: true },
  );

  const tabSwitch = (_item: any, index: number) => {
    switch (index) {
      // case 0:
      //   router.push('/home');
      //   break;
      case 0:
        router.push('/list');
        break;
      case 1:
        router.push('/member');
        break;
    }
    activeTab.value = index;
  };

  const goBack = () => {
    router.go(-1);
  };
</script>

<style scoped lang="scss">
  .nut-navbar {
    margin-bottom: 0;
  }

  .main-page {
    box-sizing: border-box;
    height: calc(100vh - 110px);
    overflow: hidden scroll;
  }

  .tabbar {
    height: calc(100vh - 110px);
    padding-bottom: 100px;
  }

  .border {
    padding-right: 10px;
    padding-left: 10px;
  }
</style>
