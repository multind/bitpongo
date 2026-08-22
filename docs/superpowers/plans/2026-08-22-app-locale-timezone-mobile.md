# App 语言与时区桥接移动端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 BitPongo Flutter App 在现有 `getContext` 响应中提供规范化语言、IANA 时区和当前 UTC 偏移。

**Architecture:** 扩展 `AppContextService`，在 App 启动时读取设备区域设置与时区，并继续由现有 `NativeBridge` 原样返回上下文。时区读取失败只省略时区名称，不影响 WebView 启动；桥接命令、版本和回调名称保持不变。

**Tech Stack:** Flutter 3 / Dart 3.11、`flutter_timezone` 5.1.0、`flutter_test`、现有 `flutter_inappwebview` 桥接。

## Global Constraints

- 只修改 `/Volumes/ExternalDrive/Code/github/bitpongo-mobile`；计划文档本身保存在 `bitpongo-front`。
- 不修改任何 `zhitoubao` 目录。
- 保持桥接 `version: 1`、`getContext` 命令、`ZhitoubaoBridge` 处理器和 `__ZHITOUBAO_NATIVE_RESOLVE__` 回调名称不变。
- 输出字段必须命名为 `locale`、`timeZone`、`timeZoneOffsetMinutes`。
- `locale` 只能是 `zh-cn`、`zh-tw` 或 `en-us`。
- `timeZone` 使用 IANA 名称；`timeZoneOffsetMinutes` 使用本地时间相对 UTC 的分钟偏移。
- 时区读取失败不得阻止 App 或 WebView 启动。
- 保留用户已有的 `README.md`、`ios/Podfile.lock`、`android/app/src/debug/res/` 和 `scripts/verify.sh` 未提交改动；只暂存本计划明确列出的文件。
- 采用测试先行，每项行为先观察失败，再实现最小代码使其通过。

---

## 文件结构

- `lib/services/app_context_service.dart`：读取并规范化设备语言、时区与 UTC 偏移，构建桥接上下文。
- `test/services/app_context_service_test.dart`：验证语言映射、上下文字段和时区失败降级。
- `test/web/native_bridge_test.dart`：验证 `getContext` 通过现有单一回调完整透传新增字段。
- `pubspec.yaml`、`pubspec.lock`：声明并锁定 `flutter_timezone` 5.1.0。

### Task 1: 设备上下文读取与规范化

**Files:**

- Create: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/test/services/app_context_service_test.dart`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/lib/services/app_context_service.dart:1-40`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/pubspec.yaml:30-48`
- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/pubspec.lock`

**Interfaces:**

- Consumes: Flutter `Locale`、`PlatformDispatcher.instance.locale`、`DateTime.timeZoneOffset`、`FlutterTimezone.getLocalTimezone()`。
- Produces: `AppContextService.normalizeLocale(Locale): String`；`AppContextService.create(...)` 支持测试注入；`build(MediaQueryData): Map<String, Object?>` 返回新增字段。

- [ ] **Step 1: 写语言映射和上下文字段失败测试**

创建测试文件，覆盖精确映射和构建结果：

