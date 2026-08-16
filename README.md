### nut库

https://nutui.jd.com/h5/vue/4x/#/zh-CN/component/button

### 图标库

https://icon-sets.iconify.design/?query=sched

## Docker 发布（与后端分开发布）

前端镜像只包含构建产物和 Nginx 配置，构建前先在本地产出 `dist`：

```bash
pnpm install --frozen-lockfile
pnpm build
docker compose up -d --build
```

Nginx 通过 Docker 服务名 `api:8000` 反向代理 `/api/`（含 WebSocket `/api/ws/`），使用 Docker 内置 DNS 运行时解析，后端重启不影响前端容器。要求：

1. 先启动 `zhitoubao` 的 Compose（会创建共享网络 `zhitoubao-net`）；
2. 前端 Compose 加入该外部网络，对外只暴露 `80`（可用 `WEB_PORT` 覆盖）。

页面 SPA 路由回退到 `index.html`；浏览器与 API 同源访问，不依赖 CORS。

镜像推送到 Docker Hub（`docker.io/corbettzhang/zhitoubaofront:latest`）：

```bash
docker login
docker compose build
docker compose push
```

## Flutter WebView 集成

页面会在 Vue 应用启动前加载 `/app-config.js`。浏览器部署默认保留构建时的 `VITE_URL_PREFIX`；Flutter 内嵌构建必须在该脚本中提供绝对 HTTP(S) API 地址：

```js
window.__ZHITOUBAO_APP_CONFIG__ = {
  apiBaseUrl: 'https://api.example.com/api',
};
```

移动端可选桥接通道名为 `ZhitoubaoBridge`，仅允许 `getContext`、`saveImage`、`shareImage` 三个命令。Web 端发送的 JSON 信封格式为 `{ version: 1, command, requestId, payload }`；原生端完成后调用 `window.__ZHITOUBAO_NATIVE_RESOLVE__(requestId, result)` 返回结果。浏览器中不存在桥接通道时会安全降级，未响应请求会在 10 秒后过期。图片命令只接受绝对 HTTP(S) URL。

账号设置入口位于“我的”，注销路由为 `/member/account`。注销要求当前密码、明确勾选和二次确认；只有后端确认删除成功后，前端才清除会话并跳转登录页。
