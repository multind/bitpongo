# Registration Form Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Bitpongo 注册页在移动端以正常字号显示四个带标签、边框和聚焦状态的输入字段。

**Architecture:** 保留现有注册状态、校验和 API 数据流，只调整注册视图的 NutUI 表单结构、国际化字段标签和局部样式。注册页参考登录页的标题、表单间距、圆角白色卡片和黑色大按钮，并使用 `rem` 尺寸避开业务源码的 750px-to-vw 转换；不修改全局 PostCSS 或其他页面。

**Tech Stack:** Vue 3、TypeScript、NutUI 4、Vue I18n、SCSS、Vitest、Vite

## Global Constraints

- 只修改 `/Volumes/ExternalDrive/Code/github/bitpongo-front`。
- 保留 `.eslintrc-auto-import.json` 的现有用户修改，不覆盖、不暂存。
- 不修改任何 `zhitoubao` 目录。
- 不修改 API、路由、Pinia 状态、注册校验规则或后端。
- 不修改全局 PostCSS；注册页关键尺寸使用 `rem`。
- 字段顺序固定为昵称、邮箱、密码、确认密码。
- 保留字段标签，不增加登录页的左侧图标。

---

### Task 1: Add visible localized field labels

**Files:**

- Modify: `src/views/register/index.spec.ts`
- Modify: `src/views/register/index.vue`
- Modify: `src/i18n/lang/lang-base.ts`
- Modify: `src/i18n/lang/zh-cn.ts`
- Modify: `src/i18n/lang/zh-tw.ts`
- Modify: `src/i18n/lang/en-us.ts`

**Interfaces:**

- Consumes: existing `form` reactive object and `register.*Placeholder` translations.
- Produces: `register.nameLabel`, `register.emailLabel`, `register.passwordLabel`, and `register.confirmPasswordLabel`; four `.register-field` form items.

- [ ] **Step 1: Extend the NutUI stubs and write the failing label test**

Replace the inline `nut-form-item` stub in `mountView()` and add a `nut-form` stub:

```ts
const NutFormItemStub = defineComponent({
  inheritAttrs: false,
  props: { label: { type: String, default: '' } },
  template: '<div v-bind="$attrs"><span v-if="label" class="stub-label">{{ label }}</span><slot /></div>',
});
```

```ts
stubs: {
  'nut-form': { template: '<form><slot /></form>' },
  'nut-form-item': NutFormItemStub,
  'nut-input': NutInputStub,
  'nut-checkbox': NutCheckboxStub,
  'nut-button': NutButtonStub,
},
```

Add this test before the existing validation test:

```ts
it('renders four visible localized field labels', () => {
  const { wrapper } = mountView();
  const fields = wrapper.findAll('.register-field');

  expect(fields).toHaveLength(4);
  expect(fields.map((field) => field.find('.stub-label').text())).toEqual(['昵称', '邮箱', '密码', '确认密码']);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test -- src/views/register/index.spec.ts`

Expected: FAIL because the current view has no `.register-field` items and no localized labels.

- [ ] **Step 3: Add the four translation keys**

Add these properties to `register` in `src/i18n/lang/lang-base.ts`:

```ts
nameLabel: string;
emailLabel: string;
passwordLabel: string;
confirmPasswordLabel: string;
```

Add these values to `src/i18n/lang/zh-cn.ts`:

```ts
nameLabel: '昵称',
emailLabel: '邮箱',
passwordLabel: '密码',
confirmPasswordLabel: '确认密码',
```

Add these values to `src/i18n/lang/zh-tw.ts`:

```ts
nameLabel: '暱稱',
emailLabel: '電子郵件',
passwordLabel: '密碼',
confirmPasswordLabel: '確認密碼',
```

Add these values to `src/i18n/lang/en-us.ts`:

```ts
nameLabel: 'Display name',
emailLabel: 'Email',
passwordLabel: 'Password',
confirmPasswordLabel: 'Confirm password',
```

- [ ] **Step 4: Wrap the fields in a top-label NutUI form**

Replace `<div class="form">` with:

```vue
<nut-form class="form" :model-value="form" label-position="top">
```

Give the four form items their labels and stable class, preserving their current inputs and order:

```vue
<nut-form-item class="register-field" :label="t('register.nameLabel')">
<nut-form-item class="register-field" :label="t('register.emailLabel')">
<nut-form-item class="register-field" :label="t('register.passwordLabel')">
<nut-form-item class="register-field" :label="t('register.confirmPasswordLabel')">
```

Replace the matching closing `</div>` after the submit button with `</nut-form>`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `pnpm test -- src/views/register/index.spec.ts`

Expected: all registration view tests PASS.

- [ ] **Step 6: Commit the labeled form**

