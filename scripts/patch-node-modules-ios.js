#!/usr/bin/env node
/**
 * Patch a couple upstream iOS build issues in node_modules that can break `expo run:ios`.
 *
 * 1) expo-image: duplicate Swift sources (Blurhash/ImageUtils/Thumbhash) exist both at
 *    `ios/` and `ios/Utils/`, causing "Filename used twice" errors in Xcode.
 *    We keep the `ios/Utils/*` versions and remove the root duplicates.
 *
 * 2) expo-router: the `ios/Tests/*` sources import Swift's `Testing` module which may not
 *    be available in some Xcode/toolchain setups, and can be picked up by pods builds.
 *    We remove the Tests sources (they are not needed for app builds).
 *
 * 3) React Native / Reanimated: some CocoaPods/Xcode 26 setups generate the `React-jsi`
 *    modulemap under `ios/Pods/Headers/Public/jsi` but fail to populate the actual
 *    `jsi/*.h` headers there, which breaks Reanimated with `'jsi/jsi.h' file not found`.
 *    We mirror the React Native JSI headers into that pod header directory.
 *
 * 4) React Native JSI: Xcode 26 treats `std::string::data()` as `const char *` in this
 *    header context, which breaks `std::snprintf`. We switch it to `&buffer[0]`.
 *
 * 5) expo-updates-interface@55.1.3 ships a legacy `UpdatesExternalInterface.swift` that
 *    redeclares block typedefs and the delegate protocol already defined in
 *    `UpdatesInterface.swift`, which breaks Swift compilation in Xcode 26. The newer
 *    `UpdatesDevLauncherInterface` declarations are the ones used by expo-dev-launcher,
 *    so we keep the file path for Xcode/Pods, but replace its body with an empty shim.
 *
 * 6) Some expo-dev-menu versions ship both `DevMenuWindow.swift` and
 *    `DevMenuWindow-default.swift`, which can redeclare `PresentationControllerDelegate`
 *    and `DevMenuWindow`. We only shim `-default` when both files exist.
 *
 * 7) expo-notifications still ships a legacy `EXNotifications.podspec` alongside the
 *    renamed `ExpoNotifications.podspec`. When CocoaPods picks up both, Expo's generated
 *    provider may import both `EXNotifications` and `ExpoNotifications`, but only the new
 *    module is consistently buildable in this setup. We remove the legacy podspec so pods
 *    only autolink the new module name.
 *
 * 8) react-native-screens: keep exactly one copy of `RNSScrollViewFinder/Helper` sources.
 *    Pods builds in this project require root `ios/RNSScrollView*.{h,mm}` files, while some
 *    package layouts also ship helper duplicates under `ios/helpers/scroll-view`, causing
 *    duplicate symbol linker failures. We ensure root files exist, then remove helper
 *    duplicates so only one implementation is compiled.
 *
 * 9) expo CLI: some installs can resolve `SimulatorAppPrerequisite` as undefined at
 *    runtime, crashing `expo start --go` with "Cannot read properties of undefined
 *    (reading 'instance')". We guard that access with optional chaining.
 *
 * 10) Yoga headers: some local CocoaPods header trees can become partially missing/corrupt
 *    (for example `ios/Pods/Headers/Private/Yoga/yoga/debug/Log.h`), causing
 *    `Resource deadlock avoided` / header-not-found iOS build failures. We mirror Yoga
 *    headers from React Native into both Public and Private Yoga pod header directories.
 *
 * 11) React-cxxreact privacy manifest: some local pod header states may fail to resolve
 *    `ReactCommon/cxxreact/PrivacyInfo.xcprivacy` even though it exists in node_modules.
 *    We mirror that file into both Public and Private React-cxxreact pod header trees.
 *
 * 12) React jsinspectornetwork sources: some local installs can end up with a partial
 *    `ReactCommon/jsinspector-modern/network` folder (missing cpp/h files), while Pods
 *    still references them as build inputs. We synthesize compatible fallback files.
 *
 * 13) React nativemodule core sources: some local installs can also lose files under
 *    `ReactCommon/react/nativemodule/core/ReactCommon`. We synthesize compatibility
 *    fallbacks for critical headers/sources so Pods doesn't fail with no-input-file.
 *
 * 14) React perflogger sources: some local installs can lose files under
 *    `ReactCommon/reactperflogger/reactperflogger` while Pods still references them.
 *    We synthesize required files and mirror `NativeModulePerfLogger.h` into Pods headers.
 *
 * 15) TurboModuleUtils Promise callbacks: in partially recovered nativemodule sources,
 *    `Promise::resolve_`/`reject_` may be `jsi::Value`; make call sites use
 *    `.getFunction(runtime).call(...)` for compatibility.
 *
 * 16) TurboCxxModule Promise wrappers: normalize Promise callback access to
 *    `Promise::resolve_`/`reject_` via `.getFunction(rt)` for RN 0.83+.
 *
 * 17) PerformanceEntryReporter perfetto API: some local source mixes call the
 *    newer `ReactPerfettoLogger` signatures with old argument counts. Normalize
 *    calls to `mark(name, start, track)` and `measure(name, start, end, track)`.
 *
 * 18) RuntimeTargetConsole perfetto API: align `ReactPerfettoLogger::measure`
 *    callsite to 4 args by removing legacy `trackGroup`.
 *
 * 19) expo-splash-screen plugin fallback: some local installs can have an empty
 *    `plugin/build` directory. Make `app.plugin.js` gracefully fallback to an
 *    identity plugin so Expo can start.
 *
 * 20) Expo plugin export normalization: some `app.plugin.js` files export an object
 *    with `{ default: fn }` in this environment. Normalize to export the function.
 *
 * This script is idempotent and safe to run multiple times.
 */

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const p = (...parts) => path.join(root, ...parts);

const rmIfExists = (absPath) => {
  try {
    if (fs.existsSync(absPath)) {
      fs.rmSync(absPath, { force: true, recursive: true });
      return true;
    }
  } catch (_) {}
  return false;
};

