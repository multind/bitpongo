# App 图标与启动页视觉升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 BitPongo 生成并接入暖橙圆润 `B` 星光图标、Android 自适应前景和一致的启动页标识。

**Architecture:** 先用 `imagegen` 生成 1024×1024 全幅主图标，经视觉检查后再从同一图标编辑出纯色键控背景版本，并在本地移除背景形成透明前景。Flutter 配置分别消费全幅主图标和透明前景，再由现有生成器产出 Android、iOS 和启动页资源；最终同步已提交的新版前端离线包。

**Tech Stack:** Built-in ImageGen、PNG、`flutter_launcher_icons` 0.14.4、`flutter_native_splash` 2.4.7、Flutter 3.41.9、Dart 3.11.5、Xcode 26.3。

## Global Constraints

- 只修改 `/Volumes/ExternalDrive/Code/github/bitpongo-mobile`；实施计划保存在 `bitpongo-front`。
- 不修改后端 API 和任何 `zhitoubao` 目录。
- 图标视觉固定为暖橙亲和智能助手：暖橙渐变全幅背景、白色圆润几何 `B`、右上小型四角星光。
- 主图标为 1024×1024 RGB PNG，无透明边缘、无预绘圆角、无文字、无行情线、无机器人脸、无水印。
- Android 自适应前景为 1024×1024 RGBA PNG，主体完整位于中央安全区。
- 启动页使用同一透明 `B` 星光标识和暖橙背景，不添加文案。
- 必须先保存并检查版本化候选图，再替换仓库现有资产。
- 使用内置 `image_gen` 工具，不使用 CLI/API fallback，不请求或保存 API Key。
- 透明前景使用内置 ImageGen 的纯色键控背景编辑，再调用已安装的 `remove_chroma_key.py`，不使用其他图像编辑器重画主体。
- 不删除 Git 中的旧图标历史；替换资产可通过版本控制恢复。
- 前端离线包只能从已提交且工作区干净的 `bitpongo-front` HEAD 构建。
- Android 原生验证可能受本机 Gradle 8.14 官方分发下载中断影响；必须如实区分环境阻塞与代码验证。

---

## 文件结构

- `assets/branding/app_icon.png`：iOS 和传统 Android 使用的 1024×1024 全幅主图标。
- `assets/branding/app_icon_foreground.png`：Android 自适应图标和启动页使用的透明品牌标识。
- `assets/branding/splash.png`：与透明前景一致的启动页标识源文件。
- `pubspec.yaml`：分别配置主图标、自适应前景、背景色和启动页。
- `test/branding_assets_test.dart`：读取 PNG 头部与 Flutter 配置，验证尺寸、色彩类型和必需文件。
- Android/iOS 生成资源目录：由官方 Flutter 生成器更新，不手工逐张修改。
- `assets/web_bundle/`：同步前端计划完成后的已提交生产构建。

### Task 1: 图标资产契约与 ImageGen 候选

**Files:**

- Create: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/test/branding_assets_test.dart`
- Create: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/app_icon_foreground.png`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/app_icon.png`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/splash.png`

**Interfaces:**

- Consumes: 内置 `image_gen` 生成结果和本地键控背景移除工具。
- Produces: 一个 RGB 全幅主图标和两个一致的 RGBA 透明标识文件，均为 1024×1024。

- [ ] **Step 1: 写 PNG 资产失败测试**

创建不依赖额外图片库的 PNG 头部测试：

```dart
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

({int width, int height, int colorType}) readPngHeader(String path) {
  final bytes = File(path).readAsBytesSync();
  expect(bytes.sublist(0, 8), [137, 80, 78, 71, 13, 10, 26, 10]);
  final data = ByteData.sublistView(bytes);
  return (
    width: data.getUint32(16),
    height: data.getUint32(20),
    colorType: data.getUint8(25),
  );
}

void main() {
  test('branding source assets use the required PNG dimensions and alpha', () {
    final icon = readPngHeader('assets/branding/app_icon.png');
    final foreground = readPngHeader('assets/branding/app_icon_foreground.png');
    final splash = readPngHeader('assets/branding/splash.png');

    expect((icon.width, icon.height, icon.colorType), (1024, 1024, 2));
    expect((foreground.width, foreground.height, foreground.colorType), (1024, 1024, 6));
    expect((splash.width, splash.height, splash.colorType), (1024, 1024, 6));
  });
}
```

PNG 色彩类型 `2` 表示 RGB，`6` 表示带 Alpha 的 RGBA。

- [ ] **Step 2: 运行测试确认透明前景缺失**

Run: `flutter test test/branding_assets_test.dart`

Expected: FAIL，`assets/branding/app_icon_foreground.png` 不存在，且当前 `splash.png` 不是要求的 RGBA 标识。

- [ ] **Step 3: 使用 ImageGen 生成全幅主图标候选**

调用内置 `image_gen`，使用以下完整提示；这是 `logo-brand` 用例，输出用于移动 App 图标：