```bash
git add src/views/register/index.spec.ts src/views/register/index.vue src/i18n/lang/lang-base.ts src/i18n/lang/zh-cn.ts src/i18n/lang/zh-tw.ts src/i18n/lang/en-us.ts
git commit -m "fix: add visible registration field labels"
```

### Task 2: Restore readable typography and visible field boundaries

**Files:**

- Create: `src/views/register/index.style.spec.ts`
- Modify: `src/views/register/index.vue`

**Interfaces:**

- Consumes: the four `.register-field` elements produced by Task 1.
- Produces: scoped `rem` typography, visible field borders, and a `:focus-within` state.

- [ ] **Step 1: Write the failing style contract test**

Create `src/views/register/index.style.spec.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./index.vue', import.meta.url), 'utf8');

describe('registration view styles', () => {
  it('keeps readable rem typography and visible field boundaries', () => {
    expect(source).toMatch(/h1\s*\{[^}]*font-size:\s*1\.625rem/s);
    expect(source).toMatch(/\.subtitle[^}]*font-size:\s*1rem/s);
    expect(source).toMatch(/\.register-field\s*\{[^}]*border:\s*0\.0625rem solid #d8d8d8/s);
    expect(source).toMatch(/&:focus-within\s*\{/);
    expect(source).toMatch(/\.agreement-row\s*\{[^}]*font-size:\s*0\.875rem/s);
  });
});
```

- [ ] **Step 2: Run the style test and verify RED**

Run: `pnpm test -- src/views/register/index.style.spec.ts`

Expected: FAIL because the current registration styles use converted `px` values and contain no field border or focus state.

- [ ] **Step 3: Replace the registration page style block**

Use this scoped style implementation in `src/views/register/index.vue`:

```scss
.register {
  padding: 1.25rem;
}

h1 {
  margin: 0;
  color: #101010;
  font-size: 1.625rem;
  line-height: 1.25;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 1rem;
  line-height: 1.5;
}

.form {
  margin: 2.5rem 0;
}

.register-field {
  --nut-cell-padding: 0.875rem 1rem;
  --nut-cell-border-radius: 1.25rem;
  --nut-cell-box-shadow: 0 0.0625rem 0.4375rem rgb(237 238 241);
  --nut-form-item-label-font-size: 0.9375rem;
  --nut-form-item-body-font-size: 1rem;

  margin-top: 1.25rem;
  overflow: hidden;
  background: #fff;
  border: 0.0625rem solid #d8d8d8;
  border-radius: 1.25rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: #101010;
    box-shadow: 0 0 0 0.125rem rgb(16 16 16 / 12%);
  }
}

:deep(.register-field .nut-form-item__label) {
  color: #333;
  font-weight: 600;
  line-height: 1.4;
}

:deep(.register-field .nut-input),
:deep(.register-field .input-text) {
  --nut-input-font-size: 1rem;

  min-height: 1.5rem;
  font-size: 1rem;
}

.hint,
.error {
  margin: 0.5rem 0.875rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.hint,
.login-link {
  color: #666;
}

.error {
  color: #e34b4b;
}

.agreement-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.375rem 0.625rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.link {
  padding: 0;
  color: #101010;
  cursor: pointer;
  background: transparent;
  border: 0;
  text-decoration: underline;
}

.login-link {
  margin-top: 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  text-align: center;
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `pnpm test -- src/views/register/index.style.spec.ts src/views/register/index.spec.ts`

Expected: both registration test files PASS.

- [ ] **Step 5: Run full frontend verification**

Run: `pnpm test`

Expected: all Vitest tests PASS.

Run: `pnpm typecheck`

Expected: exit code 0.

Run: `pnpm build`

Expected: production build succeeds.

Run: `rg -n "font-size:1\.625rem|border:\.0625rem solid #d8d8d8|focus-within" dist/assets/register-*.css`

Expected: built registration CSS contains the readable heading size, visible border, and focus state; it does not convert these `rem` values to half-size `vw` values.

- [ ] **Step 6: Commit the visual fix without staging the user file**

```bash
git add src/views/register/index.style.spec.ts src/views/register/index.vue
git commit -m "fix: improve registration form visibility"
```

- [ ] **Step 7: Verify repository scope and push main**

Run: `git status --short --branch`

Expected: only the pre-existing `.eslintrc-auto-import.json` user modification remains; implementation files are committed.

Run: `git push origin main`

Run: `git ls-remote origin refs/heads/main`

Expected: remote `main` matches local `HEAD`.

## Self-review

- [ ] Every design requirement is covered by Task 1 or Task 2.
- [ ] All translation keys match `register.*` usage in the component.
- [ ] Test steps verify RED before production changes and GREEN afterward.
- [ ] Registration behavior and validation remain unchanged.
- [ ] `.eslintrc-auto-import.json` is never staged.
- [ ] No global PostCSS or non-Bitpongo repository is modified.