const log = (msg) => process.stdout.write(`${msg}\n`);

let changed = false;

const replaceInFile = (absPath, replacer) => {
  try {
    if (!fs.existsSync(absPath)) return false;
    const before = fs.readFileSync(absPath, 'utf8');
    const after = replacer(before);
    if (after !== before) {
      fs.writeFileSync(absPath, after, 'utf8');
      return true;
    }
  } catch (_) {}
  return false;
};

const ensureDir = (absPath) => {
  try {
    fs.mkdirSync(absPath, { recursive: true });
    return true;
  } catch (_) {}
  return false;
};

const ensureTextFile = (absPath, contents) => {
  try {
    const exists = fs.existsSync(absPath);
    const isEmpty = exists ? fs.statSync(absPath).size === 0 : true;
    if (!exists || isEmpty) {
      ensureDir(path.dirname(absPath));
      fs.writeFileSync(absPath, contents, 'utf8');
      return true;
    }
  } catch (_) {}
  return false;
};

const cleanupDuplicatePodsDirs = () => {
  const podsRoot = p('ios', 'Pods');
  if (!fs.existsSync(podsRoot)) return false;
  let touched = false;
  try {
    const entries = fs.readdirSync(podsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (!entry.name.endsWith(' 2')) continue;
      const abs = path.join(podsRoot, entry.name);
      if (rmIfExists(abs)) {
        touched = true;
        log(`[patch-node-modules-ios] Removed stale duplicate Pods directory: ${path.relative(root, abs)}`);
      }
    }
  } catch (_) {}
  return touched;
};

if (cleanupDuplicatePodsDirs()) {
  changed = true;
}

const syncDirRecursive = (sourceDir, targetDir, options = {}) => {
  const shouldSkip = options.shouldSkip || (() => false);
  if (!fs.existsSync(sourceDir)) return false;
  ensureDir(targetDir);
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  let wrote = false;
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    const rel = path.relative(sourceDir, sourcePath);
    if (shouldSkip(rel, sourcePath, targetPath, entry)) {
      continue;
    }
    if (entry.isDirectory()) {
      if (syncDirRecursive(sourcePath, targetPath, options)) wrote = true;
      continue;
    }
    try {
      const next = fs.readFileSync(sourcePath);
      ensureDir(path.dirname(targetPath));
      // Always overwrite target bytes to avoid reads on potentially deadlocked files.
      fs.writeFileSync(targetPath, next);
      wrote = true;
    } catch (_) {}
  }
  return wrote;
};

// ---- expo-image duplicate Swift files ----
// expo-image sometimes ships duplicate Swift sources at ios/<File>.swift as well as ios/**/<File>.swift,
// which breaks Xcode with "Filename used twice". We always remove the root-level duplicate and keep
// the nested version (Utils/Loaders/Coders/etc).
const expoImageRoot = p('node_modules', 'expo-image', 'ios');
if (fs.existsSync(expoImageRoot)) {
  const walk = (dir, out = []) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        // Skip tests; they are excluded by the podspec anyway.
        if (e.name === 'Tests') continue;
        walk(abs, out);
      } else {
        out.push(abs);
      }
    }
    return out;
  };

  const allFiles = walk(expoImageRoot);
  const swiftFiles = allFiles.filter((f) => f.endsWith('.swift'));

  const byBase = new Map();
  for (const abs of swiftFiles) {
    const base = path.basename(abs);
    const arr = byBase.get(base) ?? [];
    arr.push(abs);
    byBase.set(base, arr);
  }

  for (const [base, paths] of byBase.entries()) {
    if (paths.length < 2) continue;
    const rootCandidate = path.join(expoImageRoot, base);
    if (!paths.includes(rootCandidate)) continue;
    // Keep any nested copy, remove the root-level one.
    const removed = rmIfExists(rootCandidate);
    if (removed) {
      changed = true;
      log(`[patch-node-modules-ios] Removed duplicate expo-image source: ${path.relative(root, rootCandidate)}`);
    }
  }
}

// ---- expo-router iOS Tests ----
const expoRouterTestsDir = p('node_modules', 'expo-router', 'ios', 'Tests');
if (rmIfExists(expoRouterTestsDir)) {
  changed = true;
  log(`[patch-node-modules-ios] Removed expo-router iOS Tests: ${path.relative(root, expoRouterTestsDir)}`);
}

// ---- expo-av header compatibility ----
// expo-av still imports the legacy ObjC header name `EXEventEmitter.h`, but ExpoModulesCore exports
// the modern `EventEmitter.h` header in SDK 55+.
const expoAvHeader = p('node_modules', 'expo-av', 'ios', 'EXAV', 'EXAV.h');
if (
  replaceInFile(expoAvHeader, (s) =>
    s.replace(
      /#import\s+<ExpoModulesCore\/EXEventEmitter\.h>/g,
      '#import <ExpoModulesCore/EventEmitter.h>'
    )
  )
) {
  changed = true;
  log(`[patch-node-modules-ios] Patched expo-av import in: ${path.relative(root, expoAvHeader)}`);
}

// expo-av video view still references `EXLegacyExpoViewProtocol`, which was removed in newer ExpoModulesCore.
// The protocol is only used for legacy view registry wiring and is safe to drop for app builds.
const expoAvVideoViewHeader = p('node_modules', 'expo-av', 'ios', 'EXAV', 'Video', 'EXVideoView.h');
if (
  replaceInFile(expoAvVideoViewHeader, (s) => {
    let out = s.replace(
      /#import\s+<ExpoModulesCore\/EXLegacyExpoViewProtocol\.h>\s*\n/g,
      ''
    );
    // Remove protocol conformance from the interface declaration.
    out = out.replace(/\s*,\s*EXLegacyExpoViewProtocol\s*>/g, '>');
    out = out.replace(/\s*<\s*EXLegacyExpoViewProtocol\s*,/g, '<');
    out = out.replace(/\s*<\s*EXLegacyExpoViewProtocol\s*>/g, '');
    return out;
  })
) {
  changed = true;
  log(`[patch-node-modules-ios] Removed EXLegacyExpoViewProtocol from: ${path.relative(root, expoAvVideoViewHeader)}`);
}