```dart
import 'package:bitpongo_mobile/services/app_context_service.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:package_info_plus/package_info_plus.dart';

void main() {
  test('maps supported device locales to frontend locale keys', () {
    expect(AppContextService.normalizeLocale(const Locale('zh', 'CN')), 'zh-cn');
    expect(AppContextService.normalizeLocale(const Locale('zh', 'SG')), 'zh-cn');
    expect(
      AppContextService.normalizeLocale(
        const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hant'),
      ),
      'zh-tw',
    );
    expect(AppContextService.normalizeLocale(const Locale('zh', 'TW')), 'zh-tw');
    expect(AppContextService.normalizeLocale(const Locale('zh', 'HK')), 'zh-tw');
    expect(AppContextService.normalizeLocale(const Locale('en', 'US')), 'en-us');
    expect(AppContextService.normalizeLocale(const Locale('ja', 'JP')), 'en-us');
  });

  test('builds locale timezone offset and safe area into native context', () {
    const service = AppContextService(
      appVersion: '1.2.3',
      platform: 'ios',
      systemVersion: '18.0',
      locale: 'zh-tw',
      timeZone: 'Asia/Taipei',
      timeZoneOffsetMinutes: 480,
    );

    final context = service.build(
      const MediaQueryData(padding: EdgeInsets.fromLTRB(1, 2, 3, 4)),
    );

    expect(context, {
      'appVersion': '1.2.3',
      'platform': 'ios',
      'systemVersion': '18.0',
      'locale': 'zh-tw',
      'timeZone': 'Asia/Taipei',
      'timeZoneOffsetMinutes': 480,
      'safeArea': {'top': 2.0, 'right': 3.0, 'bottom': 4.0, 'left': 1.0},
    });
  });

  test('omits timezone name when native timezone lookup fails', () async {
    final service = await AppContextService.create(
      packageInfoLoader: () async => PackageInfo(
        appName: 'Bitpongo',
        packageName: 'com.bitpongo.app',
        version: '1.2.3',
        buildNumber: '4',
      ),
      localeLoader: () => const Locale('zh', 'CN'),
      timeZoneLoader: () async => throw StateError('timezone unavailable'),
      timeZoneOffsetMinutesLoader: () => 480,
      platformLoader: () => 'android',
      systemVersionLoader: () => '16',
    );

    final context = service.build(MediaQueryData.zero);
    expect(context['locale'], 'zh-cn');
    expect(context.containsKey('timeZone'), isFalse);
    expect(context['timeZoneOffsetMinutes'], 480);
  });
}
```

- [ ] **Step 2: 运行测试确认因接口尚未实现而失败**

Run: `flutter test test/services/app_context_service_test.dart`

Expected: FAIL，错误包含缺少 `normalizeLocale`、新增构造参数或 `create` 注入参数。

- [ ] **Step 3: 添加最新稳定时区依赖**

Run: `flutter pub add flutter_timezone:^5.1.0`

Expected: `pubspec.yaml` 增加 `flutter_timezone: ^5.1.0`，`pubspec.lock` 锁定 5.1.0；不要运行 `pod install`，不要暂存用户已有的 `ios/Podfile.lock` 修改。

- [ ] **Step 4: 实现可测试的设备上下文服务**

将服务扩展为以下结构，保留现有版本、平台、系统版本和安全区字段：

```dart
import 'dart:io';
import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/widgets.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:package_info_plus/package_info_plus.dart';

typedef PackageInfoLoader = Future<PackageInfo> Function();
typedef LocaleLoader = Locale Function();
typedef TimeZoneLoader = Future<String> Function();
typedef TimeZoneOffsetMinutesLoader = int Function();
typedef StringLoader = String Function();

class AppContextService {
  const AppContextService({
    required this.appVersion,
    required this.platform,
    required this.systemVersion,
    required this.locale,
    required this.timeZone,
    required this.timeZoneOffsetMinutes,
  });

  final String appVersion;
  final String platform;
  final String systemVersion;
  final String locale;
  final String? timeZone;
  final int timeZoneOffsetMinutes;

  static Future<AppContextService> create({
    PackageInfoLoader? packageInfoLoader,
    LocaleLoader? localeLoader,
    TimeZoneLoader? timeZoneLoader,
    TimeZoneOffsetMinutesLoader? timeZoneOffsetMinutesLoader,
    StringLoader? platformLoader,
    StringLoader? systemVersionLoader,
  }) async {
    final packageInfo = await (packageInfoLoader ?? PackageInfo.fromPlatform)();
    final deviceLocale = (localeLoader ?? () => PlatformDispatcher.instance.locale)();
    String? timeZone;
    try {
      timeZone = await (timeZoneLoader ?? _loadTimeZone)();
      if (timeZone.trim().isEmpty) timeZone = null;
    } on Object {
      timeZone = null;
    }

    return AppContextService(
      appVersion: packageInfo.version,
      platform: (platformLoader ?? () => Platform.isIOS ? 'ios' : 'android')(),
      systemVersion: (systemVersionLoader ?? () => Platform.operatingSystemVersion)(),
      locale: normalizeLocale(deviceLocale),
      timeZone: timeZone,
      timeZoneOffsetMinutes:
          (timeZoneOffsetMinutesLoader ??
              () => DateTime.now().timeZoneOffset.inMinutes)(),
    );
  }

  static Future<String> _loadTimeZone() async {
    return (await FlutterTimezone.getLocalTimezone()).name;
  }

  static String normalizeLocale(Locale locale) {
    if (locale.languageCode.toLowerCase() != 'zh') return 'en-us';
    final script = locale.scriptCode?.toLowerCase();
    final region = locale.countryCode?.toUpperCase();
    if (script == 'hant' || const {'TW', 'HK', 'MO'}.contains(region)) {
      return 'zh-tw';
    }
    return 'zh-cn';
  }

  Map<String, Object?> build(MediaQueryData mediaQuery) {
    final padding = mediaQuery.padding;
    final context = <String, Object?>{
      'appVersion': appVersion,
      'platform': platform,
      'systemVersion': systemVersion,
      'locale': locale,
      'timeZoneOffsetMinutes': timeZoneOffsetMinutes,
      'safeArea': {
        'top': padding.top,
        'right': padding.right,
        'bottom': padding.bottom,
        'left': padding.left,
      },
    };
    if (timeZone != null) context['timeZone'] = timeZone;
    return context;
  }
}
```

