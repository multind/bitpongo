# 未登录“我的”页与全局字体实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将未登录“我的”页升级为暖橙品牌欢迎页，并让全站普通文字统一使用平台原生无衬线字体。

**Architecture:** 保留 `src/views/member/index.vue` 的已登录分支和现有语言弹层，在未登录分支内增加欢迎卡、双 CTA 与三项能力卡。字体由全局 CSS 变量统一管理；字体验证通过 Vitest 经 Vite 实际加载编译后的 SCSS，检查 DOM 的计算样式与继承链，并单独验证 iconfont 不受普通文字字体规则影响。

**Tech Stack:** Vue 3.5、TypeScript 5.9、Vue I18n 11、Pinia 4、NutUI 4、Vitest 4、SCSS。

## Global Constraints

- 只修改 `/Volumes/ExternalDrive/Code/github/bitpongo-front`。
- 不修改后端 API、登录注册数据流或任何 `zhitoubao` 目录。
- 视觉方向固定为暖橙亲和智能助手：暖白背景、暖橙渐变、深色正文、圆润卡片、轻量阴影。
- 未登录页必须包含欢迎卡、登录、注册、自动化策略、安全连接交易所、实时运行提醒和语言设置。
- 登录跳转 `/login`，注册跳转 `/register`，语言继续调用现有 `switchLang`。
- 已登录“我的”页的数据、导航和退出逻辑保持不变。
- 三种语言必须同时更新：`zh-cn`、`zh-tw`、`en-us`。
- 页面新增尺寸使用 `rem`，避免 750px 转换规则缩小文字。
- 全局字体使用平台原生无衬线栈；实施时移除普通业务页面中与该栈冲突的局部字体覆盖。
- `src/assets/font/iconfont.css` 必须保留 `font-family: iconfont`。
- 当前完整测试存在一个已提交的既有失败：`src/views/register/index.style.spec.ts` 期望的 `.register-field` 边框在提交 `519599e` 中被删除；未经用户明确授权不得顺带修改注册页。
- 采用测试先行，先观察新测试因缺少页面结构或字体规则而失败，再写生产代码。

---

## 文件结构

- `src/views/member/index.vue`：渲染已登录与未登录两种“我的”页，并处理登录、注册、语言和已登录导航。
- `src/views/member/index.spec.ts`：验证未登录欢迎内容和三个入口的行为。
- `src/i18n/lang/lang-base.ts`：声明新增未登录页文案类型。
- `src/i18n/lang/zh-cn.ts`、`zh-tw.ts`、`en-us.ts`：提供三种语言文案。
- `src/styles/index.scss`：定义全局字体变量、基础继承和表单控件字体。
- `src/App.vue`：移除重复的 Avenir 字体和全局 `500` 字重，只保留应用颜色及字体平滑。
- `src/styles/font-family.spec.ts`：经 Vite/Vitest 加载编译后的全局 SCSS，验证普通文本、嵌套元素和表单控件的计算字体/继承，并验证 iconfont 独立行为。
- 现有业务页面中存在冲突局部字体覆盖的文件：删除这些覆盖，其余样式和行为不变。

### Task 1: 未登录“我的”页内容与导航

**Files:**

- Create: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/member/index.spec.ts`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/member/index.vue:1-160`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/i18n/lang/lang-base.ts:129-143`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/i18n/lang/zh-cn.ts:132-146`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/i18n/lang/zh-tw.ts:133-147`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/i18n/lang/en-us.ts:134-148`

**Interfaces:**

- Consumes: `useUserStore().getUserInfo`、`useRouter().push`、`switchLang(LocaleKey)` 和现有语言弹层。
- Produces: `goRegister(): void`；`member.guestTitle`、`guestDescription`、`goRegister` 及三组能力标题和说明。

- [ ] **Step 1: 写未登录页面失败测试**

创建组件测试，使用真实 Pinia 与 I18n，并只替换外部路由和 NutUI 展示组件：

