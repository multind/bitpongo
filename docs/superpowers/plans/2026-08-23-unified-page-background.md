# Bitpongo Unified Page Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Bitpongo 前端所有页面画布和固定导航区域统一为品牌暖白 `#FFFAF5`，同时保留卡片、表单、提示和状态区域的功能性背景。

**Architecture:** 在全局 SCSS 中建立唯一语义变量 `--app-page-background`，由页面根节点和页面级 NutUI 容器消费。使用现有真实 Vite + Chrome 样式测试验证编译后的计算样式，并通过静态约束移除未登录“我的”页的重复颜色来源。

**Tech Stack:** Vue 3、TypeScript、SCSS、Vite 8、Vitest 4、真实 Chrome/Chromium、NutUI 4。

## Global Constraints

- 仅修改 `/Volumes/ExternalDrive/Code/github/bitpongo-front`，不得修改 `zhitoubao` 或移动端仓库。
- 页面背景唯一颜色为 `#FFFAF5`，SCSS 中规范化写作 `#fffaf5`。
- 页面级承载层包括 `html`、`body`、`#app`、`.main-page`、`.nut-navbar` 和 `.nut-tabbar`。
- 白色卡片、输入框、弹窗、错误/警告提示、图表、按钮和品牌橙色英雄区保留自身背景。
- 不使用 `*`、所有 `div` 或所有组件类的强制背景覆盖。
- 不调整布局、间距、字体、路由、业务逻辑、依赖版本或移动端离线包。
- 当前已知完整前端测试基线仅有 `src/views/register/index.style.spec.ts` 的 `.register-field` 边框断言失败；不得把新增失败归为基线。

---

### Task 1: 建立并实现全局页面背景契约

**Files:**

- Modify: `src/styles/index.scss`
- Modify: `src/styles/font-family.spec.ts`
- Modify: `src/views/member/index.vue`

**Interfaces:**

- Consumes: `src/main.ts` 已有的 `import './styles/index.scss'` 生产入口。
- Produces: CSS 自定义属性 `--app-page-background: #fffaf5`，供所有页面级承载层使用。
- Produces: 真实浏览器运行时样式结果 `RuntimeStyles`，同时覆盖字体和页面背景契约。

- [ ] **Step 1: 扩展真实浏览器样式夹具，写出失败测试**

在 `src/styles/font-family.spec.ts` 中把 `FontStyles` 扩展为：

```ts
type RuntimeStyles = FontStyles & {
  pageBackgroundVariable: string;
  htmlBackground: string;
  bodyBackground: string;
  appBackground: string;
  pageBackground: string;
  navbarBackground: string;
  tabbarBackground: string;
  cardBackground: string;
  errorBackground: string;
};

let runtimeFontStyles: RuntimeStyles;
// 将浏览器夹具的 JSON.parse 类型断言同步改为 RuntimeStyles。
```

将浏览器夹具补充为页面级和功能性背景元素：

