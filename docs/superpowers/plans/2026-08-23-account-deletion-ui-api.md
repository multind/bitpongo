# 注销账号页面与接口修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 简化注销账号页面及三语文案，并修复错误确认密码导致用户被强制退出的问题。

**Architecture:** 前端保留现有 Pinia action、DELETE 请求和二次确认流程，只替换账号设置页的展示结构、样式和语言资源。后端保留注销事务及认证链路，仅把已登录用户的错误确认密码从业务码 401 改为 400，使前端全局 401 拦截器只处理真正的认证失效。

**Tech Stack:** Vue 3、TypeScript、SCSS、Vue I18n、Pinia、NutUI、Java 26、Spring Boot 4.1、Spring Security、Spring Data JPA。

## Global Constraints

- 前端仓库固定为 `/Volumes/ExternalDrive/Code/github/bitpongo-front`，后端仓库固定为 `/Volumes/ExternalDrive/Code/github/bitpongo-api`。
- 两个仓库都直接在 `main` 修改并分别提交；不得修改旧 `zhitoubao` 仓库。
- 保持 `DELETE /api/users/account`、`{ "password": "..." }` 请求体和成功响应不变。
- 当前密码错误返回 HTTP 400；Token 无效、账号不存在或已注销仍返回 HTTP 401。
- 保持注销事务、前端成功跳转和失败重试流程不变。
- 按用户要求不执行自动化或发版测试；只让现有契约测试源码与新文案、状态码保持一致，由用户执行验证。

---

### Task 1: 简化前端注销账号页面和三语文案

**Files:**
- Modify: `src/views/member/account/index.vue`
- Modify: `src/i18n/lang/lang-base.ts`
- Modify: `src/i18n/lang/zh-cn.ts`
- Modify: `src/i18n/lang/zh-tw.ts`
- Modify: `src/i18n/lang/en-us.ts`
- Modify: `src/views/member/account/index.spec.ts`

**Interfaces:**
- Consumes: `useUserStore().deleteAccount(password: string): Promise<void>`、`showDialog(options)`、现有 `account.*` I18n 命名空间。
- Produces: 保持原有 `data-test="account-password"`、`data-test="account-confirmation"`、`data-test="delete-account"`，供现有交互和契约测试继续使用。

- [ ] **Step 1: 将页面模板改为普通表单结构**

删除 `warning-card`、三条 `nut-cell` 后果列表和 `confirmation-card`，保留交互控件并改成：

```vue
<main class="account-settings">
  <h1>{{ t('account.deleteTitle') }}</h1>
  <p class="subtitle">{{ t('account.deleteWarning') }}</p>

  <section class="account-form">
    <label class="field-label" for="account-password">{{ t('account.passwordLabel') }}</label>
    <nut-input
      id="account-password"
      v-model="password"
      class="account-password"
      data-test="account-password"
      type="password"
      autocomplete="current-password"
      :placeholder="t('account.passwordPlaceholder')"
      :disabled="loading"
    />
    <nut-checkbox v-model="acknowledged" data-test="account-confirmation" :disabled="loading">
      {{ t('account.acknowledge') }}
    </nut-checkbox>
    <nut-button
      block
      class="delete-button"
      color="#d93025"
      size="large"
      data-test="delete-account"
      :disabled="!canSubmit || loading"
      :loading="loading"
      @click="requestConfirmation"
    >
      {{ t('account.deleteButton') }}
    </nut-button>
  </section>
</main>
```

- [ ] **Step 2: 将样式与注册页层级对齐**

用以下规则替换账号页现有 scoped SCSS；不增加整块红色警告背景：

```scss
.account-settings {
  padding: 1.25rem;
}

h1 {
  margin: 0;
  font-size: 1.625rem;
  line-height: 1.25;
  color: #101010;
}

.subtitle {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  line-height: 1.5;
  color: #666;
}

.account-form {
  margin-top: 2.5rem;
}

.field-label {
  display: block;
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: #333;
}

.account-password {
  --nut-input-font-size: 1rem;
}

.nut-checkbox {
  margin: 1.375rem 0.625rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.delete-button {
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}
```

- [ ] **Step 3: 精简三种语言资源**

从 `AccountLocale` 及三个语言文件删除 `stopPlans`、`removeApiKeys`、`anonymizeHistory`。将简体中文 `account` 文案改为：

```ts
account: {
  deleteTitle: '注销账号',
  deleteWarning: '注销后，账号及相关数据将无法恢复。',
  passwordLabel: '当前密码',
  passwordPlaceholder: '请输入当前密码',
  acknowledge: '我已了解并确认注销账号',
  deleteButton: '确认注销',
  deleteFailed: '注销失败，请稍后重试',
  deleteConfirmTitle: '确认注销账号',
  deleteConfirmContent: '账号注销后无法恢复，确定继续吗？',
},
```

繁体中文使用：

```ts
account: {
  deleteTitle: '刪除帳號',
  deleteWarning: '刪除後，帳號及相關資料將無法復原。',
  passwordLabel: '目前密碼',
  passwordPlaceholder: '請輸入目前密碼',
  acknowledge: '我已了解並確認刪除帳號',
  deleteButton: '確認刪除',
  deleteFailed: '刪除失敗，請稍後再試',
  deleteConfirmTitle: '確認刪除帳號',
  deleteConfirmContent: '帳號刪除後無法復原，確定繼續嗎？',
},
```

