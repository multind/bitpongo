# App 语言与时区上下文前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 BitPongo 前端在挂载前读取 App 上下文，将 App 语言作为默认值，并保存可供前端读取的当前时区。

**Architecture:** 扩展现有桥接上下文类型，并新增独立的应用上下文初始化模块负责字段校验、浏览器降级和时区存储。国际化模块明确区分“持久化的用户选择”和“不持久化的 App 默认值”，入口在 Vue 首屏挂载前完成异步初始化。

**Tech Stack:** Vue 3.5、TypeScript 5.9、Vue I18n 11、Vitest 4、Vite 8、现有原生桥接。

## Global Constraints

- 只修改 `/Volumes/ExternalDrive/Code/github/bitpongo-front`。
- 不修改任何 `zhitoubao` 目录或后端 API。
- 保持桥接 `version: 1`、`getContext` 命令、`ZhitoubaoBridge` 处理器和 `__ZHITOUBAO_NATIVE_RESOLVE__` 回调名称不变。
- App 的 `locale` 只作为当前启动的默认值，不写入用户语言存储；用户手动选择并持久化的有效 `lang` 始终优先。
- 支持语言仅为 `zh-cn`、`zh-tw`、`en-us`，无效值不得写入或应用。
- App 时区每次启动刷新；桥接缺失、失败或字段无效时使用浏览器时区与当前 UTC 偏移。
- 当前范围不新增 API 请求头、不修改用户资料、不新增后端字段。
- 保留用户已有的 `.eslintrc-auto-import.json`、`src/views/login/index.vue` 和 `src/views/register/index.vue` 未提交修改；只暂存本计划明确列出的文件。
- 采用测试先行，每项行为先观察失败，再实现最小代码使其通过。

---

## 文件结构

- `src/mobile/bridge.ts`：声明兼容旧 App 的可选上下文字段，继续负责桥接传输。
- `src/mobile/app-context.ts`：校验 App 字段、执行浏览器降级、刷新时区存储并暴露当前上下文。
- `src/mobile/app-context.spec.ts`：验证 App 值、无效值、失败和浏览器降级。
- `src/i18n/index.ts`：区分持久化用户语言与不持久化默认语言。
- `src/i18n/index.spec.ts`：验证语言优先级和存储行为。
- `src/main.ts`：在 Vue 应用挂载前初始化上下文并应用语言。

### Task 1: 语言默认值与用户选择优先级

**Files:**

- Create: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/i18n/index.spec.ts`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/i18n/index.ts:7-68`

**Interfaces:**

- Consumes: 现有 `localStorage` 键 `lang` 和三种 `LocaleKey`。
- Produces: `isSupportedLocale(value: unknown): value is LocaleKey`；`savedLocale(): LocaleKey | null`；`currentLocale(defaultLocale?: unknown): LocaleKey`；`setLang(locale?: unknown, persist?: boolean): void`。

- [ ] **Step 1: 写语言优先级失败测试**

创建以下测试，直接验证 App 默认值不持久化、用户选择优先和无效值降级：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { currentLocale, i18n, isSupportedLocale, savedLocale, setLang } from './index';

afterEach(() => {
  localStorage.clear();
  setLang();
});

describe('i18n locale priority', () => {
  it('uses an App locale as a non-persistent default', () => {
    setLang('en-us', false);

    expect(i18n.global.locale.value).toBe('en-us');
    expect(localStorage.getItem('lang')).toBeNull();
  });

  it('keeps a valid manually saved locale ahead of the App default', () => {
    localStorage.setItem('lang', 'zh-tw');

    expect(savedLocale()).toBe('zh-tw');
    expect(currentLocale('en-us')).toBe('zh-tw');
    setLang('en-us', false);
    expect(i18n.global.locale.value).toBe('zh-tw');
  });

  it('ignores invalid saved and App locale values', () => {
    localStorage.setItem('lang', 'fr-fr');

    expect(savedLocale()).toBeNull();
    expect(currentLocale('fr-fr')).toBe('zh-cn');
    expect(isSupportedLocale('fr-fr')).toBe(false);
  });

  it('persists only a supported manual selection', () => {
    setLang('en-us', true);
    expect(localStorage.getItem('lang')).toBe('en-us');

    setLang('fr-fr', true);
    expect(localStorage.getItem('lang')).toBe('en-us');
  });
});
```

- [ ] **Step 2: 运行目标测试确认新接口不存在**

Run: `npm test -- src/i18n/index.spec.ts`

Expected: FAIL，错误指出 `savedLocale` 或 `isSupportedLocale` 未导出，且 `setLang` 尚不支持不持久化默认值。

- [ ] **Step 3: 实现语言校验和优先级**

将现有语言存储逻辑调整为以下精确语义：

```ts
export function isSupportedLocale(value: unknown): value is LocaleKey {
  return typeof value === 'string' && SUPPORTED.includes(value as LocaleKey);
}

