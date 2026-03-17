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

if (!changed) {
  log('[patch-node-modules-ios] No changes needed.');
}
