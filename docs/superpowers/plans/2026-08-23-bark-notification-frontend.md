# Bitpongo Bark 通知设置前端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `bitpongo-front` 中删除钉钉及未启用的通知占位界面，提供安全、简洁、三语一致的 Bark 配置、测试和删除流程。

**Architecture:** 通知页只管理当前登录用户的 Bark 地址，所有数据通过后端 typed API 读取和保存；完整地址只存在于当前输入内存，不写入 LocalStorage 或控制台。页面提交当前语言和 App/浏览器时区，Bark 的铃声与优先级由后端事件策略统一控制。

**Tech Stack:** Vue 3、TypeScript 5.9、Vite 8、Pinia、Vue I18n、NutUI、Vitest、Vue Test Utils。

## Global Constraints

- 只修改 `/Volumes/ExternalDrive/Code/github/bitpongo-front`；旧 `zhitoubaofront` 仓库不在范围内。
- 后端 Bark 四个接口必须先完成：GET/PUT/DELETE `/users/notifications/bark` 和 POST `/users/notifications/bark/test`。
- 删除 `/users/ding`、钉钉、Telegram、Email 占位功能和对应文案，不保留兼容调用。
- 完整 Bark 地址不得写入日志、LocalStorage、错误上报、测试快照或 Git。
- 页面使用现有全局暖白背景和原生字体，不增加独立页面背景或字体覆盖。
- 用户只填写 Bark 推送地址；持续响铃、铃声、分组和通知级别不得由前端配置。
- 保存时将当前 locale 映射为 `zh-CN`、`zh-TW`、`en-US`，时区取 `getAppContext()?.timeZone`，缺失时使用浏览器 IANA 时区。

---

### Task 1: 增加 typed Bark API 并替换通知页

**Files:**

- Modify: `src/api/index.ts`
- Replace: `src/views/member/notice/index.vue`
- Create: `src/views/member/notice/index.spec.ts`
- Modify: `src/i18n/lang/lang-base.ts`
- Modify: `src/i18n/lang/zh-cn.ts`
- Modify: `src/i18n/lang/zh-tw.ts`
- Modify: `src/i18n/lang/en-us.ts`

**Interfaces:**

- Consumes: 后端 `BarkSettingResponse`、`BarkSettingRequest`、`BarkTestRequest`。
- Produces: `getBarkSetting()`、`saveBarkSetting(data)`、`deleteBarkSetting()`、`testBarkSetting(data?)` 和 Bark 设置页面。

- [ ] **Step 1: 编写失败的 Bark 页面组件测试**

测试使用 hoisted API mocks：

```ts
const mocks = vi.hoisted(() => ({
  getBarkSetting: vi.fn(),
  saveBarkSetting: vi.fn(),
  deleteBarkSetting: vi.fn(),
  testBarkSetting: vi.fn(),
  success: vi.fn(),
  fail: vi.fn(),
  showDialog: vi.fn(),
}));

vi.mock('@/api', () => ({
  getBarkSetting: mocks.getBarkSetting,
  saveBarkSetting: mocks.saveBarkSetting,
  deleteBarkSetting: mocks.deleteBarkSetting,
  testBarkSetting: mocks.testBarkSetting,
}));
```

四个真实行为测试：

```ts
it('renders only the Bark settings flow and never DingTalk placeholders', async () => {
  const wrapper = mountView();
  await flushPromises();
  expect(wrapper.text()).toContain('Bark 推送');
  expect(wrapper.text()).not.toMatch(/钉钉|Telegram|Email/);
  expect(wrapper.get('[data-test="bark-push-url"]').attributes('type')).toBe('password');
});

it('saves the input with current locale and App timezone', async () => {
  const wrapper = mountView();
  await flushPromises();
  await wrapper.get('[data-test="bark-push-url"]').setValue('https://api.day.app/example-key/test');
  await wrapper.get('[data-test="bark-save"]').trigger('click');
  await flushPromises();
  expect(mocks.saveBarkSetting).toHaveBeenCalledWith({
    push_url: 'https://api.day.app/example-key/test',
    enabled: true,
    locale: 'zh-CN',
    timezone: 'Asia/Shanghai',
  });
});

it('tests an unsaved address without persisting it', async () => {
  const wrapper = mountView();
  await flushPromises();
  await wrapper.get('[data-test="bark-push-url"]').setValue('https://api.day.app/example-key/test');
  await wrapper.get('[data-test="bark-test"]').trigger('click');
  await flushPromises();
  expect(mocks.testBarkSetting).toHaveBeenCalledWith({ push_url: 'https://api.day.app/example-key/test' });
  expect(mocks.saveBarkSetting).not.toHaveBeenCalled();
});

it('deletes the configured target only after confirmation', async () => {
  mocks.getBarkSetting.mockResolvedValue({
    configured: true,
    enabled: true,
    masked_push_url: 'https://api.day.app/****-key',
    locale: 'zh-CN',
    timezone: 'Asia/Shanghai',
    updated_at: null,
  });
  const wrapper = mountView();
  await flushPromises();
  await wrapper.get('[data-test="bark-remove"]').trigger('click');
  const dialog = mocks.showDialog.mock.calls[0]?.[0];
  expect(dialog?.title).toBe('删除 Bark 配置');
  await dialog.onOk();
  await flushPromises();
  expect(mocks.deleteBarkSetting).toHaveBeenCalledOnce();
});
```

