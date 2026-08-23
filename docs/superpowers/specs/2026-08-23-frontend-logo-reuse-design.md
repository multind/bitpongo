# Bitpongo 前端复用 App Logo 设计

## 背景

当前前端仍使用旧版品牌图：`src/assets/logo.png` 是 200×200 的橙色圆角方块，`public/favicon.png` 是同一旧设计的 128×128 版本。App 项目已经启用新版 Bitpongo 图标，采用暖橙背景、圆润白色 B 标识和右上角单枚四角星，因此网页与 App 的品牌形象目前不一致。

本设计只修改 `/Volumes/ExternalDrive/Code/github/bitpongo-front`。App 项目 `/Volumes/ExternalDrive/Code/github/bitpongo-mobile` 仅作为已批准源资产的读取来源，不修改其文件；旧 `zhitoubao` 仓库不在范围内。

## 目标

- 前端所有现有品牌 Logo 统一采用 App 新版主图标。
- 保持“我的”、关于页面、分享海报和浏览器 favicon 的现有引用路径不变。
- 让网页品牌图与 App 图标保持相同的图形、颜色和构图。
- favicon 使用适合浏览器的尺寸，避免直接加载 1024×1024 原图。

## 资产来源

唯一视觉源为 App 项目中的：

```text
/Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/app_icon.png
```

该文件为 1024×1024 RGB PNG，内容包含完整暖橙背景、白色 B 标识和右上角四角星。前端不使用 `app_icon_foreground.png` 或 `splash.png`：它们是透明前景，单独放在不同网页背景上会降低一致性，也不适合作为浏览器 favicon。

## 实现方案

### 页面 Logo

将 App 的 `app_icon.png` 原样复制为：

```text
src/assets/logo.png
```

文件保持 1024×1024 RGB，不对图形、颜色、透明度或构图进行二次编辑。现有页面继续通过同一路径引用，因此无需修改 Vue 模板：

- “我的”页头像区域
- 关于页面
- 策略列表分享海报

### 浏览器 favicon

以同一个 `app_icon.png` 为源，等比缩小生成 128×128 RGB PNG，并覆盖：

```text
public/favicon.png
```

只进行确定性尺寸缩放，不裁切、不重绘、不修改颜色。`index.html` 继续引用 `/favicon.png`，无需改变 HTML。

## 范围边界

- 不修改移动端 Logo、启动页或平台生成资源。
- 不修改币种图标、用户远程头像或其他业务图片。
- 不新增第二套前端 Logo 路径，也不改变现有组件布局。
- 不使用透明自适应前景作为页面 Logo。
- 不调用图片生成模型；本次只复用已经批准的 App 品牌资产。

## 验证方案

- 校验 `src/assets/logo.png` 与 App `app_icon.png` 的 SHA-256 完全一致。
- 校验页面 Logo 为 1024×1024 RGB PNG。
- 校验 favicon 为 128×128 RGB PNG，并与 App 主图标保持相同宽高比。
- 搜索并确认所有前端品牌 Logo 引用仍指向 `src/assets/logo.png` 或 `/favicon.png`。
- 分别查看页面 Logo 的常用显示尺寸和 favicon 的 16×16、32×32 预览，确认 B 与星光可辨识、没有裁切或透明缝。
- 执行前端构建或等价的资源解析检查，确认新图片能够进入生产产物。

## 验收标准

- “我的”、关于页面和分享海报显示新版 Bitpongo Logo。
- 浏览器标签页显示同一新版品牌图形。
- 页面 Logo 与 App 主图标字节一致；favicon 仅有尺寸差异。
- 现有页面引用、业务逻辑和布局没有变化。
- 提交只包含本设计文档以及后续计划明确列出的前端资产变更，不误改 App 或旧项目。