```text
Use case: logo-brand
Asset type: 1024x1024 mobile app icon master artwork
Primary request: Create a warm, friendly BitPongo app icon featuring a distinctive rounded geometric capital B with one small four-point intelligent sparkle at the upper-right of the B.
Scene/backdrop: Full-bleed warm orange gradient background, edge to edge, no transparent border and no pre-rendered rounded corners.
Subject: A bold white or warm-ivory rounded B, custom and memorable rather than a standard font glyph; one restrained four-point sparkle integrated near the upper-right.
Style/medium: Premium minimal vector-friendly brand mark rendered as polished raster artwork; friendly intelligent assistant rather than aggressive trading product.
Composition/framing: Perfectly centered, generous safe margins, strong silhouette that remains readable at 48px; no element may touch the canvas edge.
Lighting/mood: Soft subtle highlight and restrained depth, clean and trustworthy.
Color palette: Warm orange, tangerine, soft cream-white, tiny pale-gold highlight.
Constraints: Square 1:1; full-bleed background; no baked rounded-corner mask; no transparency; no text other than the single B mark; no watermark.
Avoid: stock font B, robot face, candlestick chart, arrows, coins, gradients that turn muddy brown, excessive shadows, 3D object perspective, thin details.
```

将工具返回的候选文件复制为 `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/branding/app_icon-v2-candidate.png`。在会话中展示候选图，并检查：主体居中、`B` 独特、星光克制、边缘全幅、48px 缩略图清晰。

- [ ] **Step 4: 从已批准候选编辑透明前景源**

使用候选图作为 `referenced_image_paths` 的唯一编辑目标，再调用内置 `image_gen`：

```text
Use case: precise-object-edit
Asset type: Android adaptive icon foreground extraction source
Primary request: Change only the background to a perfectly flat solid #00ff00 chroma-key background. Preserve the exact approved rounded B, sparkle, proportions, colors, highlights, edges, and centered placement.
Scene/backdrop: One uniform #00ff00 field with no gradient, shadow, texture, reflection, floor plane, or lighting variation.
Constraints: Keep the B and sparkle fully separated from the background with generous padding; do not use #00ff00 anywhere in the mark; no cast shadow, contact shadow, text, or watermark.
Avoid: redesigning the B, moving the sparkle, changing thickness, cropping, adding a colored tile behind the mark.
```

将返回文件复制为 `/private/tmp/bitpongo-app-icon-foreground-chroma.png`，然后运行：

```bash
python /Users/zhangcong/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py \
  --input /private/tmp/bitpongo-app-icon-foreground-chroma.png \
  --out assets/branding/app_icon_foreground.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill
```

若边缘出现绿色细线，只重跑一次并增加 `--edge-contract 1`。不要切换到 CLI `gpt-image-1.5`，除非用户另行明确同意。

- [ ] **Step 5: 接入经检查的源资产**

候选通过视觉检查后：

```bash
cp assets/branding/app_icon-v2-candidate.png assets/branding/app_icon.png
cp assets/branding/app_icon_foreground.png assets/branding/splash.png
mv assets/branding/app_icon-v2-candidate.png /private/tmp/bitpongo-app-icon-v2-approved.png
```

移动候选文件前，确认 `app_icon.png` 已写入同一内容；`/private/tmp` 中仍保留可恢复副本，候选不提交。使用会话图像查看工具分别检查主图标和透明前景，并生成 48px 预览确认轮廓。

- [ ] **Step 6: 运行资产测试确认通过**

Run: `flutter test test/branding_assets_test.dart`

Expected: PASS，主图标为 1024×1024 RGB，前景和启动图为 1024×1024 RGBA。

- [ ] **Step 7: 提交品牌源资产**

```bash
git add assets/branding/app_icon.png assets/branding/app_icon_foreground.png assets/branding/splash.png test/branding_assets_test.dart
git commit -m "feat: 重新设计 Bitpongo App 图标"
```

### Task 2: 生成 Android、iOS 与启动页资源

**Files:**

- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/pubspec.yaml:79-95`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/android/app/src/main/res/**`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/**`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/**` or generator-selected launch assets
- Modify: generator-selected Android splash resources under `android/app/src/main/res/drawable-*`
- Test: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/test/branding_assets_test.dart`

**Interfaces:**

- Consumes: Task 1 的 `app_icon.png`、`app_icon_foreground.png` 和 `splash.png`。
- Produces: Android 传统/自适应图标、iOS AppIcon 集合和两端启动页资源。

- [ ] **Step 1: 扩展配置和生成资源失败测试**

在资产测试中增加：

```dart
test('Flutter branding configuration separates full icon and foreground', () {
  final pubspec = File('pubspec.yaml').readAsStringSync();
  expect(pubspec, contains('image_path: assets/branding/app_icon.png'));
  expect(pubspec, contains('adaptive_icon_foreground: assets/branding/app_icon_foreground.png'));
  expect(pubspec, contains('image: assets/branding/splash.png'));
  expect(pubspec, contains('color: "#FF8A3D"'));
});

test('generated platform icon resources are present', () {
  expect(File('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png').existsSync(), isTrue);
  expect(File('android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png').existsSync(), isTrue);
  expect(File('ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png').existsSync(), isTrue);
});
```

- [ ] **Step 2: 运行测试确认配置仍引用旧前景**

Run: `flutter test test/branding_assets_test.dart`

Expected: FAIL，`adaptive_icon_foreground` 仍指向 `app_icon.png`，背景色仍为 `#EF7D19`。

- [ ] **Step 3: 更新 Flutter 品牌配置**

将配置更新为：

```yaml
flutter_launcher_icons:
  android: true
  ios: true
  image_path: assets/branding/app_icon.png
  min_sdk_android: 26
  remove_alpha_ios: true
  adaptive_icon_background: '#FF8A3D'
  adaptive_icon_foreground: assets/branding/app_icon_foreground.png

flutter_native_splash:
  color: '#FF8A3D'
  image: assets/branding/splash.png
  android: true
  ios: true
  android_12:
    color: '#FF8A3D'
    image: assets/branding/splash.png
```

- [ ] **Step 4: 重新生成平台资源**

Run: `dart run flutter_launcher_icons`

Expected: Android mipmap、自适应前景和 iOS AppIcon 文件更新，无 Alpha 警告。

Run: `dart run flutter_native_splash:create`

Expected: Android 和 iOS 启动页资源更新，命令退出码 0。

- [ ] **Step 5: 验证资产契约与静态分析**

Run: `flutter test test/branding_assets_test.dart`

Expected: 全部通过。

Run: `flutter analyze`

Expected: `No issues found!`

- [ ] **Step 6: 视觉检查生成结果**

查看以下实际生成文件并制作小尺寸预览：

- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- `android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png`
- Android 12 启动图和 iOS 启动图生成文件

确认圆形、圆角方形和 iOS 圆角预览均未裁切 `B` 或星光，且背景没有透明边缘。

- [ ] **Step 7: 提交生成资源和配置**

```bash
git add pubspec.yaml android/app/src/main/res ios/Runner/Assets.xcassets
git commit -m "chore: 生成新版应用图标与启动页资源"
```

### Task 3: 同步前端离线包与最终验证

**Files:**

- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/web_bundle/**`

**Interfaces:**

- Consumes: 前端计划完成并提交后的干净 `bitpongo-front` HEAD。
- Produces: 包含新版未登录“我的”页和全局字体的内置 Web Bundle，以及最终平台验证证据。

- [ ] **Step 1: 验证前端 HEAD 与工作区**

在 `/Volumes/ExternalDrive/Code/github/bitpongo-front` 运行：

Run: `git status --short`

Expected: 无输出。

Run: `git rev-parse HEAD`

Expected: 记录完整 40 位提交值，随后写入 Bundle `manifest.json`。

- [ ] **Step 2: 构建并同步前端**

在前端运行：

Run: `npm run build`

Expected: Vite 构建成功。

在移动端使用上一步的完整提交值运行：

```bash
BITPONGO_FRONT_COMMIT="$(git -C /Volumes/ExternalDrive/Code/github/bitpongo-front rev-parse HEAD)"
./scripts/sync_web_bundle.sh /Volumes/ExternalDrive/Code/github/bitpongo-front/dist "$BITPONGO_FRONT_COMMIT" /Volumes/ExternalDrive/Code/github/bitpongo-mobile/assets/web_bundle
```

`BITPONGO_FRONT_COMMIT` 必须是 Step 1 已核对的实际 40 位提交值；同步脚本不得接收字面量 `HEAD`，也不得消费脏工作区构建。

- [ ] **Step 3: 验证离线包清单和脚本**

Run: `bash test/scripts/web_bundle_scripts_test.sh`

Expected: `web bundle script tests passed`。

Run: `rg -n 'guest-welcome|--app-font-family' assets/web_bundle/assets --glob '*.js' --glob '*.css'`

Expected: 构建产物包含新版未登录页面或全局字体标识。

- [ ] **Step 4: 运行移动端完整验证**

Run: `flutter analyze`

Expected: `No issues found!`

Run: `flutter test`

Expected: 所有 Flutter 测试通过。

Run: `flutter build ios --simulator --debug --dart-define=API_BASE_URL=https://api.example.invalid`

Expected: 生成 `build/ios/iphonesimulator/Runner.app`。

仅当 Gradle 8.14 分发已完整可用时运行：

Run: `flutter build appbundle --debug --dart-define=API_BASE_URL=https://api.example.invalid`

Expected: 生成 Debug AAB；若仍在官方分发下载阶段发生 `Premature EOF`，记录为环境阻塞，不报告 Android 构建通过，也不反复删除缓存。

- [ ] **Step 5: 提交离线前端包**

```bash
git add assets/web_bundle
git commit -m "chore: 同步品牌升级前端离线包"
```

- [ ] **Step 6: 核对两个 main 工作区**

在两个仓库分别运行：

Run: `git status --short`

Expected: 无输出。列出本次新增提交，并明确前端完整测试中的既有注册样式失败与 Android 构建状态。

最终交付同时记录实际使用的 ImageGen 完整提示词、主图标路径、透明前景路径和启动页路径。