```ts
fixture.innerHTML = `
  <style>
    .background-contract-card { background: #fff; }
    .background-contract-error { background: #fde3e3; }
  </style>
  <main data-test="font-root">
    <p data-test="plain"><span data-test="nested">Normal text</span></p>
    <input data-test="input" value="Input text" />
    <button data-test="button">Button text</button>
    <textarea data-test="textarea">Textarea text</textarea>
    <select data-test="select"><option>Select text</option></select>
    <i class="iconfont" data-test="icon">&#xe600;</i>
    <div class="nut-toast" data-test="toast">Toast text</div>
    <section class="main-page" data-test="page"></section>
    <header class="nut-navbar" data-test="navbar"></header>
    <footer class="nut-tabbar" data-test="tabbar"></footer>
    <article class="background-contract-card" data-test="card"></article>
    <aside class="background-contract-error" data-test="error"></aside>
  </main>`;
```

在夹具结果中读取自定义属性和计算背景：

```ts
const backgroundColor = (selector: string) => getComputedStyle(document.querySelector(selector)!).backgroundColor;

pageBackgroundVariable: getComputedStyle(document.documentElement)
  .getPropertyValue('--app-page-background')
  .trim(),
htmlBackground: backgroundColor('html'),
bodyBackground: backgroundColor('body'),
appBackground: backgroundColor('#app'),
pageBackground: backgroundColor('[data-test=page]'),
navbarBackground: backgroundColor('[data-test=navbar]'),
tabbarBackground: backgroundColor('[data-test=tabbar]'),
cardBackground: backgroundColor('[data-test=card]'),
errorBackground: backgroundColor('[data-test=error]'),
```

新增测试：

```ts
describe('global page background', () => {
  it('uses the brand warm-white canvas across app and navigation surfaces', () => {
    expect(runtimeFontStyles.pageBackgroundVariable).toBe('#fffaf5');
    const pageBackground = 'rgb(255, 250, 245)';
    expect(runtimeFontStyles.htmlBackground).toBe(pageBackground);
    expect(runtimeFontStyles.bodyBackground).toBe(pageBackground);
    expect(runtimeFontStyles.appBackground).toBe(pageBackground);
    expect(runtimeFontStyles.pageBackground).toBe(pageBackground);
    expect(runtimeFontStyles.navbarBackground).toBe(pageBackground);
    expect(runtimeFontStyles.tabbarBackground).toBe(pageBackground);
  });

  it('does not override functional card and error backgrounds', () => {
    expect(runtimeFontStyles.cardBackground).toBe('rgb(255, 255, 255)');
    expect(runtimeFontStyles.errorBackground).toBe('rgb(253, 227, 227)');
  });
});
```

未登录“我的”页使用 Vue scoped 样式，合成元素无法代表其真实作用域；通过组件测试验证页面渲染，并在实现 diff 中核对 `.guest-member` 使用 `var(--app-page-background)`，不添加源码字符串匹配测试。

- [ ] **Step 2: 运行定向测试，确认新背景契约失败**

Run: `npm test -- src/styles/font-family.spec.ts --reporter=verbose`

Expected: FAIL；`pageBackgroundVariable` 为空，且页面级计算背景不是 `rgb(255, 250, 245)`。

- [ ] **Step 3: 添加最小全局背景实现**

在 `src/styles/index.scss` 的 `:root` 中增加：

```scss
--app-page-background: #fffaf5;
--nut-navbar-background: var(--app-page-background);
```

将页面根节点规则改为：

```scss
html,
body,
#app {
  min-height: 100%;
  font-family: var(--app-font-family);
  font-weight: 400;
  color: #101010;
  background: var(--app-page-background);
}

.main-page,
:root .nut-navbar,
:root .nut-tabbar {
  background: var(--app-page-background);
}
```

`:root` 前缀为 NutUI 容器提供高于组件库默认 `.nut-tabbar` 的选择器优先级；不得覆盖 `--nut-white`，避免改变所有 NutUI 白色组件。

在 `src/views/member/index.vue` 中将：

```scss
background: #fffaf5;
```

替换为：

```scss
background: var(--app-page-background);
```

- [ ] **Step 4: 运行定向测试，确认背景和字体契约同时通过**

Run: `npm test -- src/styles/font-family.spec.ts --reporter=verbose`

Expected: PASS；原字体、iconfont、NutUI toast 和 Chrome 路径测试保持通过，新增背景测试通过。

- [ ] **Step 5: 运行受影响页面测试和静态检查**

Run: `npm test -- src/views/member/index.spec.ts src/styles/font-family.spec.ts --reporter=verbose`

Expected: PASS，未登录/已登录个人中心行为和全局运行时样式均无回归。

Run: `npm run typecheck`

Expected: PASS。

Run: `npm run lint:eslint -- --no-fix`

Expected: PASS；若脚本固定包含 `--fix`，则先确认 `git diff` 只包含本任务文件。

Run: `npm run lint:stylelint -- --no-fix`

Expected: PASS；若脚本固定包含 `--fix`，则先确认 `git diff` 只包含本任务文件。

- [ ] **Step 6: 提交全局背景实现**

```bash
git add src/styles/index.scss src/styles/font-family.spec.ts src/views/member/index.vue
git commit -m "style: 统一全局页面背景"
```

### Task 2: 完整验证与交付核对

**Files:**

- Verify only: `src/**`
- Verify only: `dist/**`（被忽略，不提交）

**Interfaces:**

- Consumes: Task 1 的 `--app-page-background` 和运行时测试。
- Produces: 完整测试、生产构建、构建产物标识和干净 `main` 工作区证据。

- [ ] **Step 1: 运行完整前端测试**

Run: `npm test -- --reporter=verbose`

Expected: 除已知 `src/views/register/index.style.spec.ts` 的 `.register-field` 边框基线外无其他失败；如果出现任何其他失败，停止并修复。

- [ ] **Step 2: 运行生产构建**

Run: `npm run build`

Expected: 退出码 0，输出 `Build successful. Please see dist directory`。

- [ ] **Step 3: 核对生产 CSS 包含统一背景契约**

Run: `rg -n -- '--app-page-background|#fffaf5' dist/assets --glob '*.css'`

Expected: 至少一个生产 CSS 文件包含 `--app-page-background:#fffaf5`，并包含 `.main-page`、`.nut-navbar` 和 `.nut-tabbar` 的变量引用。

- [ ] **Step 4: 核对提交和工作区**

Run: `git status --short`

Expected: 无输出。

Run: `git show --stat --oneline HEAD`

Expected: 最新提交为 `style: 统一全局页面背景`，仅包含 Task 1 的三个文件。
