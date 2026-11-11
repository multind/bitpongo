import { createApp } from 'vue';
import App from './App.vue';
import { i18n, setLang } from '@/i18n';
import { initializeAppContext } from '@/mobile/app-context';
import router from '@/router';
import store from '@/store';
import { useUserStore } from '@/store/modules/user';
import { initializeSessionTimeZone } from '@/mobile/session-timezone';
import { installPushLifecycle } from '@/mobile/push-lifecycle';
import { installStaleBuildRecovery } from '@/utils/stale-build';
import './styles/index.scss';
import './assets/font/iconfont.css';

import '@nutui/nutui/dist/packages/toast/style/css';
import '@nutui/nutui/dist/packages/notify/style/css';
import '@nutui/nutui/dist/packages/dialog/style/css';
import '@nutui/nutui/dist/packages/imagepreview/style/css';
import 'vant/es/skeleton/style/index';

async function bootstrap() {
  const context = await initializeAppContext();
  const app = createApp(App);

  // 路由；发布后按需加载的页面文件失效时自动刷新到新版本
  installStaleBuildRecovery(router);
  app.use(router);

  // 国际化（用户手动选择优先，App 语言仅作为默认值）
  app.use(i18n);
  setLang(context.locale, false);

  // 状态管理
  app.use(store);

  app.mount('#app');

  const userStore = useUserStore(store);
  installPushLifecycle(userStore, router);
  if (userStore.token) void initializeSessionTimeZone();
  if (userStore.token) void userStore.syncProfile();
}

void bootstrap();
