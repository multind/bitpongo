# 翻译准确性检查（2026-11-11）

范围：`docs/i18n-drafts/*.draft.json` 的 12 种语言 × 809 个键（逐条对照 `src/i18n/lang/en-us.ts`），以及通知设置页的独立目录 `src/views/member/notice/push-copy-locales.json`（12 种语言 × 57 个键）。结构检查（键、占位符、星期、覆盖项）已全部通过；本文件只记录**语义和用词**问题。这是机器辅助的审校，不能替代母语审校。

## 处理状态（同日更新）

已按"以中文为对照、按地区个性化"处理：

- 第一节的两项，以及第二节中除 ko `이상/이하` 以外的所有条目，都已修正；ko 那一项需要对照后端确认。
- 另外按中文原意，在 12 种语言中统一修改了以下键：`fng.increaseRatio`（加仓比例）、`common.pending`（待审核）、`profile.choosePresetAvatar`（内置头像）、`alerts.manageSelection`（批量管理）、`register.nameLabel`（昵称）。
- 主目录的修改记录在 `regional-overrides.json`，重新生成草稿后用 `apply-regional.mjs` 再次应用。
- 通知设置页目录 `push-copy-locales.json` 已从中文整份重译。页面标题保留原文，与"我的"菜单中的入口名称一致。
- 第三节的润色项只改了 fr/it 的撇号、de 的 `{day}. Tag`、ko 的 `기간`、id 的 `Edit`，其余未改。

## 回译检查与术语对齐（同日）

**术语对齐。**参照 Binance 和 OKX 官方帮助中心的本地化用语：

| 语言       | 参照来源            | 结论                                                                                   |
| ---------- | ------------------- | -------------------------------------------------------------------------------------- |
| vi、id、ar | Binance、OKX        | 一致                                                                                   |
| es-MX      | Binance 拉美版、OKX | "交易所"改为 _exchange_（原为 _plataforma de intercambio_）                            |
| es-ES      | OKX                 | 同上                                                                                   |
| pt-BR      | OKX 巴西版          | 一致                                                                                   |
| it         | OKX 意大利版        | 做多/做空改为 _posizione long/short_                                                   |
| fr         | OKX 法国版          | 一致                                                                                   |
| de         | Binance、OKX        | 术语一致；称呼问题见下                                                                 |
| ja、ko、th | 无                  | 两家在当地没有本地化的合约业务，沿用社区通行说法（ロング/ショート、롱/숏、Long/Short） |

**德语称呼（已决定）。**Binance 和 OKX 的德语页面都用非正式的 _du_，Trade Republic、N26、Bitpanda 等德国金融科技应用也用 _du_。已按此把德语全部统一为 _du_（小写），涉及主目录 84 条、账户草稿 13 条、通知设置页 11 条。

**回译。**把 235 个高风险键（账户、安全、登录注册、F&G 策略、仓位状态、风险提示、定投执行原因等）逐条盲读回译，对照中文原意。发现并已修正：

- vi：仓位状态"开仓中"和"持仓中"回译后都是"正在开仓"，两者无法区分 → 改为 _Đang mở vị thế_ / _Đang nắm giữ_。
- ar：定投"每期金额"用了 _قسط_（贷款分期）；订阅说明有一处阴阳性不一致。
- de：仓位状态"待补平"译成了"正在重试平仓" → _Erneuter Schließversuch ausstehend_。
- es、pt-BR：同一页面上"止损"一处写 _Stop loss_，一处写 _límite de pérdidas_ / _limite de perda_，"回撤平仓"写成 _stop dinámico_ / _stop móvel_ → 统一为交易所通用的 take profit / stop loss / trailing stop。
- es-ES：_Se alcanzó_ 改为西班牙常用的 _Se ha alcanzado_。

ja、ko、th、id、fr、it 未发现意思错误。

**局限。**通知设置页目录是本次从中文新译的，回译由同一译者完成，作用有限。回译也发现不了"意思对但不地道"的问题。

## 一、必须修复

### 1. 通知设置页目录基本不可用（全部 12 种语言）

