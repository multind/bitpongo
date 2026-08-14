### nut库

https://nutui.jd.com/h5/vue/4x/#/zh-CN/component/button

### 图标库

https://icon-sets.iconify.design/?query=sched

## Flutter WebView 集成

页面会在 Vue 应用启动前加载 `/app-config.js`。浏览器部署默认保留构建时的 `VITE_URL_PREFIX`；Flutter 内嵌构建必须在该脚本中提供绝对 HTTP(S) API 地址：

```js
window.__ZHITOUBAO_APP_CONFIG__ = {
  apiBaseUrl: 'https://api.example.com/api',
};
```

移动端可选桥接通道名为 `ZhitoubaoBridge`，仅允许 `getContext`、`saveImage`、`shareImage` 三个命令。Web 端发送的 JSON 信封格式为 `{ version: 1, command, requestId, payload }`；原生端完成后调用 `window.__ZHITOUBAO_NATIVE_RESOLVE__(requestId, result)` 返回结果。浏览器中不存在桥接通道时会安全降级，未响应请求会在 10 秒后过期。图片命令只接受绝对 HTTP(S) URL。

账号设置入口位于“我的”，注销路由为 `/member/account`。注销要求当前密码、明确勾选和二次确认；只有后端确认删除成功后，前端才清除会话并跳转登录页。