英文使用：

```ts
account: {
  deleteTitle: 'Delete account',
  deleteWarning: 'Your account and related data cannot be recovered after deletion.',
  passwordLabel: 'Current password',
  passwordPlaceholder: 'Enter your current password',
  acknowledge: 'I understand and confirm that I want to delete my account',
  deleteButton: 'Confirm deletion',
  deleteFailed: 'Deletion failed. Please try again later.',
  deleteConfirmTitle: 'Confirm account deletion',
  deleteConfirmContent: 'Your account cannot be recovered after deletion. Continue?',
},
```

- [ ] **Step 4: 同步现有前端契约测试源码**

将 `explains every account deletion consequence` 替换为只验证精简说明的测试，保留其余交互测试不变：

```ts
it('shows a concise irreversible deletion warning', () => {
  const { wrapper } = mountView();

  expect(wrapper.text()).toContain('注销后，账号及相关数据将无法恢复。');
  expect(wrapper.text()).not.toContain('停止全部运行中的策略');
  expect(wrapper.text()).not.toContain('删除交易所 API 密钥');
  expect(wrapper.text()).not.toContain('匿名保留历史记录');
});
```

将成功路径中的弹窗内容补充为新文案断言：

```ts
expect(currentDialog().title).toBe('确认注销账号');
expect(currentDialog().content).toBe('账号注销后无法恢复，确定继续吗？');
```

- [ ] **Step 5: 做不执行测试的范围检查并提交前端**

检查命令只核对改动范围和空白错误：

```bash
git diff --check
git status --short
git diff -- src/views/member/account/index.vue src/i18n/lang/lang-base.ts src/i18n/lang/zh-cn.ts src/i18n/lang/zh-tw.ts src/i18n/lang/en-us.ts src/views/member/account/index.spec.ts
git add src/views/member/account/index.vue src/i18n/lang/lang-base.ts src/i18n/lang/zh-cn.ts src/i18n/lang/zh-tw.ts src/i18n/lang/en-us.ts src/views/member/account/index.spec.ts
git commit -m "style: 简化注销账号页面"
```

### Task 2: 修复后端错误确认密码的 HTTP 状态码

**Files:**
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-api/src/main/java/com/multind/bitpongo/auth/AccountDeletionService.java`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-api/src/test/java/com/multind/bitpongo/auth/AccountDeletionServiceTest.java`

**Interfaces:**
- Consumes: `PasswordCompatibilityService.matches(String raw, String encoded)`、`BusinessException(int code, String message)`。
- Produces: 已认证用户确认密码错误时抛出 `BusinessException(400, "密码错误")`；其他注销和认证行为不变。

- [ ] **Step 1: 修改错误确认密码业务码**

在 `AccountDeletionService.delete(long userId, String password)` 中仅替换密码不匹配分支：

```java
if (!passwords.matches(password, user.getPassword())) {
    throw new BusinessException(400, "密码错误");
}
```

不得修改账号不可用的 401 分支、事务注解、策略状态、凭据清理、匿名化或提交后暂停逻辑。

- [ ] **Step 2: 同步现有后端契约测试源码**

在 `wrongPasswordLeavesAccountAndTradingDataUnchanged` 中将业务码断言从 401 改为 400，其余“不修改任何数据”的断言保持不变：

```java
assertThatThrownBy(() -> service.delete(7L, "wrong"))
        .isInstanceOfSatisfying(BusinessException.class, error -> {
            assertThat(error.getCode()).isEqualTo(400);
            assertThat(error.getMessage()).isEqualTo("密码错误");
        });
```

- [ ] **Step 3: 做不执行测试的范围检查并提交后端**

```bash
git diff --check
git status --short
git diff -- src/main/java/com/multind/bitpongo/auth/AccountDeletionService.java src/test/java/com/multind/bitpongo/auth/AccountDeletionServiceTest.java
git add src/main/java/com/multind/bitpongo/auth/AccountDeletionService.java src/test/java/com/multind/bitpongo/auth/AccountDeletionServiceTest.java
git commit -m "fix: 修正注销密码错误状态码"
```

### Task 3: 最终范围与提交核对

**Files:**
- Verify only: `/Volumes/ExternalDrive/Code/github/bitpongo-front`
- Verify only: `/Volumes/ExternalDrive/Code/github/bitpongo-api`

**Interfaces:**
- Consumes: Task 1 与 Task 2 的两个独立提交。
- Produces: 两个仓库 clean、提交可追溯；不生成构建或发版产物。

- [ ] **Step 1: 核对前端提交和工作区**

```bash
git -C /Volumes/ExternalDrive/Code/github/bitpongo-front status --short
git -C /Volumes/ExternalDrive/Code/github/bitpongo-front show --stat --oneline --summary HEAD
```

- [ ] **Step 2: 核对后端提交和工作区**

```bash
git -C /Volumes/ExternalDrive/Code/github/bitpongo-api status --short
git -C /Volumes/ExternalDrive/Code/github/bitpongo-api show --stat --oneline --summary HEAD
```

- [ ] **Step 3: 交付时明确验证边界**

报告两个提交号、具体改动和工作区状态，并明确说明：按用户要求未运行自动化测试、未构建、未同步移动离线包、未发版。