`push-copy-locales.json` 57 个键中，只有约 10 个是人工改过的（`errors.registration_failed`、`title`、`intro`、`planAlerts`、`save`、`test`、`queued`、`saved`、`deviceEnabled/Disabled`、`unregistered`、`none`）。其余是质量很差的机器翻译，而且除 `diagnostics.*` 外几乎都会显示在页面上（`index.vue` 引用了 `errors`、权限状态、`pending`、`settings`、`refresh`、`revoke`、`soundHelp` 等）。典型错误：

| 键 | 语言 | 现有译文 | 问题 |
| --- | --- | --- | --- |
| `yes` / `no` | ko / id / de / fr | `예 예`、`Ya Ya`、`Ja Ja`；`nicht`、`pas non`、`아니 아니요` | 重复或错词 |
| `refresh` | es / pt / it / de / vi / th | `Refrigerar el estado`（冷藏）、`Ristrutturazione dello stato`（装修）、`Erneuerung des Status`、`Tăng cường trạng thái` | 完全错义 |
| `settings` | es / pt / ja / ko / th / id / fr | `Instalaciones de sistema abierto`、`オープンシステム設定`、`ระบบเปิดตัว`、`Système ouvert` | 把"打开系统设置"译成"开放系统" |
| `soundEnabled` | de / pt / es | `Sonde`（探针）、`sonoridade`、小写 `sonido` | 错词 |
| `diagnostics.session` | vi | `Lời bài hát: Local Login Session Present` | "歌词："前缀，未翻译 |
| `errors.bridge_unavailable`、`unsupported` | ja / ko / fr | `先住民アプリ`、`원주민`、`autochtone` | native 译成"原住民" |
| `devicesUnavailable` | ko / id / fr / de / es / ar | `refresh to retry.` 原文残留；`refresca a retrasar`；`تجديد إلى الانسحاب` | 残留英文 / 错义 |
| `failed` | fr / it / de | `Je ne peux pas…`、`Non riesco…`、`Sie können diese Anfrage nicht abschließen` | 主语变成"我/您" |
| `tradeSucceeded` / `tradeFailed` | es / pt / it / fr / ar | `Comercio exitoso`、`Travaux échoués`、`تجارة ناجحة` | "交易"译成"商业/工作" |
| `unsupported` | es-es / es-mx | 只有第一句，且 `que se apoya` 错义 | 漏译 |
| `pending` | 多数语言 | `サービスに接続して押す`、`servicios de impulso`、`Druckdienstleister` | push 译成"按压/冲力" |
| `errors.device_revoked` | ar / es | `محظور`（被封禁）；`Elegir en este dispositivo`（缺 "Permitir"） | 错义 / 漏词 |

**建议：**以英文为源，整份目录重新翻译（参照主目录里已审校的用词，如"推送""刷新状态""打开系统设置"），之后再请母语人员审校。README 中说"其余生成文案还需审校"，低估了这里的问题。

### 2. 西班牙语登录 / 注册流程（es-ES、es-MX）

- `login.submitting`：`Iniciar sesión...` 是按钮文字，不是进行中状态 → `Iniciando sesión…`
- `register.nameLabel`：`Mostrar nombre` 是动词短语"显示名称" → `Nombre visible` / `Nombre para mostrar`
- 同意条款的句子语法错误：`login.agreePrefix` `Al iniciar sesión, acepta el` + `login.agreement` `condiciones de servicio` 拼成"el condiciones"；`register.agreePrefix` `He leído y estoy de acuerdo con el` 同理 → `…, aceptas las` / `He leído y acepto las` + `Condiciones del servicio`。另外 `member.agreement` 是 `Términos del servicio`，与这里不一致。
- `security.resend`：`Reenviar en {seconds} S`，大写 S → `{seconds} s`
- `login.goRegister`：`crear uno`，cuenta 是阴性 → `Crea una`

## 二、建议修复（中等）

