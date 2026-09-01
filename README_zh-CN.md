# Bitpongo

[English](README.md) | [简体中文](README_zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3-42B883.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)

Bitpongo 是用于创建和监控自动化投资策略的开源 Web 客户端，既可以作为响应式 Web 应用运行，也可以作为 Bitpongo 移动端内嵌的 Web 页面层。

界面支持策略调度、交易所连接、持仓与收益图表、订单历史、Bark 通知、账号生命周期、多语言和用户时区显示。

> [!WARNING]
> Bitpongo 是软件工具，不构成投资建议。自动化交易可能造成资金损失。交易所 API 必须关闭提现权限，并应先在测试环境验证策略。

## 功能

- 创建、暂停、恢复、停止和查看自动化策略。
- 配置资产比例、执行频率、买入价格范围和可选的逢低买入规则。
- 管理交易所 API 连接，并对凭据进行遮罩显示。
- 查看持仓、订单、执行记录和收益趋势。
- 配置用户自己的 Bark 推送通知。
- 支持英文、简体中文和繁体中文。
- 支持 IANA 时区的策略调度与页面显示。
- 响应式 PWA 布局，以及受控的移动端 WebView 桥接。

## 技术栈

- Vue 3 与 TypeScript
- Vite 8
- Pinia 与 Vue Router
- NutUI、Vant 与 Varlet UI
- Chart.js
- Vitest 与 Vue Test Utils
- Nginx 与 Docker Compose

## 相关仓库

| 项目 | 仓库 |
| --- | --- |
| 后端 API | [multind/bitpongo-api](https://github.com/multind/bitpongo-api) |
| 文档站点 | [multind/bitpongo-doc](https://github.com/multind/bitpongo-doc) |

## 环境要求

- 推荐 Node.js 24，最低要求 Node.js 20.10
- npm 10 或更高版本

## 本地开发

安装依赖并启动开发服务器：

```bash
npm install --legacy-peer-deps
npm run dev
```

Vite 会在终端输出开发地址。默认 API 前缀由环境文件和运行时配置共同控制。

## 验证

```bash
npm test
npm run typecheck
npm run build
```

Lint 和格式化命令见 [`package.json`](package.json)。

## 运行时 API 配置

Vue 启动前会加载 `/app-config.js`。浏览器部署可以使用构建时的 `VITE_URL_PREFIX`；移动端内嵌构建应提供绝对 HTTP(S) API 地址：

```js
window.__ZHITOUBAO_APP_CONFIG__ = {
  apiBaseUrl: 'https://api.example.com/api',
};
```

不要在这个公开文件中放置 Access Token、交易所凭据或其他 Secret。

## Docker 部署

前端与 API 分开部署。先构建静态资源，再启动 Nginx 容器：

```bash
npm run build
docker compose up -d --build
```

前端 Compose 服务会加入外部网络 `bitpongo-net`，并把 `/api/` 和 `/api/ws/` 代理到 `api:8000`。请先启动[后端 Compose](https://github.com/multind/bitpongo-api)，确保共享网络已经创建。

需要修改宿主机端口时：

```bash
WEB_PORT=8080 docker compose up -d
```

Compose 构建并标记 `docker.io/corbettzhang/bitpongofront:latest`。

```bash
docker compose build
docker compose push
```

## 移动端 WebView 桥接

为保持兼容，可选通道名称仍为 `ZhitoubaoBridge`，只接受以下命令：

- `getContext`
- `saveImage`
- `shareImage`

消息信封格式：

```json
{
  "version": 1,
  "command": "getContext",
  "requestId": "example-request-id",
  "payload": {}
}
```

原生端通过 `window.__ZHITOUBAO_NATIVE_RESOLVE__(requestId, result)` 返回结果。普通浏览器中不存在桥接通道时会安全降级，未响应请求会在 10 秒后过期。

## 安全说明

- 不要提交交易所密钥、密码、Access Token、Bark Device Key 或生产日志。
- 所有交易所 API 都应关闭提现权限。
- 生产环境必须使用 HTTPS。
- 建议使用随项目提供的 Nginx 代理，使 API 和 WebSocket 保持同源。
- 注销账号不可撤销，需要当前密码、明确勾选和二次确认。

## 参与贡献

1. 创建范围清晰的分支。
2. 行为变化需要新增或更新测试。
3. 运行测试、类型检查和生产构建。
4. 用户可见文案需要同步维护所有支持语言。
5. 视觉变化应在 Pull Request 中附带截图。

## 许可证

本项目采用 [MIT License](LICENSE)。
