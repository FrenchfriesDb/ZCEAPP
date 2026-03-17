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
const expoImageRoot = p('node_modules', 'expo-image', 'ios');
const expoImageUtils = p('node_modules', 'expo-image', 'ios', 'Utils');
const expoImageDuplicates = ['Blurhash.swift', 'ImageUtils.swift', 'Thumbhash.swift'];

if (fs.existsSync(expoImageRoot) && fs.existsSync(expoImageUtils)) {
  for (const filename of expoImageDuplicates) {
    const keep = path.join(expoImageUtils, filename);
    const dup = path.join(expoImageRoot, filename);
    // Only remove the duplicate if a Utils version exists.
    if (fs.existsSync(keep) && fs.existsSync(dup)) {
      const removed = rmIfExists(dup);
      if (removed) {
        changed = true;
        log(`[patch-node-modules-ios] Removed duplicate expo-image source: ${path.relative(root, dup)}`);
      }
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