function normalizeLocale(locale?: unknown): LocaleKey {
  return isSupportedLocale(locale) ? locale : 'zh-cn';
}

export function savedLocale(): LocaleKey | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isSupportedLocale(stored) ? stored : null;
}

export function currentLocale(defaultLocale?: unknown): LocaleKey {
  return savedLocale() ?? normalizeLocale(defaultLocale);
}

export function setLang(locale?: unknown, persist = locale !== undefined) {
  if (persist && isSupportedLocale(locale)) {
    localStorage.setItem(STORAGE_KEY, locale);
  }
  const target = currentLocale(locale);
  i18n.global.locale.value = target;
  applyNutuiLocale(target);
}

export function switchLang(locale: LocaleKey) {
  setLang(locale, true);
  window.location.reload();
}
```

保留 `STORAGE_KEY`、`SUPPORTED`、NutUI 语言包和 `loadLang()` 的现有位置与行为。无效持久化请求不得覆盖已经保存的有效语言。

- [ ] **Step 4: 运行语言测试确认通过**

Run: `npm test -- src/i18n/index.spec.ts`

Expected: PASS，4 个测试全部通过。

- [ ] **Step 5: 提交语言优先级实现**

```bash
git add src/i18n/index.ts src/i18n/index.spec.ts
git commit -m "feat: 保留用户语言选择优先级"
```

Expected: 提交中不包含 `.eslintrc-auto-import.json`、登录页或注册页文件。

### Task 2: 原生上下文字段与浏览器降级

**Files:**

- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/mobile/bridge.ts:1-6`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/mobile/bridge.spec.ts:5-10`
- Create: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/mobile/app-context.ts`
- Create: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/mobile/app-context.spec.ts`

**Interfaces:**

- Consumes: `getNativeContext(): Promise<NativeContext | null>` 和 Task 1 的 `isSupportedLocale`。
- Produces: `AppRuntimeContext`；`initializeAppContext(dependencies?): Promise<AppRuntimeContext>`；`getAppContext(): AppRuntimeContext | null`；本地存储键 `timeZone`、`timeZoneOffsetMinutes`。

- [ ] **Step 1: 扩展桥接测试数据表达新增字段**

在 `bridge.spec.ts` 中从 `./bridge` 导入 `type NativeContext`，并将声明改为 `const nativeContext: NativeContext = { ... }`，然后加入：

```ts
locale: 'zh-tw' as const,
timeZone: 'Asia/Taipei',
timeZoneOffsetMinutes: 480,
```

在 `NativeContext` 中暂不加入字段，然后运行类型检查。

- [ ] **Step 2: 运行类型检查确认桥接类型缺失**

Run: `npm run typecheck`

Expected: FAIL，使用新增上下文字段的测试或后续模块无法由 `NativeContext` 类型表达。

- [ ] **Step 3: 为旧 App 兼容地扩展 NativeContext**

在 `bridge.ts` 顶部引入类型并加入可选字段：

```ts
import type { LocaleKey } from '@/i18n';

