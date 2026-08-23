# Bitpongo 前端复用 App Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Bitpongo 前端现有页面 Logo 和 favicon 统一替换为 App 已批准的新版主图标，同时保持现有引用路径、页面布局和业务逻辑不变。

**Architecture:** 以 `bitpongo-mobile/assets/branding/app_icon.png` 为唯一视觉源，页面 Logo 原样复制，favicon 由同一源确定性缩放为 128×128。新增一个只依赖 Node 内置模块的 Vitest 资产契约测试，固定 PNG 规格、批准哈希和现有引用点，防止品牌资源再次漂移。

**Tech Stack:** Vue 3、Vite 8、Vitest 4、Node.js 内置 `fs`/`path`/`crypto`、macOS `sips`。

## Global Constraints

- 只修改 `/Volumes/ExternalDrive/Code/github/bitpongo-front`；`bitpongo-mobile` 只读，旧 `zhitoubao` 仓库不在范围内。
- 唯一源资产是 `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/app_icon.png`。
- `src/assets/logo.png` 必须与 App 主图标字节一致：1024×1024、8-bit RGB PNG、SHA-256 `ac8a7390c0d2d15ece6bca0f887f9095a31eabc0ade5b99ca19d46642c357229`。
- `public/favicon.png` 必须只由上述主图标等比缩放得到：128×128、8-bit RGB PNG、SHA-256 `e606329bb4cf6aefd14b5e58fd19f8d9ae3aa54852593984fd9b475bc8bf0f5e`。
- 不修改 Vue 模板、`index.html`、布局、业务逻辑、移动端资源、币种图标或用户头像逻辑。
- 不使用透明的 `app_icon_foreground.png`/`splash.png`，不调用图片生成模型。

---

### Task 1: 替换并锁定前端品牌资产

**Files:**

- Create: `src/assets/branding-assets.spec.ts`
- Modify: `src/assets/logo.png`
- Modify: `public/favicon.png`

**Interfaces:**

- Consumes: App 主图标文件 `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/app_icon.png`。
- Produces: 页面统一使用的 `src/assets/logo.png`、浏览器使用的 `public/favicon.png`，以及固定两者契约的 `src/assets/branding-assets.spec.ts`。

- [ ] **Step 1: 编写失败的品牌资产契约测试**

创建 `src/assets/branding-assets.spec.ts`：

```ts
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PNG_SIGNATURE = '89504e470d0a1a0a';

function readPng(relativePath: string) {
  const buffer = readFileSync(resolve(process.cwd(), relativePath));

  expect(buffer.subarray(0, 8).toString('hex')).toBe(PNG_SIGNATURE);

  return {
    buffer,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
    sha256: createHash('sha256').update(buffer).digest('hex'),
  };
}

describe('Bitpongo 品牌资产', () => {
  it('页面 Logo 与 App 已批准主图标完全一致', () => {
    const logo = readPng('src/assets/logo.png');

    expect(logo).toMatchObject({
      width: 1024,
      height: 1024,
      bitDepth: 8,
      colorType: 2,
      sha256: 'ac8a7390c0d2d15ece6bca0f887f9095a31eabc0ade5b99ca19d46642c357229',
    });
  });

  it('favicon 是同一批准图标的 128 像素版本', () => {
    const favicon = readPng('public/favicon.png');

    expect(favicon).toMatchObject({
      width: 128,
      height: 128,
      bitDepth: 8,
      colorType: 2,
      sha256: 'e606329bb4cf6aefd14b5e58fd19f8d9ae3aa54852593984fd9b475bc8bf0f5e',
    });
  });

  it('现有品牌入口继续引用统一资源', () => {
    const member = readFileSync(resolve(process.cwd(), 'src/views/member/index.vue'), 'utf8');
    const about = readFileSync(resolve(process.cwd(), 'src/views/member/about/index.vue'), 'utf8');
    const list = readFileSync(resolve(process.cwd(), 'src/views/list/index.vue'), 'utf8');
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

    expect(member).toContain('../../assets/logo.png');
    expect(about).toContain('../../../assets/logo.png');
    expect(list).toContain('../../assets/logo.png');
    expect(html).toContain('href="/favicon.png"');
  });
});
```

- [ ] **Step 2: 运行定向测试并确认 RED**

Run:

```bash
npm test -- src/assets/branding-assets.spec.ts --reporter=verbose
```

Expected: FAIL。旧 `src/assets/logo.png` 实际为 200×200、SHA-256 `b68b6b9202ae3a50bad284e570c1540a7f6d06ed4bddd7ab016d21a6d930611e`；旧 favicon 的 SHA-256 为 `4cb2d2274c33c94f60e035a01d734c0a13d5b49e4706d763fb58016f969dcf43`。

- [ ] **Step 3: 原样复制页面 Logo 并生成 favicon**

Run:

```bash
cp /Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/app_icon.png src/assets/logo.png
cp /Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/app_icon.png public/favicon.png
sips -z 128 128 public/favicon.png
```

Expected: `src/assets/logo.png` 保持源文件字节不变；`public/favicon.png` 变为 128×128 RGB PNG。

- [ ] **Step 4: 运行定向测试并确认 GREEN**

Run:

```bash
npm test -- src/assets/branding-assets.spec.ts --reporter=verbose
```

Expected: PASS，3 tests passed。

- [ ] **Step 5: 检查图片规格、来源哈希和视觉尺寸**

Run:

```bash
file src/assets/logo.png public/favicon.png
shasum -a 256 src/assets/logo.png public/favicon.png /Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/app_icon.png
sips -Z 80 src/assets/logo.png --out /private/tmp/bitpongo-front-logo-80.png
sips -Z 32 public/favicon.png --out /private/tmp/bitpongo-front-favicon-32.png
```

Expected: 页面 Logo 与 App 源文件 SHA-256 相同；favicon 哈希与全局约束一致。查看两个临时预览，确认白色 B 和右上角星光完整可辨、暖橙背景无裁切或透明缝。

- [ ] **Step 6: 执行前端验证**

Run:

```bash

```
