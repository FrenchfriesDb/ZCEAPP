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
 *    so we remove the duplicate legacy source.
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

// ---- expo-updates-interface duplicate Swift declarations ----
const updatesExternalInterfaceSwift = p(
  'node_modules',
  'expo-updates-interface',
  'ios',
  'EXUpdatesInterface',
  'UpdatesExternalInterface.swift'
);
if (rmIfExists(updatesExternalInterfaceSwift)) {
  changed = true;
  log(
    `[patch-node-modules-ios] Removed duplicate expo-updates-interface source: ${path.relative(
      root,
      updatesExternalInterfaceSwift
    )}`
  );
}

if (!changed) {
  log('[patch-node-modules-ios] No changes needed.');
}