- **德语称呼混用**：大部分界面用 Sie，账户/安全/登录/注册用 du（`Melde dich`、`Gib … dein`、`Prüfe`、`Verwende`、`Du hast bereits ein Konto?`）。金融类应用建议统一为 Sie。（后续决定：按 Binance、OKX 的用法统一为 du，见上文。）
- **西班牙语称呼混用**：全局用 tú，但登录/注册/安全页大量用 usted（`Ingrese su contraseña`、`Por favor revise sus credenciales`、`Regístrese`、`Vuelva a intentarlo`）。同一屏的相邻输入框 `Ingresa tu e-mail` 与 `Ingrese su contraseña` 也不一致。es-ES 应使用 `Introduce`，`Ingresa` 是拉美用法。另有 `e-mail` 与 `correo electrónico` 混用、`security.changePassword` 用了命令式 `Cambia la contraseña`（应为 `Cambiar contraseña`）、`security.email` 首字母小写。
- **"我的"标签页直译**：`tabbar.member` 在 es/pt/de/it 中是 `Yo` / `Eu` / `Ich` / `Io`，作为标签名不自然 → `Mi cuenta` / `Conta` / `Profil` / `Profilo`（ja `マイページ`、ar `حسابي` 是好的参照）。同时导航路径也不一致：`fng.exchangeMissing` 写 `Mi cuenta →` / `Minha conta →`，`wizard.deliveryHelp` 写 `Yo →` / `Eu →`。修正标签名后两处要统一。
- **ar `fngDetail.winRate`**：`نسبة الربح` 是"利润率"，不是胜率 → `نسبة الصفقات الرابحة`
- **ja 报价货币**：`details.quoteCurrency` 和 `wizard.targetHelp` 用了 `決済通貨`（结算货币）→ `建値通貨`
- **es `sessions.revoke`**：`Cerrar sesión` 与"退出登录"同词，在其他设备列表上容易误解 → `Revocar sesión`
- **es-MX `home.performance`**：`Rendimiento` 与 es-MX 中的"收益"同词 → `Desempeño`
- **de `register.agreePrefix`**：`Ich habe sie gelesen und akzeptiere die`，代词 sie 指向后面才出现的名词 → `Ich akzeptiere die`
- **ja / th `release.store`**：`App Store` 是苹果商店名，原文 "App store" 是泛指（Android 是 Google Play）→ `ストアを開く` / `เปิดสโตร์แอป`
- **ko 条件比较**：`alerts.conditions.ABOVE/BELOW` 用 `이상/이하`，含等于。若后端是严格比较，应改 `초과/미만`；需对照后端确认。
- **ja `common.pending`**：`審査中`（审核中）只用于交易所 API 状态。如果实际含义是"等待验证"，改 `確認中`。
- **de `subscriptions.dca`**：`Cost-Average-Effekt` 指的是效果，不是方法 → `Sparplan (DCA)`
- **it `presets.withdrawAction`**：`Rimuovi`（删除）用于"下架"，听起来像破坏性操作 → `Nascondi`
- **id `strategy.instalmentBelowMinimum`**：`cicilan` 是贷款分期 → `Setiap pembelian`

## 三、润色（低优先级）

- fr / it：直角撇号 `'` 与弯撇号 `’` 混用（账户草稿用 `’`，其余用 `'`）。
- es / fr：`exchange` 译为 `Plataforma de intercambio` / `Plateforme d'échange`，加密圈通常直接用 `exchange`；es-ES `Recoge beneficios` → `Toma beneficios`；es-ES `app` 与 `aplicación` 混用。
- de：`Strategie-Marktplatz` 有"买卖"含义，其他语言都是"广场"；`Spitzname` → `Anzeigename`；`Laufzeitalarme` 不自然；`{day}. Tag` → `Am {day}.`；`Seite teilen` 像动词短语。
- ko：`market.interval` 的 `기간`（期间）用于 K 线周期 → `주기`；`tabbar.alerts` 的 `알림` 与"通知"同词。
- ar：`webhook.revoke` 的 `إلغاء` 与"取消"同词；`common.runningFor`、`frequency.hourInterval` 的名词没有随数字变化（需要复数规则支持）。
- fr：`frequency.weeklyPattern` 拼出 `le Lun.`（句中大写缩写）。
- id：`outboundWebhook.edit` 用了英文 `Edit` → `Ubah`。

## 四、未覆盖 / 仍需人工

- 母语人员审校（尤其是 README 点名的开平仓、交易周期、账户删除、风险提示）。本次检查已覆盖这些键，未发现语义错误，但仍需母语确认。
- 服务条款和隐私政策（独立目录，见 `legal-source-review.md`）。
- NutUI 组件自带文案、阿拉伯语 RTL 实机布局。
- `check.mjs` 的 i18n 语法编译步骤，需要先安装依赖才能运行。
