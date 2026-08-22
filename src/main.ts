import { createApp } from 'vue';
import App from './App.vue';
import { i18n, setLang } from '@/i18n';
import { initializeAppContext } from '@/mobile/app-context';
import router from '@/router';
import store from '@/store';
import './styles/index.scss';
import './assets/font/iconfont.css';

import '@nutui/nutui/dist/packages/toast/style/css';
import '@nutui/nutui/dist/packages/notify/style/css';
import '@nutui/nutui/dist/packages/dialog/style/css';
import '@nutui/nutui/dist/packages/imagepreview/style/css';

async function bootstrap() {
  const context = await initializeAppContext();
  const app = createApp(App);

  // 路由
  app.use(router);

  // 国际化（用户手动选择优先，App 语言仅作为默认值）
  app.use(i18n);
  setLang(context.locale, false);

  // 状态管理
  app.use(store);

  app.mount('#app');
}

void bootstrap();