```ts
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MemberView from './index.vue';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual as object), useRouter: () => ({ push: mocks.push }) };
});

vi.mock('@nutui/nutui', () => ({ showDialog: vi.fn() }));

const ButtonStub = defineComponent({
  inheritAttrs: false,
  emits: ['click'],
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
});

function mountGuestView() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(MemberView, {
    global: {
      plugins: [pinia, i18n],
      stubs: {
        'nut-button': ButtonStub,
        'nut-popup': { template: '<div><slot /></div>' },
        'nut-row': { template: '<div><slot /></div>' },
        'nut-col': { template: '<div><slot /></div>' },
        'nut-cell-group': { template: '<div><slot /></div>' },
        'nut-cell': { template: '<button><slot name="icon" /><slot />{{ title }}</button>', props: ['title'] },
        Setting: true,
        Link: true,
        Notice: true,
        Message: true,
      },
    },
  });
}

describe('guest member view', () => {
  beforeEach(() => mocks.push.mockReset());

  it('renders the welcome card and three core capabilities', () => {
    const wrapper = mountGuestView();

    expect(wrapper.get('[data-test="guest-welcome"]').text()).toContain('让自动化交易更简单');
    expect(wrapper.findAll('[data-test="guest-feature"]')).toHaveLength(3);
    expect(wrapper.text()).toContain('自动化策略');
    expect(wrapper.text()).toContain('安全连接交易所');
    expect(wrapper.text()).toContain('实时运行提醒');
  });

  it('opens login and registration from distinct actions', async () => {
    const wrapper = mountGuestView();

    await wrapper.get('[data-test="guest-login"]').trigger('click');
    await wrapper.get('[data-test="guest-register"]').trigger('click');

    expect(mocks.push).toHaveBeenNthCalledWith(1, '/login');
    expect(mocks.push).toHaveBeenNthCalledWith(2, '/register');
  });

  it('keeps a visible language action', async () => {
    const wrapper = mountGuestView();
    expect(wrapper.get('[data-test="guest-language"]').text()).toContain('语言');
  });
});
```

- [ ] **Step 2: 运行测试确认当前页面缺少新结构**

Run: `npm test -- src/views/member/index.spec.ts`

Expected: FAIL，`guest-welcome`、`guest-feature` 或 `guest-register` 不存在。

- [ ] **Step 3: 扩展三种语言类型与文案**

在 `member` 类型及三个语言对象中增加相同键：

```ts
guestTitle: string;
guestDescription: string;
goRegister: string;
guestStrategyTitle: string;
guestStrategyDescription: string;
guestExchangeTitle: string;
guestExchangeDescription: string;
guestNoticeTitle: string;
guestNoticeDescription: string;
```

使用以下精确文案：

```ts
// zh-cn
guestTitle: '让自动化交易更简单',
guestDescription: '登录 Bitpongo，集中管理策略、交易所连接和运行提醒。',
goRegister: '创建账号',
guestStrategyTitle: '自动化策略',
guestStrategyDescription: '按计划执行，减少重复操作。',
guestExchangeTitle: '安全连接交易所',
guestExchangeDescription: '统一管理 API 连接与账户配置。',
guestNoticeTitle: '实时运行提醒',
guestNoticeDescription: '及时掌握策略状态和关键变化。',

// zh-tw
guestTitle: '讓自動化交易更簡單',
guestDescription: '登入 Bitpongo，集中管理策略、交易所連線和執行提醒。',
goRegister: '建立帳號',
guestStrategyTitle: '自動化策略',
guestStrategyDescription: '依照計畫執行，減少重複操作。',
guestExchangeTitle: '安全連接交易所',
guestExchangeDescription: '統一管理 API 連線與帳戶設定。',
guestNoticeTitle: '即時執行提醒',
guestNoticeDescription: '即時掌握策略狀態和關鍵變化。',

// en-us
guestTitle: 'Make automated trading simpler',
guestDescription: 'Sign in to manage strategies, exchange connections, and runtime alerts in one place.',
goRegister: 'Create account',
guestStrategyTitle: 'Automated strategies',
guestStrategyDescription: 'Run your plan with fewer repetitive steps.',
guestExchangeTitle: 'Secure exchange connections',
guestExchangeDescription: 'Manage API connections and account settings together.',
guestNoticeTitle: 'Real-time runtime alerts',
guestNoticeDescription: 'Stay informed about strategy status and important changes.',
```

- [ ] **Step 4: 实现未登录欢迎页**

将当前 `v-else` 分支替换为以下语义结构；图标使用项目中已存在的 `Setting`、`Link`、`Notice` 和 `Message`：

