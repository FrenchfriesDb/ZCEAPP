module.exports = function(api) {
  api.cache(true);
  return {
    // Keep Expo's preset so RN codegen/babel versions match the Expo SDK.
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
