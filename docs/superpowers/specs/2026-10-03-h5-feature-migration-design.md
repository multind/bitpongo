# Tradebot H5 → Bitpongo 功能迁移方案

## 目标与已确认约束

将 `/Volumes/ExternalDrive/Project/dession/tradebot/tradebot-mobile-h5` 的功能合并到 `/Volumes/ExternalDrive/Project/Code/github/bitpongo-front`（origin: `https://github.com/multind/bitpongo.git`）。用户已确认保留 Bitpongo 现有风格。复用现有布局、背景、卡片、表单、国际化、时区、认证和原生推送桥接。新增功能使用当前 API 和数据库规范，支持浏览器及 iOS/Android WebView。

当前后端为 `/Volumes/ExternalDrive/Project/Code/github/bitpongo-api`。源后端 `/Volumes/ExternalDrive/Project/dession/tradebot/tradebot-server` 仅作为业务语义参考；迁移时逐项检查其实际实现，不复制整套微服务基础设施。

## 已核对的差异

| 功能 | 源 H5 证据 | 当前项目 | 迁移处理 |
| --- | --- | --- | --- |
| 登录、注册、退出、注销 | MemberInfoController；login/register/me | 已有邮箱认证和注销 | 合并必要能力，使用现有账号及 Token |
| 找回、修改密码、绑定邮箱/手机 | forget、update-password、bind-email、bind-phone；验证码 API | 当前 UserController 未提供对应接口 | 单独补身份校验与验证码流程；短信服务列为部署依赖 |
| 资料、头像、昵称、国家、简介 | me/basic-info、nickname、country、intro | profile 基础查询 | 按用户所有权补资料 API、头像上传与文件存储 |
| 社交账号 | me/social 查询 getSocialAccountInfo；生成 API 包含 Google 验证与解绑 | 未提供 | 先核对源端绑定/登录实际链路；OAuth 配置属于部署依赖，不能仅凭按钮认定完成 |
| 语言、涨跌颜色 | me/preferences、language、color | 三语及用户时区已存在 | 复用三语，增加涨跌颜色偏好 |
| 主题 | me/theme 仅 ref，使用语言代码作为选项且没有持久化 | 当前统一浅色界面 | 源端为原型；如补完整主题，需要全局色彩变量及持久化，不直接复制原型 |
| 登录设备管理 | DeviceInfoController、me/device | 有推送设备，不等于登录会话 | 新增会话登记和撤销；与 push_device 分开 |
| 行情、K 线、币种选择 | CandlestickController、SymbolInfoController、chart、quick | 已有价格缓存及 /api/ws/price | 扩展市场数据 API 和订阅；保留现有价格协议 |
| 恐惧贪婪及市场指标 | FearAndGreedIndexController、IndexRelatedController | 无对应接口 | 补数据提供器、缓存、历史查询和失效状态 |
| 快速价格提醒 | quick、PriceAlertController | 无提醒实体/API | 补创建、触发、过期、重复控制及通知入队 |
| 图表价格提醒 | chart、AlertsInfoStandardSaveDTO | 无对应能力 | 明确穿越/上穿/下穿/大于/小于/通道语义；逐笔与 K 线触发分开 |
| 提醒中心 | notice/index、AlertCenterController | 通知设置，非提醒管理 | 新增搜索、筛选、详情、复制、启停、批量操作、展示偏好 |
| Webhook 提醒 | webhook 五步、WebhookAlertController | 无对应能力 | 新增草稿、URL 生成、签名、关键词、IP 白名单、接收、作废及触发记录 |
| 策略提醒订阅 | home/strategy、strategy-detail；StrategyAlertController | 现有策略用于实际自动买入 | 新增独立提醒订阅，不能混同实际下单计划 |
| DCA / F&G 机器人 | trade/dcaBot、fgBot：硬编码选项，完成按钮无保存处理 | DCA 自动买入已实现 | DCA 复用现有计划；F&G 原型单独列出业务补全，默认仅提醒，不擅自启用杠杆/做空 |
| 通知收件箱、已读、未读数 | home/notice、alert；MemberNoticesInfoController | 现有 push_delivery 为发送队列 | 新增用户收件箱，区分通知内容、已读状态与发送记录 |
| 提醒日志 | notice/log、AlertLogController | 订单执行记录及推送队列 | 新增提醒触发日志、分页、单条删除/清空 |
| 文章与帮助搜索 | article-detail、HelpCenterController、help/search | 关于、协议、隐私及独立文档站 | 新增内容阅读和搜索接口；核对源帮助首页入口及内容来源 |
| 通知通道配置 | MemberNoticeConfigController、reminder-settings | 原生 FCM/APNs + Bark | 复用可靠发送队列和当前偏好；新增通道需有实际服务配置 |
| App 版本检测 | appVersionController | Flutter 壳独立发布 | 核对源调用点后接入版本信息；商店跳转使用当前应用标识 |

