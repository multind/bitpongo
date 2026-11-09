# Bitpongo legal source update — for review, not published

This proposal supplies replacement passages for the existing terms and privacy policy. Keep the other sections unchanged at this stage. The English and Simplified Chinese text below describe the same behavior. Do not set a new effective date or use this draft as the public policy before review.

## 服务条款 / Terms of Service

### 1. 服务范围 / Service scope

Bitpongo 是一款软件工具，可用于连接受支持的交易所账户、配置自动化交易策略（例如定投和 F&G 策略）、查看订单和持仓，以及设置提醒。交易指令由受支持的交易所处理。Bitpongo 不是交易所、经纪商、托管机构或财务顾问。

Bitpongo is a software tool for connecting supported exchange accounts, configuring automated trading strategies such as recurring buys and F&G strategies, viewing orders and positions, and setting alerts. Trading instructions are processed by the supported exchange. Bitpongo is not an exchange, broker, custodian, or financial adviser.

### 2. 凭据 / Credentials

只连接你有权控制的交易所账户。请仅授予所需的最小 API 权限，并关闭提现权限。请妥善保管账号密码、交易所 API 凭据和通知渠道凭据，包括可用于向你的渠道发送消息的 Webhook 地址。

Connect only exchange accounts you are authorized to control. Grant only the API permissions you need and keep withdrawal permission disabled. Protect your account password, exchange API credentials, and notification-channel credentials, including webhook URLs that can be used to send messages to your channels.

### 3. 交易风险 / Trading risk

数字资产交易可能造成部分或全部损失。采用杠杆时，损失可能被放大，并可能发生强制平仓。自动下单和退出条件并不保证成交或成交价格。提醒可能延迟或无法送达，不能代替你查看交易所的订单与持仓状态。

Digital-asset trading may result in partial or total losses. Leverage can magnify losses and may lead to liquidation. Automated order submission and exit conditions do not guarantee execution or the execution price. Alerts can be delayed or fail to arrive and do not replace checking orders and positions on your exchange.

### 4. 第三方服务 / Third-party services

交易所与外部通知服务由第三方运营。你可在可用时选择启用相关渠道；使用这些服务也适用其各自的条款和隐私政策。

Exchanges and external notification services are operated by third parties. You can choose to enable supported channels when available. The providers’ own terms and privacy policies also apply to their services.

### 6. 账号注销 / Account deletion

你可在「我的 → 账号安全 → 注销账号」发起注销。注销不可撤销，也不等同于关闭交易所账户或平掉交易所持仓。注销前请先在交易所核对未完成的订单和持仓。

You can start account deletion under Me → Account Security → Delete Account. Deletion cannot be undone. It does not close your exchange account or close positions held at an exchange. Check open orders and positions directly on the exchange before deleting your account.

## 隐私政策 / Privacy Policy

### 1. 个人资料 / Profile information

如果你上传头像，Bitpongo 会处理并保存图片，用于显示你的个人资料。你可以在个人资料中更换或移除头像。策略在策略广场展示时，其他已登录用户可能看到你的头像和显示名称；如果没有名称，界面可能显示遮罩后的邮箱地址。分享策略前，请先检查分享页展示的信息。

If you upload an avatar, Bitpongo processes and stores the image to display your profile. You can replace or remove it in Profile. When a strategy is listed in the strategy gallery, other signed-in users may see your avatar and display name. If no name is set, the interface may show a masked email address. Before sharing a strategy, check the information shown on the share page.

### 1、3. 通知信息与外部服务 / Notification information and external services

启用通知时，Bitpongo 使用通知偏好和所选渠道需要的信息来发送提醒。原生通知通过 Firebase Cloud Messaging 发送，iOS 端使用 Apple APNs 投递。使用邮件、Telegram 或 Webhook 等外部渠道时，会使用对应的收件地址、渠道绑定或目标地址，并向所选渠道发送通知内容。你可以关闭对应渠道；也可以在系统设置中调整 App 通知权限。

When you enable notifications, Bitpongo uses your preferences and the information needed by your chosen channel to deliver alerts. Native notifications are sent through Firebase Cloud Messaging and use Apple APNs for iOS delivery. For external channels such as email, Telegram, or webhooks, Bitpongo uses the corresponding recipient address, channel binding, or destination URL and sends the notification content to the selected channel. You can turn off a channel or change the app’s notification permission in system settings.

### 5、7. 删除入口 / Where to request deletion

你可以在「我的 → 账号安全 → 注销账号」发起注销。有关其他个人资料访问、更正或删除的请求，可通过隐私政策末尾列出的联系方式提出。

You can start account deletion under Me → Account Security → Delete Account. For other requests to access, correct, or delete personal information, use the contact details at the end of the Privacy Policy.

## 发布前核对 / Before publishing

- Production configuration check (2026-11-10): the deployed API is `ab7e6ee`; native FCM, outbound webhook, account email, and legacy Bark flags are enabled, and the Telegram settings are present. This does not prove delivery or establish that email alerts use the same configuration as account verification mail. Confirm channel payloads and retain legacy Bark disclosure while it remains enabled.
- The deployed `PresetController` requires a signed-in user for the strategy gallery, and `PresetService` supplies the listed strategy author's stored avatar and name (or masked email fallback). This does not establish visibility on independent share URLs or whether existing downloaded images can be recalled.
- The deployed `AccountDeletionService` verifies the current password, anonymizes the account record, stops its DCA plans, clears exchange credentials, and removes selected associated data. Do not describe this as immediate erasure of all data. Confirm the inventory of retained records and backups, retention purpose, and duration. The proposed email-verified deletion flow is not asserted here.
- Confirm the operator/contact details and effective date. Review the full source, not just these passages, with the policy owner before translation.
- Apple’s [App Review Guidelines §5.1.1](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage) provide the store-review checklist for collection, use, retention and deletion disclosures. This proposal does not establish compliance.
