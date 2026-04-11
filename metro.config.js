// Node 18 fallback for Metro internals that expect Array.prototype.toReversed (Node 20+).
if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value: function toReversed() {
      return [...this].reverse();
    },
    writable: true,
    configurable: true,
  });
}

const { getDefaultConfig } = require('expo/metro-config');
const exclusionListModule = require('./node_modules/metro-config/src/defaults/exclusionList');
const exclusionList = exclusionListModule && exclusionListModule.default ? exclusionListModule.default : exclusionListModule;

const config = getDefaultConfig(__dirname);

// Hard-disable Watchman for this project due local watchman daemon deadlock.
config.resolver.useWatchman = false;

const ignoredFolders = [
  /.*\/node_modules_backup\/.*/,
  /.*\/fluent-emoji-main\/.*/,
  /.*\/\.git\/.*/,
  /.*\/ios\/Pods\/.*/,
  /.*\/ios\/build\/.*/,
  /.*\/android\/build\/.*/,
  /.*\/android\/app\/build\/.*/,
  /.*\/android\/\.gradle\/.*/,
  /.*\/\.expo\/.*/,
  /.*\/node_modules\/resolve 4\/.*/,
  /.*\/node_modules\/\.expo-image .*/,
  /.*\/node_modules\/\.expo-modules-core .*/,
  /.*\/node_modules\/\.react-native-web .*/,
];

config.resolver.blockList = exclusionList(ignoredFolders);
config.watchFolders = [__dirname];

module.exports = config;
