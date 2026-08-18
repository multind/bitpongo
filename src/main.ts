import { createApp } from 'vue';
import App from './App.vue';
import { i18n, setLang } from '@/i18n';
import router from '@/router';
import store from '@/store';
import './assets/font/iconfont.css';

import '@nutui/nutui/dist/packages/toast/style/css';
import '@nutui/nutui/dist/packages/notify/style/css';
import '@nutui/nutui/dist/packages/dialog/style/css';
import '@nutui/nutui/dist/packages/imagepreview/style/css';

const app = createApp(App);

// 路由
app.use(router);

// 国际化（安装插件后恢复上次选择的语言）
app.use(i18n);
setLang();

// 状态管理
app.use(store);

app.mount('#app');