测试中的 `example-key` 只是假值。Stub `nut-input`、`nut-button`、`nut-switch` 和确认弹窗，mock `getAppContext()` 返回 `Asia/Shanghai`。

- [ ] **Step 2: 运行测试并确认 RED**

Run:

```bash
npm test -- src/views/member/notice/index.spec.ts --reporter=verbose
```

Expected: FAIL，页面仍显示钉钉且 Bark API 不存在。

- [ ] **Step 3: 定义 typed API**

在 `src/api/index.ts` 增加：

```ts
export interface BarkSetting {
  configured: boolean;
  enabled: boolean;
  masked_push_url: string | null;
  locale: 'zh-CN' | 'zh-TW' | 'en-US';
  timezone: string;
  updated_at: string | null;
}

export interface BarkSettingRequest {
  push_url?: string;
  enabled?: boolean;
  locale?: BarkSetting['locale'];
  timezone?: string;
}

export const getBarkSetting = () => http.get<BarkSetting>('/users/notifications/bark');
export const saveBarkSetting = (data: BarkSettingRequest) => http.put<BarkSetting>('/users/notifications/bark', data);
export const deleteBarkSetting = () => http.delete<void>('/users/notifications/bark');
export const testBarkSetting = (data: { push_url?: string }) => http.post<{ sent: boolean }>('/users/notifications/bark/test', data);
```

删除旧 `ding()` 和 `noticeInfo()`。

- [ ] **Step 4: 实现 Bark 设置页面和三语文案**

页面结构固定为：标题、简短说明、状态行、密码型地址输入、显隐按钮、保存、测试、删除。已有配置加载后输入框保持空白，只显示 `masked_push_url`；空白保存表示只更新启用/locale/timezone，不覆盖已存 Key。未配置时保存和测试要求输入非空。

状态和操作使用以下简体中文键，繁体和英文保持相同语义：

```ts
notice: {
  intro: '使用 Bark 接收交易、计划和系统通知。通知声音会根据事件严重程度自动调整。',
  barkTitle: 'Bark 推送',
  pushUrl: 'Bark 推送地址',
  pushUrlPlaceholder: '粘贴 Bark App 中复制的测试地址',
  configured: '已配置',
  notConfigured: '未配置',
  enabled: '已启用',
  disabled: '已停用',
  save: '保存并启用',
  saving: '保存中...',
  test: '发送测试',
  testing: '发送中...',
  remove: '停用并删除',
  removeTitle: '删除 Bark 配置',
  removeConfirm: '删除后将无法接收通知，确定继续吗？',
  saved: 'Bark 配置已保存',
  sent: '测试通知已发送',
  removed: 'Bark 配置已删除',
  failed: '操作失败，请稍后重试',
}
```

使用 `showToast.success/fail` 和 `showDialog`。catch 只显示后端 message，不 `console.log/error`。locale 映射函数：`zh-cn → zh-CN`、`zh-tw → zh-TW`、`en-us → en-US`。

- [ ] **Step 5: 运行定向测试和 i18n 契约**

```bash
npm test -- src/views/member/notice/index.spec.ts src/i18n/consistency.spec.ts --reporter=verbose
npm run typecheck
```

Expected: Bark 页面测试和三语键一致性全部 PASS，typecheck 退出 0。

- [ ] **Step 6: 提交前端 Bark 页面**

```bash
git add src/api/index.ts src/views/member/notice/index.vue src/views/member/notice/index.spec.ts src/i18n/lang
git commit -m "feat: replace DingTalk settings with Bark"
```

---

### Task 2: 完成前端回归验证和秘密扫描

**Files:**

- Modify only if verification exposes a Bark-specific defect in Task 1 files.

**Interfaces:**

- Consumes: Task 1 完整页面和 API。
- Produces: 可发布前端构建及无钉钉/无真实 Bark Key 的仓库状态。

- [ ] **Step 1: 执行通知页相关验证**

```bash
npm test -- src/views/member/notice/index.spec.ts src/i18n/consistency.spec.ts src/mobile/app-context.spec.ts --reporter=verbose
npm run typecheck
npm exec -- eslint src/views/member/notice/index.vue src/views/member/notice/index.spec.ts src/api/index.ts --max-warnings 0
npm exec -- stylelint src/views/member/notice/index.vue --max-warnings 0
```

Expected: 全部退出 0。

- [ ] **Step 2: 执行完整测试和生产构建**

```bash
npm test
npm run build
git diff --check
```

Expected: build 退出 0。若完整测试仍只有修改前已存在的注册页 `.register-field` 边框断言失败，应准确报告 1 个基线失败；任何新增失败必须修复。

- [ ] **Step 3: 扫描旧通知实现与敏感地址**

```bash
rg -n -i "dingtalk|钉钉|/users/ding|dingTalkParam|signedPlaceholder" src
rg -n "api\.day\.app/[A-Za-z0-9_-]{8,}" src public docs package.json
```

Expected: 两条命令均无输出。测试只能使用长度短且明确标记为示例的 `example-key`，不得匹配真实 Key 扫描规则。

- [ ] **Step 4: 检查两仓提交和工作区**

```bash
git status --short --branch
git -C /Volumes/ExternalDrive/Code/github/bitpongo-api status --short --branch
```

Expected: 前后端 `main` 均无未提交文件；分别保留各自提交历史，不交叉提交。