```vue
<main v-else class="guest-member">
  <section class="guest-hero" data-test="guest-welcome">
    <div class="guest-mark" aria-hidden="true"><span>B</span><i>✦</i></div>
    <h1>{{ t('member.guestTitle') }}</h1>
    <p>{{ t('member.guestDescription') }}</p>
    <div class="guest-actions">
      <nut-button block class="guest-login" data-test="guest-login" @click="goLogin">
        {{ t('member.goLogin') }}
      </nut-button>
      <nut-button block class="guest-register" data-test="guest-register" @click="goRegister">
        {{ t('member.goRegister') }}
      </nut-button>
    </div>
  </section>

  <section class="guest-features" aria-label="Bitpongo capabilities">
    <article v-for="feature in guestFeatures" :key="feature.title" class="guest-feature" data-test="guest-feature">
      <component :is="feature.icon" aria-hidden="true" />
      <div><h2>{{ feature.title }}</h2><p>{{ feature.description }}</p></div>
    </article>
  </section>

  <button class="guest-language" data-test="guest-language" type="button" @click="languagePopup = true">
    <Message aria-hidden="true" />
    <span>{{ t('language.label') }}</span><span aria-hidden="true">›</span>
  </button>
</main>
```

在脚本中显式导入 `computed`，新增注册导航和能力数据：

```ts
import { computed, ref } from 'vue';

const guestFeatures = computed(() => [
  { icon: Setting, title: t('member.guestStrategyTitle'), description: t('member.guestStrategyDescription') },
  { icon: Link, title: t('member.guestExchangeTitle'), description: t('member.guestExchangeDescription') },
  { icon: Notice, title: t('member.guestNoticeTitle'), description: t('member.guestNoticeDescription') },
]);

const goRegister = () => router.push('/register');
```

使用 scoped 样式实现暖白背景、暖橙欢迎卡、圆润 `B` 星光标识、至少 `2.875rem` 高的 CTA、三张能力卡和完整语言列表项。所有新增字号、间距、圆角和边框使用 `rem`。删除 `.not-login-center` 依赖和 `not_login.png` 引用；本任务不删除图片文件，避免影响历史引用检查。

- [ ] **Step 5: 运行页面与类型验证**

Run: `npm test -- src/views/member/index.spec.ts`

Expected: PASS，3 个测试全部通过。

Run: `npm run typecheck`

Expected: 退出码 0，三种语言对象满足 `LangSchema`。

- [ ] **Step 6: 提交未登录页面**

```bash
git add src/views/member/index.vue src/views/member/index.spec.ts src/i18n/lang/lang-base.ts src/i18n/lang/zh-cn.ts src/i18n/lang/zh-tw.ts src/i18n/lang/en-us.ts
git commit -m "feat: 优化未登录我的页面"
```

### Task 2: 全局字体变量与局部覆盖清理

**Files:**

- Create: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/styles/font-family.spec.ts`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/styles/index.scss`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/App.vue:6-20`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/home/index.vue`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/list/index.vue`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/list/components/CoinPicker.vue`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/list/components/ExchangeSelection.vue`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/login/index.vue`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/member/index.vue`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/member/exchange/index.vue`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/views/member/notice/index.vue`

**Interfaces:**

- Consumes: 浏览器和操作系统内置字体，不新增字体文件或网络请求。
- Produces: CSS 变量 `--app-font-family`，所有普通文本和表单控件继承该变量。

- [ ] **Step 1: 写编译后 SCSS 的运行时失败测试**

创建一个 DOM 测试；测试模块必须直接导入 `./index.scss`，让 Vitest 经 Vite 编译并加载实际 SCSS，而不是读取源码或配置文本。测试夹具包含普通文本、嵌套文本、表单控件和 iconfont 元素：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import './index.scss';
import '@/assets/font/iconfont.css';

function mountFontFixture() {
  const fixture = document.createElement('div');
  fixture.innerHTML = `
    <main data-test="font-root">
      <p data-test="plain"><span data-test="nested">Normal text</span></p>
      <input data-test="input" value="Input text" />
      <button data-test="button">Button text</button>
      <i class="iconfont" data-test="icon">&#xe600;</i>
    </main>`;
  document.body.append(fixture);
  return fixture;
}

afterEach(() => document.body.replaceChildren());

describe('global application font', () => {
  it('loads compiled SCSS and inherits the native sans-serif stack into normal text and controls', () => {
    const fixture = mountFontFixture();
    const root = fixture.querySelector('[data-test=font-root]')!;
    const plain = fixture.querySelector('[data-test=plain]')!;
    const nested = fixture.querySelector('[data-test=nested]')!;
    const input = fixture.querySelector('[data-test=input]')!;
    const button = fixture.querySelector('[data-test=button]')!;

    const rootFont = getComputedStyle(root).fontFamily;
    expect(rootFont).toContain('-apple-system');
    expect(getComputedStyle(plain).fontFamily).toBe(rootFont);
    expect(getComputedStyle(nested).fontFamily).toBe(rootFont);
    expect(getComputedStyle(input).fontFamily).toBe(rootFont);
    expect(getComputedStyle(button).fontFamily).toBe(rootFont);
  });

  it('keeps iconfont independent from the normal text inheritance chain', () => {
    const fixture = mountFontFixture();
    const root = fixture.querySelector('[data-test=font-root]')!;
    const icon = fixture.querySelector('[data-test=icon]')!;

    expect(getComputedStyle(icon).fontFamily).toContain('iconfont');
    expect(getComputedStyle(icon).fontFamily).not.toBe(getComputedStyle(root).fontFamily);
  });
});
```