以上“有 API”代表源 H5 存在调用/类型声明，不等于服务已验证可用。备份页面 `index copy.vue`、`index copy 2.vue` 不作为独立功能。

## 集成方案

推荐将业务并入现有前后端模块。直接连接旧 `/app/*` 服务会依赖另一套账号和返回结构；整体替换前端会影响现有 App 桥接及页面风格。因此采用领域逐项迁移：前端继续使用当前 Axios、Pinia、路由和 `{code,message,data}`；后端继续使用 Spring 模块、Flyway、现有用户 ID 和发送队列。

导航增加“行情”和“提醒”入口，保留“策略”“我的”。文章/市场指标放行情首页；提醒中心承载价格、策略订阅及 Webhook；账号能力放现有账号设置。卡片间距、按钮、弹窗、安全区、刷新行为延续当前规范。通知权限和设备绑定留在现有通知设置。

行情通过后端数据提供器供应。源端 `useWebSocket.ts` 硬编码 `wss://api.multind.com/api/socket/v1`，消息协议与当前 `/api/ws/price` 不同，迁移时使用当前运行时配置和明确的新订阅协议；重连恢复订阅，离页释放资源。金额与价格后端使用 BigDecimal；日期 API 使用带时区的瞬时时间，界面沿用用户显示时区。

提醒引擎维护规则状态、触发基准、冷却时间、到期时间和幂等事件 ID。一次触发同时持久化收件箱/日志并入队推送，通知失败不重复产生业务触发。Webhook 接收校验凭据、签名、白名单、请求大小与重放，保存参数避免密钥进入 URL 查询和日志。

账号资料和会话仅允许当前用户读取/修改。登录设备撤销必须使会话失效，不能只删除展示记录。社交登录、短信、邮件、指标提供器和内容源配置逐项记录为部署依赖；未配置时给出可理解的不可用状态。

## 实施顺序与验收

1. 固化全部路由、组件调用、API 和 DTO 映射；核对源后端行为，记录原型及外部依赖。保存现有测试基线和用户未提交文件。
2. 行情/指标 API、K 线、币种选择与新页面入口；验证切换币种、历史/实时拼接、断线恢复、三语与时区。
3. 价格提醒、中心管理与触发引擎；验证 crossing 边界、一次/重复/每分钟/K 线规则、过期和并发幂等。
4. Webhook、策略订阅、收件箱和日志，接现有推送；验证签名错误、重放、用户隔离、启停和深链。
5. 资料、密码、绑定、设备会话和偏好；验证凭据校验、会话撤销、持久化与原账号兼容。
6. 内容/帮助搜索、版本检测、源原型补全与集成收尾；外部服务配置与产品语义有缺口时明确列出，不将占位页面计为完成。

每一阶段交付可操作页面及对应接口。前端运行相关行为测试、类型检查和生产构建；后端对触发幂等、权限、Webhook、会话失效运行测试，数据库迁移与队列在可用 MySQL 环境中验证。最终逐项检查迁移矩阵、浏览器/WebView布局及内置前端打包兼容。

## 当前交付边界

本文件是源代码检查后的设计及功能清单，尚未开始业务实现。外部服务实际配置、源数据迁移、生产部署和应用商店上传需按对应阶段处理。当前前端有未跟踪 Dockerfile，后端有 .idea/misc.xml 修改；保持其原状，提交只包含本任务文件。
