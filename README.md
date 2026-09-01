# Bitpongo

[English](README.md) | [简体中文](README_zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3-42B883.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)

Bitpongo is an open-source web client for creating and monitoring automated investment strategies. It works as a responsive web application and as the web layer embedded in the Bitpongo mobile app.

The interface supports strategy scheduling, exchange connections, portfolio and return charts, order history, Bark notifications, account lifecycle operations, multiple languages, and user-specific time-zone display.

> [!WARNING]
> Bitpongo is software, not investment advice. Automated trading can result in financial loss. Use exchange API keys with withdrawal permission disabled and validate strategies in a test environment first.

## Features

- Create, pause, resume, stop, and inspect automated strategies.
- Configure asset allocation, execution frequency, buy ranges, and optional dip-buying rules.
- Manage exchange API connections with masked credential display.
- View positions, orders, execution history, and return trends.
- Configure individual Bark push notifications.
- English, Simplified Chinese, and Traditional Chinese interfaces.
- IANA time-zone-aware scheduling and display.
- Responsive PWA layout and a controlled bridge for the mobile WebView shell.

## Technology

- Vue 3 and TypeScript
- Vite 8
- Pinia and Vue Router
- NutUI, Vant, and Varlet UI
- Chart.js
- Vitest and Vue Test Utils
- Nginx and Docker Compose

## Related repositories

| Project | Repository |
| --- | --- |
| Backend API | [multind/bitpongo-api](https://github.com/multind/bitpongo-api) |
| Documentation | [multind/bitpongo-doc](https://github.com/multind/bitpongo-doc) |

## Requirements

- Node.js 24 recommended; Node.js 20.10 or later is required
- npm 10 or later

## Local development

Install dependencies and start the development server:

```bash
npm install --legacy-peer-deps
npm run dev
```

The development URL is printed by Vite. The default API prefix is controlled by the environment files and runtime configuration.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

Lint and formatting commands are available in [`package.json`](package.json).

## Runtime API configuration

The application loads `/app-config.js` before Vue starts. Browser deployments may use the build-time `VITE_URL_PREFIX`; embedded mobile builds should provide an absolute HTTP(S) API URL:

```js
window.__ZHITOUBAO_APP_CONFIG__ = {
  apiBaseUrl: 'https://api.example.com/api',
};
```

Do not place access tokens, exchange credentials, or other secrets in this public file.

## Docker deployment

The frontend is deployed separately from the API. Build the static assets first, then start the Nginx container:

```bash
npm run build
docker compose up -d --build
```

The frontend Compose service joins the external `bitpongo-net` network and proxies `/api/` and `/api/ws/` to `api:8000`. Start the [backend Compose stack](https://github.com/multind/bitpongo-api) first so that the shared network exists.

Set a different host port when necessary:

```bash
WEB_PORT=8080 docker compose up -d
```

The Compose configuration builds and tags `docker.io/corbettzhang/bitpongofront:latest`.

```bash
docker compose build
docker compose push
```

## Mobile WebView bridge

The optional channel is named `ZhitoubaoBridge` for backward compatibility. It accepts only these commands:

- `getContext`
- `saveImage`
- `shareImage`

Messages use the following envelope:

```json
{
  "version": 1,
  "command": "getContext",
  "requestId": "example-request-id",
  "payload": {}
}
```

The native shell resolves a request through `window.__ZHITOUBAO_NATIVE_RESOLVE__(requestId, result)`. In a normal browser, the bridge degrades safely and unanswered requests expire after 10 seconds.

## Security notes

- Never commit exchange keys, passwords, access tokens, Bark device keys, or production logs.
- Keep withdrawal permission disabled on every exchange API key.
- Serve production deployments over HTTPS.
- Keep the API and WebSocket routes same-origin through the provided Nginx proxy where possible.
- Account deletion is permanent and requires the current password, explicit consent, and confirmation.

## Contributing

1. Create a focused branch.
2. Add or update tests for behavior changes.
3. Run tests, type checking, and the production build.
4. Keep user-visible copy synchronized across all supported languages.
5. Open a pull request with screenshots for visual changes.

## License

Released under the [MIT License](LICENSE).