- [ ] **Step 2: 运行测试确认当前运行时字体契约尚未成立**

Run: `npm test -- src/styles/font-family.spec.ts`

Expected: FAIL，Vite 加载当前 SCSS 后，普通文本/控件不会全部继承新的平台字体栈，或 iconfont 独立断言尚未成立；不以源码或配置字符串匹配作为通过条件。

- [ ] **Step 3: 实现全局字体基础规则**

在 `src/styles/index.scss` 顶部加入：

```scss
:root {
  --app-font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'PingFang TC', Roboto, 'Noto Sans CJK SC', 'Helvetica Neue', Arial,
    sans-serif;
}

html,
body,
#app {
  font-family: var(--app-font-family);
  font-weight: 400;
  color: #101010;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

保留现有 reset 规则。将 `App.vue` 中 `#app` 的 `font-family` 和 `font-weight: 500` 删除，将 `body` 的 `font-weight` 删除；保留颜色和字体平滑规则。

- [ ] **Step 4: 删除业务页面局部字体覆盖**

只删除上述 8 个业务文件中声明 `font-family` 的内联样式或 SCSS 属性，保留同一声明中的字号、字重、颜色和对齐。例如：

```vue
<!-- before -->
<text style="font-family: Verdana, serif; font-size: 16px; font-weight: bold">...</text>
<!-- after -->
<text style="font-size: 16px; font-weight: bold">...</text>
```

不要修改 `src/assets/font/iconfont.css`，也不要用全局 `!important` 覆盖图标字体。

- [ ] **Step 5: 运行字体测试和受影响页面测试**

Run: `npm test -- src/styles/font-family.spec.ts src/views/member/index.spec.ts src/views/register/index.spec.ts`

Expected: 字体契约、未登录页和注册行为测试通过。

Run: `npm run typecheck`

Expected: 退出码 0。

- [ ] **Step 6: 提交全局字体统一**

```bash
git add src/styles/index.scss src/styles/font-family.spec.ts src/App.vue src/views/home/index.vue src/views/list/index.vue src/views/list/components/CoinPicker.vue src/views/list/components/ExchangeSelection.vue src/views/login/index.vue src/views/member/index.vue src/views/member/exchange/index.vue src/views/member/notice/index.vue
git commit -m "style: 统一全局应用字体"
```

### Task 3: 前端构建与已知基线核对

**Files:**

- Verify only: `/Volumes/ExternalDrive/Code/github/bitpongo-front`

**Interfaces:**

- Consumes: Task 1 和 Task 2 的页面、文案与字体规则。
- Produces: 可由移动端计划同步的 `dist`，以及目标功能没有新增测试回归的证据。

- [ ] **Step 1: 运行目标功能测试**

Run: `npm test -- src/views/member/index.spec.ts src/styles/font-family.spec.ts src/i18n/index.spec.ts`

Expected: 全部通过。

- [ ] **Step 2: 运行完整测试并区分既有失败**

Run: `npm test`

Expected: 除 `src/views/register/index.style.spec.ts` 的既有 `.register-field` 边框断言外，没有新增失败。若出现其他失败，停止并修复；不要将完整测试报告为绿色。

- [ ] **Step 3: 运行类型检查与生产构建**

Run: `npm run typecheck`

Expected: 退出码 0。

Run: `npm run build`

Expected: 生产构建成功并更新 `dist`；`dist` 不提交到前端仓库。

- [ ] **Step 4: 核对工作区与提交边界**

Run: `git status --short`

Expected: 工作区干净。记录前端 HEAD，供移动端离线 Web Bundle 清单使用。本任务不新增提交。