export interface NativeContext {
  appVersion: string;
  platform: 'android' | 'ios';
  systemVersion: string;
  safeArea: { top: number; right: number; bottom: number; left: number };
  locale?: LocaleKey;
  timeZone?: string;
  timeZoneOffsetMinutes?: number;
}
```

字段必须保持可选，不修改 `getNativeContext` 的 `null` 降级或桥接版本。

- [ ] **Step 4: 写应用上下文初始化失败测试**

创建测试，使用依赖注入避免依赖真实原生桥接和机器时区：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { getAppContext, initializeAppContext } from './app-context';

afterEach(() => localStorage.clear());

const browserFallback = {
  browserTimeZone: () => 'Europe/Paris',
  browserOffsetMinutes: () => 120,
};

describe('App runtime context', () => {
  it('uses valid App locale and refreshes App timezone fields', async () => {
    localStorage.setItem('timeZone', 'America/New_York');
    localStorage.setItem('timeZoneOffsetMinutes', '-240');

    const context = await initializeAppContext({
      ...browserFallback,
      loadNativeContext: async () => ({
        appVersion: '1.0.0',
        platform: 'ios',
        systemVersion: '18.0',
        safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
        locale: 'zh-tw',
        timeZone: 'Asia/Taipei',
        timeZoneOffsetMinutes: 480,
      }),
    });

    expect(context).toEqual({
      locale: 'zh-tw',
      timeZone: 'Asia/Taipei',
      timeZoneOffsetMinutes: 480,
    });
    expect(localStorage.getItem('timeZone')).toBe('Asia/Taipei');
    expect(localStorage.getItem('timeZoneOffsetMinutes')).toBe('480');
    expect(getAppContext()).toEqual(context);
  });

  it('falls back per field when an old App omits the additions', async () => {
    const context = await initializeAppContext({
      ...browserFallback,
      loadNativeContext: async () => ({
        appVersion: '0.9.0',
        platform: 'android',
        systemVersion: '15',
        safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      }),
    });

    expect(context).toEqual({
      locale: undefined,
      timeZone: 'Europe/Paris',
      timeZoneOffsetMinutes: 120,
    });
  });

  it('ignores invalid native fields and survives bridge rejection', async () => {
    const invalid = await initializeAppContext({
      ...browserFallback,
      loadNativeContext: async () => ({
        appVersion: '1.0.0',
        platform: 'ios',
        systemVersion: '18.0',
        safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
        locale: 'fr-fr' as never,
        timeZone: '   ',
        timeZoneOffsetMinutes: Number.NaN,
      }),
    });
    expect(invalid).toEqual({
      locale: undefined,
      timeZone: 'Europe/Paris',
      timeZoneOffsetMinutes: 120,
    });

    await expect(
      initializeAppContext({
        ...browserFallback,
        loadNativeContext: async () => Promise.reject(new Error('bridge failed')),
      }),
    ).resolves.toEqual({
      locale: undefined,
      timeZone: 'Europe/Paris',
      timeZoneOffsetMinutes: 120,
    });
  });
});
```

- [ ] **Step 5: 运行应用上下文测试确认模块不存在**

Run: `npm test -- src/mobile/app-context.spec.ts`

Expected: FAIL，错误指出 `./app-context` 无法解析。

- [ ] **Step 6: 实现应用上下文初始化模块**

创建以下模块；依赖参数只用于测试和可控降级，生产调用无需传参：

```ts
import { isSupportedLocale, type LocaleKey } from '@/i18n';

import { getNativeContext, type NativeContext } from './bridge';

const TIME_ZONE_STORAGE_KEY = 'timeZone';
const TIME_ZONE_OFFSET_STORAGE_KEY = 'timeZoneOffsetMinutes';

export interface AppRuntimeContext {
  locale?: LocaleKey;
  timeZone: string;
  timeZoneOffsetMinutes: number;
}

interface AppContextDependencies {
  loadNativeContext?: () => Promise<NativeContext | null>;
  browserTimeZone?: () => string;
  browserOffsetMinutes?: () => number;
}

let appContext: AppRuntimeContext | null = null;

function defaultBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function defaultBrowserOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export async function initializeAppContext(dependencies: AppContextDependencies = {}): Promise<AppRuntimeContext> {
  const loadNativeContext = dependencies.loadNativeContext ?? getNativeContext;
  let nativeContext: NativeContext | null = null;
  try {
    nativeContext = await loadNativeContext();
  } catch {
    nativeContext = null;
  }

  const browserTimeZone = dependencies.browserTimeZone ?? defaultBrowserTimeZone;
  const browserOffsetMinutes = dependencies.browserOffsetMinutes ?? defaultBrowserOffsetMinutes;
  const nativeTimeZone = nativeContext?.timeZone?.trim();
  const nativeOffset = nativeContext?.timeZoneOffsetMinutes;
  const timeZone = nativeTimeZone || browserTimeZone() || 'UTC';
  const timeZoneOffsetMinutes = Number.isFinite(nativeOffset) ? (nativeOffset as number) : browserOffsetMinutes();
  const locale = isSupportedLocale(nativeContext?.locale) ? nativeContext.locale : undefined;

  appContext = { locale, timeZone, timeZoneOffsetMinutes };
  localStorage.setItem(TIME_ZONE_STORAGE_KEY, timeZone);
  localStorage.setItem(TIME_ZONE_OFFSET_STORAGE_KEY, String(timeZoneOffsetMinutes));
  return appContext;
}

export function getAppContext(): AppRuntimeContext | null {
  return appContext;
}
```