// ---- React JSI headers for Reanimated / Worklets ----
const reactNativeJsiDir = p('node_modules', 'react-native', 'ReactCommon', 'jsi', 'jsi');
const podPublicJsiDir = p('ios', 'Pods', 'Headers', 'Public', 'jsi', 'jsi');
if (fs.existsSync(reactNativeJsiDir)) {
  ensureDir(podPublicJsiDir);
  try {
    const headerFiles = fs.readdirSync(reactNativeJsiDir).filter((name) => name.endsWith('.h'));
    for (const file of headerFiles) {
      const source = path.join(reactNativeJsiDir, file);
      const target = path.join(podPublicJsiDir, file);
      const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
      const next = fs.readFileSync(source, 'utf8');
      if (before !== next) {
        fs.writeFileSync(target, next, 'utf8');
        changed = true;
      }
    }
    if (headerFiles.length > 0) {
      log(`[patch-node-modules-ios] Synced React JSI headers into: ${path.relative(root, podPublicJsiDir)}`);
    }
  } catch (_) {}
}

const reactNativeJsiHeader = p('node_modules', 'react-native', 'ReactCommon', 'jsi', 'jsi', 'jsi.h');
if (
  replaceInFile(reactNativeJsiHeader, (s) =>
    s.replace(
      /std::snprintf\(\s*buffer\.data\(\),/g,
      'std::snprintf(\n        &buffer[0],'
    )
  )
) {
  changed = true;
  log(`[patch-node-modules-ios] Patched React Native JSI header in: ${path.relative(root, reactNativeJsiHeader)}`);
}

// ---- Yoga headers for CocoaPods / Xcode 26 deadlock/header-not-found issues ----
const reactNativeYogaDir = p('node_modules', 'react-native', 'ReactCommon', 'yoga', 'yoga');
const podPrivateYogaDir = p('ios', 'Pods', 'Headers', 'Private', 'Yoga', 'yoga');
const podPublicYogaDir = p('ios', 'Pods', 'Headers', 'Public', 'Yoga', 'yoga');
if (fs.existsSync(reactNativeYogaDir)) {
  const buildSafeYogaModuleMap = (moduleName) => `module ${moduleName} [system] {
  header "YGConfig.h"
  header "YGEnums.h"
  header "YGMacros.h"
  header "YGNode.h"
  header "YGNodeLayout.h"
  header "YGNodeStyle.h"
  header "YGPixelGrid.h"
  header "YGValue.h"
  header "Yoga.h"
  export *
}
`;
  const reactNativeYogaModuleMap = path.join(reactNativeYogaDir, 'module.modulemap');
  let rewroteSourceYogaModuleMap = false;
  try {
    fs.writeFileSync(reactNativeYogaModuleMap, buildSafeYogaModuleMap('yoga_compat_source'), 'utf8');
    rewroteSourceYogaModuleMap = true;
  } catch (_) {}

  const yogaSyncOptions = {
    // Avoid shadowed-module errors from copied nested Yoga module maps.
    shouldSkip: (relPath) => relPath === 'module.modulemap',
  };
  const privateChanged = syncDirRecursive(reactNativeYogaDir, podPrivateYogaDir, yogaSyncOptions);
  const publicChanged = syncDirRecursive(reactNativeYogaDir, podPublicYogaDir, yogaSyncOptions);
  const publicModuleMapPath = path.join(podPublicYogaDir, 'module.modulemap');
  const privateModuleMapPath = path.join(podPrivateYogaDir, 'module.modulemap');
  let rewrotePublicModuleMap = false;
  let rewrotePrivateModuleMap = false;
  try {
    ensureDir(path.dirname(publicModuleMapPath));
    fs.writeFileSync(publicModuleMapPath, buildSafeYogaModuleMap('yoga_compat_public'), 'utf8');
    rewrotePublicModuleMap = true;
  } catch (_) {}
  try {
    ensureDir(path.dirname(privateModuleMapPath));
    fs.writeFileSync(privateModuleMapPath, buildSafeYogaModuleMap('yoga_compat_private'), 'utf8');
    rewrotePrivateModuleMap = true;
  } catch (_) {}
  if (rewroteSourceYogaModuleMap || privateChanged || publicChanged) {
    changed = true;
    log(
      `[patch-node-modules-ios] Synced Yoga headers into: ${path.relative(
        root,
        podPrivateYogaDir
      )} and ${path.relative(root, podPublicYogaDir)}`
    );
  }
  if (rewroteSourceYogaModuleMap) {
    changed = true;
    log('[patch-node-modules-ios] Rewrote React Native Yoga source module.modulemap to yoga_compat');
  }
  if (rewrotePublicModuleMap || rewrotePrivateModuleMap) {
    changed = true;
    log('[patch-node-modules-ios] Rewrote Yoga module.modulemap to safe flat module definition');
  }
}

// ---- React-cxxreact PrivacyInfo.xcprivacy mirror ----
const reactCxxPrivacySource = p(
  'node_modules',
  'react-native',
  'ReactCommon',
  'cxxreact',
  'PrivacyInfo.xcprivacy'
);
const reactCxxPrivacyPrivateDest = p(
  'ios',
  'Pods',
  'Headers',
  'Private',
  'React-cxxreact',
  'ReactCommon',
  'cxxreact',
  'PrivacyInfo.xcprivacy'
);
const reactCxxPrivacyPublicDest = p(
  'ios',
  'Pods',
  'Headers',
  'Public',
  'React-cxxreact',
  'ReactCommon',
  'cxxreact',
  'PrivacyInfo.xcprivacy'
);
if (fs.existsSync(reactCxxPrivacySource)) {
  try {
    const bytes = fs.readFileSync(reactCxxPrivacySource);
    ensureDir(path.dirname(reactCxxPrivacyPrivateDest));
    ensureDir(path.dirname(reactCxxPrivacyPublicDest));
    fs.writeFileSync(reactCxxPrivacyPrivateDest, bytes);
    fs.writeFileSync(reactCxxPrivacyPublicDest, bytes);
    changed = true;
    log(
      `[patch-node-modules-ios] Synced React-cxxreact PrivacyInfo into: ${path.relative(
        root,
        path.dirname(reactCxxPrivacyPrivateDest)
      )} and ${path.relative(root, path.dirname(reactCxxPrivacyPublicDest))}`
    );
  } catch (_) {}
}

// ---- React jsinspectornetwork missing source fallback ----
const jsInspectorNetworkDir = p(
  'node_modules',
  'react-native',
  'ReactCommon',
  'jsinspector-modern',
  'network'
);

const jsinspectorNetworkFiles = [
  [
    'BoundedRequestBuffer.h',
    `#pragma once

#include <optional>
#include <string>
#include <string_view>
#include <tuple>

namespace facebook::react::jsinspector_modern {

class BoundedRequestBuffer {
 public:
  BoundedRequestBuffer() = default;
  ~BoundedRequestBuffer() = default;

  void storeResponseBody(
      const std::string& /*requestId*/,
      std::string_view /*responseBody*/,
      bool /*base64Encoded*/) {}

  std::optional<std::tuple<std::string, bool>> getResponseBody(const std::string& /*requestId*/) {
    return std::nullopt;
  }
};

} // namespace facebook::react::jsinspector_modern
`,
  ],
  [
    'BoundedRequestBuffer.cpp',
    `#include "BoundedRequestBuffer.h"
`,
  ],
  [
    'CdpNetwork.h',
    `#pragma once

#include <folly/dynamic.h>

#include <map>
#include <optional>
#include <string>

namespace facebook::react::jsinspector_modern::cdp::network {

struct Request {
  std::string url;
  std::string method;
  std::map<std::string, std::string> headers;
  std::optional<std::string> postData;
};

struct Response {
  std::string url;
  uint16_t status{200};
  std::string statusText;
  std::map<std::string, std::string> headers;
  std::string mimeType;
  int encodedDataLength{0};

  static Response fromInputParams(
      const std::string& url,
      uint16_t status,
      const std::map<std::string, std::string>& headers,
      int encodedDataLength);
};

inline folly::dynamic toDynamic(const Request& request) {
  folly::dynamic out = folly::dynamic::object;
  out["url"] = request.url;
  out["method"] = request.method;
  folly::dynamic headerObj = folly::dynamic::object;
  for (const auto& [key, value] : request.headers) {
    headerObj[key] = value;
  }
  out["headers"] = headerObj;
  out["postData"] = request.postData.value_or("");
  return out;
}

inline folly::dynamic toDynamic(const Response& response) {
  folly::dynamic out = folly::dynamic::object;
  out["url"] = response.url;
  out["status"] = response.status;
  out["statusText"] = response.statusText;
  folly::dynamic headerObj = folly::dynamic::object;
  for (const auto& [key, value] : response.headers) {
    headerObj[key] = value;
  }
  out["headers"] = headerObj;
  out["mimeType"] = response.mimeType;
  out["encodedDataLength"] = response.encodedDataLength;
  return out;
}

} // namespace facebook::react::jsinspector_modern::cdp::network
`,
  ],
  [
    'CdpNetwork.cpp',
    `#include "CdpNetwork.h"

#include "HttpUtils.h"

namespace facebook::react::jsinspector_modern::cdp::network {

/* static */ Response Response::fromInputParams(
    const std::string& url,
    uint16_t status,
    const std::map<std::string, std::string>& headers,
    int encodedDataLength) {
  return {
      .url = url,
      .status = status,
      .statusText = httpReasonPhrase(status),
      .headers = headers,
      .mimeType = mimeTypeFromHeaders(headers),
      .encodedDataLength = encodedDataLength,
  };
}

} // namespace facebook::react::jsinspector_modern::cdp::network
`,
  ],
  [
    'HttpUtils.cpp',
    `#include "HttpUtils.h"

namespace facebook::react::jsinspector_modern {

std::string httpReasonPhrase(uint16_t status) {
  switch (status) {
    case 200:
      return "OK";
    case 201:
      return "Created";
    case 204:
      return "No Content";
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 500:
      return "Internal Server Error";
    default:
      return "";
  }
}

std::string mimeTypeFromHeaders(const Headers& headers) {
  auto it = headers.find("Content-Type");
  if (it == headers.end()) {
    it = headers.find("content-type");
  }
  if (it == headers.end() || it->second.empty()) {
    return "application/octet-stream";
  }
  return it->second;
}

} // namespace facebook::react::jsinspector_modern
`,
  ],
  [
    'NetworkHandler.cpp',
    `#include "NetworkHandler.h"

#include <utility>

namespace facebook::react::jsinspector_modern {

NetworkHandler& NetworkHandler::getInstance() {
  static NetworkHandler instance;
  return instance;
}

void NetworkHandler::setFrontendChannel(FrontendChannel frontendChannel) {
  frontendChannel_ = std::move(frontendChannel);
}

bool NetworkHandler::enable() {
  bool expected = false;
  return enabled_.compare_exchange_strong(expected, true, std::memory_order_acq_rel);
}

bool NetworkHandler::disable() {
  bool expected = true;
  return enabled_.compare_exchange_strong(expected, false, std::memory_order_acq_rel);
}

void NetworkHandler::onRequestWillBeSent(
    const std::string& requestId,
    const cdp::network::Request&,
    const std::optional<cdp::network::Response>&) {
  std::scoped_lock lock(requestMetadataMutex_);
  resourceTypeMap_[requestId] = "Other";
}

void NetworkHandler::onRequestWillBeSentExtraInfo(const std::string&, const Headers&) {}
void NetworkHandler::onResponseReceived(const std::string&, const cdp::network::Response&) {}
void NetworkHandler::onDataReceived(const std::string&, int, int) {}

void NetworkHandler::onLoadingFinished(const std::string& requestId, int) {
  std::scoped_lock lock(requestMetadataMutex_);
  resourceTypeMap_.erase(requestId);
}

void NetworkHandler::onLoadingFailed(const std::string& requestId, bool) {
  std::scoped_lock lock(requestMetadataMutex_);
  resourceTypeMap_.erase(requestId);
}

void NetworkHandler::storeResponseBody(const std::string&, std::string_view, bool) {}

std::optional<std::tuple<std::string, bool>> NetworkHandler::getResponseBody(const std::string&) {
  return std::nullopt;
}

void NetworkHandler::recordRequestInitiatorStack(const std::string& requestId, folly::dynamic stackTrace) {
  std::scoped_lock lock(requestMetadataMutex_);
  requestInitiatorById_[requestId] = std::move(stackTrace);
}

std::optional<folly::dynamic> NetworkHandler::consumeStoredRequestInitiator(const std::string& requestId) {
  std::scoped_lock lock(requestMetadataMutex_);
  auto it = requestInitiatorById_.find(requestId);
  if (it == requestInitiatorById_.end()) {
    return std::nullopt;
  }
  folly::dynamic value = std::move(it->second);
  requestInitiatorById_.erase(it);
  return value;
}

} // namespace facebook::react::jsinspector_modern
`,
  ],
  [
    'React-jsinspectornetwork.podspec',
    `# Generated compatibility podspec placeholder for local build recovery.
Pod::Spec.new do |s|
  s.name = 'React-jsinspectornetwork'
  s.version = '0.0.1'
  s.summary = 'Compatibility shim'
  s.homepage = 'https://reactnative.dev'
  s.license = { :type => 'MIT' }
  s.author = 'Meta'
  s.source = { :git => 'https://github.com/facebook/react-native.git' }
  s.platforms = { :ios => '15.1' }
  s.source_files = '*.{cpp,h}'
  s.header_dir = 'jsinspector-modern/network'
end
`,
  ],
];

if (fs.existsSync(jsInspectorNetworkDir)) {
  let jsInspectorPatched = false;
  for (const [name, contents] of jsinspectorNetworkFiles) {
    const absPath = path.join(jsInspectorNetworkDir, name);
    if (ensureTextFile(absPath, contents)) {
      jsInspectorPatched = true;
    }
  }
  if (jsInspectorPatched) {
    changed = true;
    log(
      `[patch-node-modules-ios] Repaired missing jsinspectornetwork sources in: ${path.relative(
        root,
        jsInspectorNetworkDir
      )}`
    );
  }
}

// ---- React nativemodule core missing source fallback ----
const rnNativeModuleCoreDir = p(
  'node_modules',
  'react-native',
  'ReactCommon',
  'react',
  'nativemodule',
  'core',
  'ReactCommon'
);

const rnNativeModuleCoreFallbacks = [
  [
    'CallbackWrapper.h',
    `#pragma once

#include <memory>

#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>

namespace facebook::react {

class CallbackWrapper : public std::enable_shared_from_this<CallbackWrapper> {
 public:
  static std::weak_ptr<CallbackWrapper> createWeak(
      facebook::jsi::Function&& callback,
      facebook::jsi::Runtime& runtime,
      std::shared_ptr<CallInvoker> jsInvoker) {
    auto wrapper = std::shared_ptr<CallbackWrapper>(
        new CallbackWrapper(std::move(callback), runtime, std::move(jsInvoker)));
    return std::weak_ptr<CallbackWrapper>(wrapper);
  }

  CallInvoker& jsInvoker() const {
    return *jsInvoker_;
  }

  facebook::jsi::Function& callback() {
    return callback_;
  }

  void destroy() {}

 private:
  CallbackWrapper(
      facebook::jsi::Function&& callback,
      facebook::jsi::Runtime& runtime,
      std::shared_ptr<CallInvoker> jsInvoker)
      : callback_(std::move(callback)), runtime_(runtime), jsInvoker_(std::move(jsInvoker)) {}

  facebook::jsi::Function callback_;
  facebook::jsi::Runtime& runtime_;
  std::shared_ptr<CallInvoker> jsInvoker_;
};

} // namespace facebook::react
`,
  ],
  [
    'TurboModuleUtils.h',
    `#pragma once

#include <memory>

#include <jsi/jsi.h>
#include <react/bridging/LongLivedObject.h>

#include <ReactCommon/CallbackWrapper.h>

namespace facebook::react {

jsi::Object deepCopyJSIObject(jsi::Runtime& rt, const jsi::Object& obj);
jsi::Array deepCopyJSIArray(jsi::Runtime& rt, const jsi::Array& arr);

class Promise : public LongLivedObject {
 public:
  Promise(jsi::Runtime& rt, jsi::Function resolve, jsi::Function reject);
  void resolve(const jsi::Value& result);
  void reject(const std::string& message);

  jsi::Value resolve_;
  jsi::Value reject_;
};

using PromiseSetupFunctionType =
    std::function<void(jsi::Runtime& runtime, std::shared_ptr<Promise> promise)>;

jsi::Value createPromiseAsJSIValue(
    jsi::Runtime& rt,
    PromiseSetupFunctionType&& func);

} // namespace facebook::react
`,
  ],
  [
    'TurboModuleWithJSIBindings.h',
    `#pragma once

#include <jsi/jsi.h>

#include <ReactCommon/TurboModule.h>

namespace facebook::react {

class TurboModuleWithJSIBindings {
 public:
  static void installJSIBindings(
      const std::shared_ptr<TurboModule>& module,
      jsi::Runtime& runtime);
};

} // namespace facebook::react
`,
  ],
  [
    'TurboModuleWithJSIBindings.cpp',
    `#include "TurboModuleWithJSIBindings.h"

namespace facebook::react {

void TurboModuleWithJSIBindings::installJSIBindings(
    const std::shared_ptr<TurboModule>& /*module*/,
    jsi::Runtime& /*runtime*/) {}

} // namespace facebook::react
`,
  ],
];

if (fs.existsSync(rnNativeModuleCoreDir)) {
  let rnNativeModuleCorePatched = false;
  for (const [name, contents] of rnNativeModuleCoreFallbacks) {
    const absPath = path.join(rnNativeModuleCoreDir, name);
    if (ensureTextFile(absPath, contents)) {
      rnNativeModuleCorePatched = true;
    }
  }
  if (rnNativeModuleCorePatched) {
    changed = true;
    log(
      `[patch-node-modules-ios] Repaired missing nativemodule core files in: ${path.relative(
        root,
        rnNativeModuleCoreDir
      )}`
    );
  }

  const turboModuleUtilsCpp = path.join(rnNativeModuleCoreDir, 'TurboModuleUtils.cpp');
  if (
    replaceInFile(turboModuleUtilsCpp, (s) => {
      let out = s.replace(
        /resolve_\.call\(\s*runtime_,\s*result\s*\);/g,
        'resolve_.getFunction(runtime_).call(runtime_, result);'
      );
      out = out.replace(
        /reject_\.call\(\s*runtime_,\s*error\s*\);/g,
        'reject_.getFunction(runtime_).call(runtime_, error);'
      );
      return out;
    })
  ) {
    changed = true;
    log(`[patch-node-modules-ios] Patched TurboModuleUtils Promise callsites: ${path.relative(root, turboModuleUtilsCpp)}`);
  }

  const turboCxxModuleCpp = path.join(rnNativeModuleCoreDir, 'TurboCxxModule.cpp');
  if (
    replaceInFile(turboCxxModuleCpp, (s) => {
      let out = s.replace(
        /promise->resolve_\.getObject\(rt\)\.getFunction\(rt\)/g,
        'promise->resolve_.getFunction(rt)'
      );
      out = out.replace(
        /promise->reject_\.getObject\(rt\)\.getFunction\(rt\)/g,
        'promise->reject_.getFunction(rt)'
      );
      return out;
    })
  ) {
    changed = true;
    log(`[patch-node-modules-ios] Patched TurboCxxModule Promise wrappers: ${path.relative(root, turboCxxModuleCpp)}`);
  }
}

// ---- PerformanceEntryReporter ReactPerfettoLogger signature compatibility ----
const performanceEntryReporterCpp = p(
  'node_modules',
  'react-native',
  'ReactCommon',
  'react',
  'performance',
  'timeline',
  'PerformanceEntryReporter.cpp'
);
if (
  replaceInFile(performanceEntryReporterCpp, (s) => {
    let out = s.replace(
      /ReactPerfettoLogger::mark\(\s*entry\.name,\s*entry\.startTime\s*\);/g,
      'ReactPerfettoLogger::mark(entry.name, entry.startTime, std::nullopt);'
    );
    out = out.replace(
      /ReactPerfettoLogger::measure\(\s*entry\.name,\s*entry\.startTime,\s*entry\.startTime \+ entry\.duration,\s*detail != nullptr \? getTrackFromDetail\(detail\) : std::nullopt,\s*detail != nullptr \? getTrackGroupFromDetail\(detail\) : std::nullopt\);/g,
      'ReactPerfettoLogger::measure(\n          entry.name,\n          entry.startTime,\n          entry.startTime + entry.duration,\n          detail != nullptr ? getTrackFromDetail(detail) : std::nullopt);'
    );
    return out;
  })
) {
  changed = true;
  log(
    `[patch-node-modules-ios] Patched PerformanceEntryReporter ReactPerfettoLogger calls: ${path.relative(
      root,
      performanceEntryReporterCpp
    )}`
  );
}

const runtimeTargetConsoleCpp = p(
  'node_modules',
  'react-native',
  'ReactCommon',
  'jsinspector-modern',
  'RuntimeTargetConsole.cpp'
);
if (
  replaceInFile(runtimeTargetConsoleCpp, (s) =>
    s.replace(
      /ReactPerfettoLogger::measure\(\s*label,\s*\*perfettoStart,\s*\*perfettoEnd,\s*trackName,\s*trackGroup\s*\);/g,
      'ReactPerfettoLogger::measure(label, *perfettoStart, *perfettoEnd, trackName);'
    )
  )
) {
  changed = true;
  log(
    `[patch-node-modules-ios] Patched RuntimeTargetConsole ReactPerfettoLogger::measure call: ${path.relative(
      root,
      runtimeTargetConsoleCpp
    )}`
  );
}

const expoSplashAppPlugin = p('node_modules', 'expo-splash-screen', 'app.plugin.js');
if (
  replaceInFile(expoSplashAppPlugin, () =>
    `let plugin;\ntry {\n  plugin = require('./plugin/build/withSplashScreen');\n} catch (_error) {\n  plugin = (config) => config;\n}\n\nmodule.exports = plugin.default || plugin;\n`
  )
) {
  changed = true;
  log(`[patch-node-modules-ios] Patched expo-splash-screen plugin fallback: ${path.relative(root, expoSplashAppPlugin)}`);
}

const expoPluginEntryFixups = [
  ['expo-secure-store', './plugin/build/withSecureStore'],
  ['expo-font', './plugin/build/withFonts'],
  ['expo-web-browser', './plugin/build/withWebBrowser'],
];

for (const [pkg, relRequirePath] of expoPluginEntryFixups) {
  const appPluginPath = p('node_modules', pkg, 'app.plugin.js');
  if (
    replaceInFile(
      appPluginPath,
      () => `const plugin = require('${relRequirePath}');\nmodule.exports = plugin.default || plugin;\n`
    )
  ) {
    changed = true;
    log(`[patch-node-modules-ios] Normalized config-plugin export for: ${path.relative(root, appPluginPath)}`);
  }
}

const expoAudioAppPlugin = p('node_modules', 'expo-audio', 'app.plugin.js');
if (
  replaceInFile(
    expoAudioAppPlugin,
    () =>
      `// Temporary safety fallback:\n// expo-audio's plugin import can hang in this local environment.\n// Returning identity lets Expo config/start proceed.\nmodule.exports = function withAudioSafe(config) {\n  return config;\n};\n`
  )
) {
  changed = true;
  log(`[patch-node-modules-ios] Patched expo-audio plugin to safe identity fallback: ${path.relative(root, expoAudioAppPlugin)}`);
}

// ---- React perflogger missing source fallback ----
const reactPerfLoggerDir = p(
  'node_modules',
  'react-native',
  'ReactCommon',
  'reactperflogger',
  'reactperflogger'
);

const reactPerfLoggerFallbacks = [
  [
    'NativeModulePerfLogger.h',
    `#pragma once

#include <cstdint>

namespace facebook::react {

class NativeModulePerfLogger {
 public:
  virtual ~NativeModulePerfLogger() = default;

  virtual void moduleDataCreateStart(const char*, int32_t) {}
  virtual void moduleDataCreateEnd(const char*, int32_t) {}
  virtual void moduleCreateStart(const char*, int32_t) {}
  virtual void moduleCreateCacheHit(const char*, int32_t) {}
  virtual void moduleCreateConstructStart(const char*, int32_t) {}
  virtual void moduleCreateConstructEnd(const char*, int32_t) {}
  virtual void moduleCreateSetUpStart(const char*, int32_t) {}
  virtual void moduleCreateSetUpEnd(const char*, int32_t) {}
  virtual void moduleCreateEnd(const char*, int32_t) {}
  virtual void moduleCreateFail(const char*, int32_t) {}

  virtual void moduleJSRequireBeginningStart(const char*) {}
  virtual void moduleJSRequireBeginningCacheHit(const char*) {}
  virtual void moduleJSRequireBeginningEnd(const char*) {}
  virtual void moduleJSRequireBeginningFail(const char*) {}

  virtual void moduleJSRequireEndingStart(const char*) {}
  virtual void moduleJSRequireEndingEnd(const char*) {}
  virtual void moduleJSRequireEndingFail(const char*) {}

  virtual void syncMethodCallStart(const char*, const char*) {}
  virtual void syncMethodCallArgConversionStart(const char*, const char*) {}
  virtual void syncMethodCallArgConversionEnd(const char*, const char*) {}
  virtual void syncMethodCallExecutionStart(const char*, const char*) {}
  virtual void syncMethodCallExecutionEnd(const char*, const char*) {}
  virtual void syncMethodCallReturnConversionStart(const char*, const char*) {}
  virtual void syncMethodCallReturnConversionEnd(const char*, const char*) {}
  virtual void syncMethodCallEnd(const char*, const char*) {}
  virtual void syncMethodCallFail(const char*, const char*) {}

  virtual void asyncMethodCallStart(const char*, const char*) {}
  virtual void asyncMethodCallArgConversionStart(const char*, const char*) {}
  virtual void asyncMethodCallArgConversionEnd(const char*, const char*) {}
  virtual void asyncMethodCallDispatch(const char*, const char*) {}
  virtual void asyncMethodCallEnd(const char*, const char*) {}
  virtual void asyncMethodCallFail(const char*, const char*) {}

  virtual void asyncMethodCallBatchPreprocessStart() {}
  virtual void asyncMethodCallBatchPreprocessEnd(int) {}

  virtual void asyncMethodCallExecutionStart(const char*, const char*, int32_t) {}
  virtual void asyncMethodCallExecutionArgConversionStart(const char*, const char*, int32_t) {}
  virtual void asyncMethodCallExecutionArgConversionEnd(const char*, const char*, int32_t) {}
  virtual void asyncMethodCallExecutionEnd(const char*, const char*, int32_t) {}
  virtual void asyncMethodCallExecutionFail(const char*, const char*, int32_t) {}
};

} // namespace facebook::react
`,
  ],
  ['HermesPerfettoDataSource.cpp', `// Compatibility shim\n`],
  ['ReactPerfettoCategories.cpp', `// Compatibility shim\n`],
  ['ReactPerfetto.cpp', `// Compatibility shim\n`],
  ['ReactPerfettoLogger.cpp', `// Compatibility shim\n`],
  ['BridgeNativeModulePerfLogger.h', `#pragma once\n// Compatibility shim\n`],
  ['FuseboxPerfettoDataSource.h', `#pragma once\n// Compatibility shim\n`],
  ['HermesPerfettoDataSource.h', `#pragma once\n// Compatibility shim\n`],
  ['ReactPerfetto.h', `#pragma once\n// Compatibility shim\n`],
  ['ReactPerfettoCategories.h', `#pragma once\n// Compatibility shim\n`],
  ['ReactPerfettoLogger.h', `#pragma once\n// Compatibility shim\n`],
];

if (fs.existsSync(reactPerfLoggerDir)) {
  let reactPerfLoggerPatched = false;
  for (const [name, contents] of reactPerfLoggerFallbacks) {
    const absPath = path.join(reactPerfLoggerDir, name);
    if (ensureTextFile(absPath, contents)) {
      reactPerfLoggerPatched = true;
    }
  }

  const nativeModulePerfLoggerHeader = path.join(
      reactPerfLoggerDir,
      'NativeModulePerfLogger.h'
    );
  if (fs.existsSync(nativeModulePerfLoggerHeader)) {
    try {
      const bytes = fs.readFileSync(nativeModulePerfLoggerHeader);
      const reactPerfPublic = p(
        'ios',
        'Pods',
        'Headers',
        'Public',
        'reactperflogger',
        'reactperflogger',
        'NativeModulePerfLogger.h'
      );
      const reactPerfPrivate = p(
        'ios',
        'Pods',
        'Headers',
        'Private',
        'reactperflogger',
        'reactperflogger',
        'NativeModulePerfLogger.h'
      );
      ensureDir(path.dirname(reactPerfPublic));
      ensureDir(path.dirname(reactPerfPrivate));
      fs.writeFileSync(reactPerfPublic, bytes);
      fs.writeFileSync(reactPerfPrivate, bytes);
      reactPerfLoggerPatched = true;
    } catch (_) {}
  }

  if (reactPerfLoggerPatched) {
    changed = true;
    log(
      `[patch-node-modules-ios] Repaired missing reactperflogger files in: ${path.relative(
        root,
        reactPerfLoggerDir
      )}`
    );
  }
}

// ---- expo-updates-interface duplicate Swift declarations ----
const updatesExternalInterfaceSwift = p(
  'node_modules',
  'expo-updates-interface',
  'ios',
  'EXUpdatesInterface',
  'UpdatesExternalInterface.swift'
);
const updatesExternalInterfaceShim = `// Patched by scripts/patch-node-modules-ios.js
// expo-updates-interface 55.1.3 duplicates declarations that already exist in UpdatesInterface.swift.
// Keep this file present so CocoaPods/Xcode build inputs stay valid, but leave it empty.

import Foundation
import ExpoModulesCore
`;
if (
  replaceInFile(updatesExternalInterfaceSwift, (s) => {
    if (s === updatesExternalInterfaceShim) {
      return s;
    }
    return updatesExternalInterfaceShim;
  })
) {
  changed = true;
  log(
    `[patch-node-modules-ios] Replaced duplicate expo-updates-interface source with shim: ${path.relative(
      root,
      updatesExternalInterfaceSwift
    )}`
  );
}

// ---- expo-dev-menu duplicate Swift declarations ----
const devMenuDefaultWindowSwift = p(
  'node_modules',
  'expo-dev-menu',
  'ios',
  'DevMenuWindow-default.swift'
);
const devMenuPrimaryWindowSwift = p(
  'node_modules',
  'expo-dev-menu',
  'ios',
  'DevMenuWindow.swift'
);
const devMenuDefaultWindowShim = `// Patched by scripts/patch-node-modules-ios.js
// Keep this file present for CocoaPods/Xcode, but remove duplicate declarations.

import Foundation
`;
if (fs.existsSync(devMenuDefaultWindowSwift) && fs.existsSync(devMenuPrimaryWindowSwift)) {
  if (
    replaceInFile(devMenuDefaultWindowSwift, (s) => {
      if (s === devMenuDefaultWindowShim) {
        return s;
      }
      return devMenuDefaultWindowShim;
    })
  ) {
    changed = true;
    log(
      `[patch-node-modules-ios] Replaced duplicate expo-dev-menu source with shim: ${path.relative(
        root,
        devMenuDefaultWindowSwift
      )}`
    );
  }
}

// ---- expo-notifications legacy podspec ----
const expoNotificationsLegacyPodspec = p(
  'node_modules',
  'expo-notifications',
  'ios',
  'EXNotifications.podspec'
);
if (rmIfExists(expoNotificationsLegacyPodspec)) {
  changed = true;
  log(
    `[patch-node-modules-ios] Removed legacy expo-notifications podspec: ${path.relative(
      root,
      expoNotificationsLegacyPodspec
    )}`
  );
}

// ---- react-native-screens root scroll-view sources ----
const rnsRequiredFiles = [
  'RNSScrollViewFinder.h',
  'RNSScrollViewFinder.mm',
  'RNSScrollViewHelper.h',
  'RNSScrollViewHelper.mm',
];
const rnsHelperDir = p('node_modules', 'react-native-screens', 'ios', 'helpers', 'scroll-view');

for (const file of rnsRequiredFiles) {
  const rootTarget = p('node_modules', 'react-native-screens', 'ios', file);
  const helperSource = path.join(rnsHelperDir, file);

  if (!fs.existsSync(rootTarget)) {
    if (fs.existsSync(helperSource)) {
      try {
        fs.copyFileSync(helperSource, rootTarget);
        changed = true;
        log(`[patch-node-modules-ios] Restored react-native-screens file from helper source: ${path.relative(root, rootTarget)}`);
      } catch (_) {}
    } else {
      const backupSource = p('node_modules_backup', 'react-native-screens', 'ios', file);
      if (fs.existsSync(backupSource)) {
        try {
          fs.copyFileSync(backupSource, rootTarget);
          changed = true;
          log(`[patch-node-modules-ios] Restored react-native-screens file from backup: ${path.relative(root, rootTarget)}`);
        } catch (_) {}
      }
    }
  }

  if (fs.existsSync(rootTarget) && fs.existsSync(helperSource)) {
    try {
      fs.rmSync(helperSource, { force: true });
      changed = true;
      log(`[patch-node-modules-ios] Removed duplicate react-native-screens helper source: ${path.relative(root, helperSource)}`);
    } catch (_) {}
  }
}

// ---- expo CLI simulator prerequisite guard ----
const expoCliStartAsync = p(
  'node_modules',
  'expo',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'start',
  'startAsync.js'
);
if (
  replaceInFile(expoCliStartAsync, (s) =>
    s.replace(
      /_SimulatorAppPrerequisite\.SimulatorAppPrerequisite\.instance\.assertAsync\(\)\.catch\(\(\)=>\{\s*\/\/ noop -- this will be thrown again when the user attempts to open the project\.\s*\}\);/m,
      "const simulatorAppPrerequisite = _SimulatorAppPrerequisite.SimulatorAppPrerequisite == null ? void 0 : _SimulatorAppPrerequisite.SimulatorAppPrerequisite.instance;\n        simulatorAppPrerequisite == null ? void 0 : simulatorAppPrerequisite.assertAsync().catch(()=>{\n        // noop -- this will be thrown again when the user attempts to open the project.\n        });"
    )
  )
) {
  changed = true;
  log(`[patch-node-modules-ios] Patched expo CLI startAsync guard: ${path.relative(root, expoCliStartAsync)}`);
}

if (!changed) {
  log('[patch-node-modules-ios] No changes needed.');
}