如果 5.1.0 的生成类型将 `TimezoneInfo.name` 声明为可空类型，则在 `_loadTimeZone` 中显式检查并在缺失时抛出 `StateError('timezone name unavailable')`，让已有失败降级分支处理；不要使用非空断言掩盖类型差异。

- [ ] **Step 5: 格式化并运行目标测试确认通过**

Run: `dart format lib/services/app_context_service.dart test/services/app_context_service_test.dart`

Run: `flutter test test/services/app_context_service_test.dart`

Expected: PASS，3 个测试全部通过。

- [ ] **Step 6: 提交设备上下文实现**

```bash
git add pubspec.yaml pubspec.lock lib/services/app_context_service.dart test/services/app_context_service_test.dart
git commit -m "feat: 向前端提供语言与时区上下文"
```

Expected: 提交中不包含 `README.md`、`ios/Podfile.lock`、`android/app/src/debug/res/` 或 `scripts/verify.sh`。

### Task 2: 桥接协议回归与移动端全量验证

**Files:**

- Modify: `/Volumes/ExternalDrive/Code/github/bitpongo-mobile/test/web/native_bridge_test.dart:15-34,86-102`

**Interfaces:**

- Consumes: Task 1 产出的上下文字段名称和值类型。
- Produces: `NativeBridge` 对新增字段原样透传的回归保证；无需修改生产桥接实现。

- [ ] **Step 1: 先扩展精确响应断言**

在 `returns the exact context through the single resolver callback` 的期望 Map 中加入：

```dart
'locale': 'zh-tw',
'timeZone': 'Asia/Taipei',
'timeZoneOffsetMinutes': 480,
```

暂时不改 `setUp` 中的 `contextLoader` 测试数据。

- [ ] **Step 2: 运行桥接目标测试确认响应缺少新增字段**

Run: `flutter test test/web/native_bridge_test.dart --plain-name "returns the exact context through the single resolver callback"`

Expected: FAIL，实际 JavaScript 回调结果缺少 `locale`、`timeZone` 和 `timeZoneOffsetMinutes`。

- [ ] **Step 3: 更新桥接测试输入模拟真实 AppContextService 输出**

在 `setUp` 的 `contextLoader` Map 中增加同样三个字段：

```dart
'locale': 'zh-tw',
'timeZone': 'Asia/Taipei',
'timeZoneOffsetMinutes': 480,
```

不要修改 `lib/web/native_bridge.dart`；现有桥接应透明编码整个上下文 Map。

- [ ] **Step 4: 运行桥接测试确认通过**

Run: `dart format test/web/native_bridge_test.dart`

Run: `flutter test test/web/native_bridge_test.dart`

Expected: PASS，来源校验、大小限制、重复请求和图片命令测试同时保持通过。

- [ ] **Step 5: 运行移动端完整验证**

Run: `flutter analyze`

Expected: `No issues found!`

Run: `flutter test`

Expected: 所有 Flutter 测试通过。

Run: `git diff --check`

Expected: 无空白错误。检查 `git status --short`，确认用户原有修改仍存在且未被覆盖。

- [ ] **Step 6: 提交桥接回归测试**

```bash
git add test/web/native_bridge_test.dart
git commit -m "test: 覆盖语言与时区桥接响应"
```

Expected: 仅提交该测试文件。