- [ ] **Step 7: 运行桥接和上下文测试确认通过**

Run: `npm test -- src/mobile/bridge.spec.ts src/mobile/app-context.spec.ts`

Expected: PASS，原生通道、浏览器降级、超时和新增上下文字段测试全部通过。

- [ ] **Step 8: 提交上下文模块**

```bash
git add src/mobile/bridge.ts src/mobile/bridge.spec.ts src/mobile/app-context.ts src/mobile/app-context.spec.ts
git commit -m "feat: 初始化 App 语言与时区上下文"
```

Expected: 只包含桥接类型、初始化模块及其测试。

### Task 3: 首屏挂载前应用上下文

**Files:**

- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-front/src/main.ts:1-25`

**Interfaces:**

- Consumes: Task 2 的 `initializeAppContext(): Promise<AppRuntimeContext>` 和 Task 1 的 `setLang(locale, false)`。
- Produces: `bootstrap(): Promise<void>`，保证上下文初始化与语言应用发生在 `app.mount('#app')` 之前。

- [ ] **Step 1: 记录当前入口验证基线**

Run: `npm test -- src/i18n/index.spec.ts src/mobile/bridge.spec.ts src/mobile/app-context.spec.ts`

Expected: PASS。此时新模块行为正确，但 `main.ts` 尚未调用它，功能尚未接入首屏。

- [ ] **Step 2: 将入口改为异步启动**

保持现有样式导入，使用以下启动顺序替换顶层应用创建逻辑：

```ts
import { initializeAppContext } from '@/mobile/app-context';

async function bootstrap() {
  const context = await initializeAppContext();
  const app = createApp(App);

  app.use(router);
  app.use(i18n);
  setLang(context.locale, false);
  app.use(store);
  app.mount('#app');
}

void bootstrap();
```

`createApp` 必须位于上下文初始化之后；即使桥接失败，`initializeAppContext` 也会返回浏览器降级值，入口不需要重复捕获错误。

- [ ] **Step 3: 运行前端完整验证**

Run: `npm test`

Expected: 所有 Vitest 测试通过。

Run: `npm run typecheck`

Expected: 退出码 0，无 TypeScript 或 Vue 类型错误。

Run: `npm run build`

Expected: 生产构建成功生成 `dist`。

Run: `git diff --check`

Expected: 无空白错误。检查 `git status --short`，确认用户已有的 `.eslintrc-auto-import.json`、登录页和注册页修改仍存在且未被覆盖。

- [ ] **Step 4: 提交启动接入**

```bash
git add src/main.ts
git commit -m "feat: 启动时应用 App 默认上下文"
```

Expected: 仅提交 `src/main.ts`。

### Task 4: 跨版本验收

**Files:**

- Verify only: `/Volumes/ExternalDrive/Code/github/bitpongo-front`
- Verify only: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile`

**Interfaces:**

- Consumes: 移动端计划产出的三个可选桥接字段，以及本计划的初始化和语言优先级逻辑。
- Produces: 新旧 App、Web 浏览器和新版前端组合的验证证据；本任务不修改生产代码。

- [ ] **Step 1: 验证前端兼容矩阵对应的自动化测试**

Run: `npm test -- src/i18n/index.spec.ts src/mobile/bridge.spec.ts src/mobile/app-context.spec.ts`

Expected: App 默认语言、手动语言优先、旧 App 字段缺失、无效字段、桥接失败和浏览器降级全部通过。

- [ ] **Step 2: 验证移动端上下文与桥接自动化测试**

在 `/Volumes/ExternalDrive/Code/github/bitpongo-mobile` 运行：

Run: `flutter test test/services/app_context_service_test.dart test/web/native_bridge_test.dart`

Expected: 设备语言映射、时区失败降级和桥接精确响应全部通过。

- [ ] **Step 3: 核对提交和工作区边界**

在两个仓库分别运行：

Run: `git log --oneline -5`

Run: `git status --short`

Expected: 功能提交按计划分离；用户原有未提交文件仍保留；不存在任何 `zhitoubao` 路径修改。本任务没有新文件需要提交。
