# H5 功能迁移实施计划

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 在现有 Bitpongo 风格中实现源 H5 功能，前后端逐模块交付。 **Architecture:** 复用现有 Vue 认证/路由/三语与 Spring 模块；行情和提醒增加独立模块，关联现有用户、推送队列和市场缓存。 **Tech Stack:** Vue 3、TypeScript、NutUI、Spring Boot、Java 26、MySQL、Flyway。 **Spec:** ../specs/2026-10-03-h5-feature-migration-design.md

## Global Constraints

- 页面延续当前背景、卡片、间距、按钮及安全区。
- 使用现有 `{code,message,data}`，用户 ID、认证和时区规范。
- 提醒与实际下单计划分开；迁移不会自动启用真实下单。
- 三语 zh-cn/zh-tw/en-us；支持 iOS/Android WebView。
- 金额用 BigDecimal；日期使用带时区瞬时值。
- 保留源项目及当前用户未提交文件。

## Review Focus

- 快速切换币种时旧请求不能覆盖新页面数据。
- 上游超时和失效数据不得显示为实时有效价格。
- 提醒重复触发、重试及并发不得生成重复业务事件。
- Webhook 签名错误、过期及重放不得产生通知。
- 用户不能读取或操作其他账号规则、日志或设备会话。

## Task 1: 市场数据 API 与行情页

**Files:** 后端 market/MarketDataClient.java、BinanceMarketDataClient.java、MarketDataService.java、MarketController.java、MarketDtos.java；前端 src/api/market.ts、src/views/market/index.vue、components/CandleChart.vue、src/router/routes.ts、src/layout/index.vue、src/i18n/lang/*.ts。 **Interfaces:** GET /api/market/symbols?q=；GET /api/market/tickers；GET /api/market/candles?symbol=BTCUSDT&interval=1h&limit=120。Symbol(symbol,baseAsset,quoteAsset)、Ticker(symbol,lastPrice,changePercent,volume,updatedAt)、Candle(openTime,open,high,low,close,volume,closeTime)。

- [ ] Test MarketDataServiceTest: USDT spot only、limit 1..500、interval allowlist、非法 symbol 拒绝且不请求上游、缓存 TTL、上游失败显式错误。
- [ ] Run `./mvnw -Dtest=MarketDataServiceTest test`，确认缺失实现失败。
- [ ] 实现有超时的 Binance 公共市场读取，市场生产数据配置独立于交易 testnet；限制输入及缓存。
- [ ] 前端测试币种切换竞争、失败重试与离页停止刷新；实现行情搜索、交易对详情/K线、时间周期及时间标签。
- [ ] 后端相关测试、前端测试/typecheck/build 后提交，记录证据。

## Task 2: 价格提醒与管理中心

**Files:** 后端 alerts/PriceAlertRule.java、PriceAlertEvaluator.java、PriceAlertService.java、PriceAlertController.java、V下一版本__price_alerts.sql；前端 src/api/alerts.ts、src/views/alerts/{index,create,details}.vue。 **Interfaces:** /api/alerts 提供分页搜索、创建、复制、启停、删除及批量操作；规则含 symbol、condition、target、upper/lower、frequency、expiresAt、enabled。

- [ ] 测试 crossing/up/down/greater/less/channel 边界、一次与冷却、过期及用户隔离。
- [ ] 实现规则持久化、市场采样、触发幂等和管理 API。
- [ ] 实现快速创建、图表入口、列表筛选/搜索/复制/详情和批量管理。
- [ ] 验证刷新分页不重复、失败恢复及三语；提交。

## Task 3: 收件箱、日志、Webhook 与策略订阅

**Files:** 后端 alerts/AlertEventService.java、WebhookService.java、WebhookController.java、StrategySubscriptionService.java；前端 src/views/alerts/{logs,inbox,webhook,subscriptions}.vue。 **Interfaces:** /api/alerts/logs、/api/notifications/inbox、/api/webhooks、/api/strategy-subscriptions；事件提供 userId、ruleId、eventId、occurredAt、title、body、deepLink。

- [ ] 测试事务触发、入队幂等、日志/收件箱用户隔离和已读数量。
- [ ] 实现 Webhook 草稿/生成/作废、签名/白名单/重放校验并测试拒绝路径。
- [ ] 接现有原生推送与 Bark 配置，实现日志分页清理、收件箱/未读与提醒订阅。
- [ ] 验证端到端数据库及队列行为，记录依赖与提交。

## Task 4: 账号、偏好与会话设备

**Files:** auth/UserProfileService.java、AccountRecoveryService.java、LoginSessionService.java；前端 src/views/member/{profile,security,devices,preferences}/*。 **Interfaces:** 复用 /api/users；新增资料、验证码、密码恢复/变更、绑定和 session 撤销。

- [ ] 测试凭据与验证码过期、重复使用、用户隔离、密码变更与会话撤销。
- [ ] 实现资料及头像存储、颜色偏好、独立登录会话；使用现有三语和显示时区。
- [ ] 源社交登录、短信、主题原型按实际业务/提供器补全；外部密钥仅环境配置。
- [ ] 验证持久化和原账号兼容，提交。

## Task 5: 指标、内容、帮助、版本及集成验收

**Files:** market/MarketIndicatorService.java、content/ContentService.java、content/ContentController.java；前端 src/views/market/indicators.vue、src/views/help/_、src/views/articles/_、AppVersionService。 **Interfaces:** 指标历史列表、文章详情/分页、帮助搜索和搜索历史、当前 App 版本信息。

- [ ] 核对源后端提供器和内容权限；测试无数据、上游失败及分页。
- [ ] 实现指标缓存历史、内容阅读/帮助搜索、版本商店跳转。
- [ ] DCA 入口映射现有创建策略；F&G 提醒补全并验证不会下单。
- [ ] 按设计功能矩阵逐项验收前后端、WebView、三语、时区和外部服务配置；完整测试后提交。

## 执行记录

2026-10-03：用户已批准设计并要求开始，在本任务直接实施；计划文档用于后续持续记录。Task 1 开始。尚未部署或推送远端。
