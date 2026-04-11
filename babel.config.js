module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['@react-native/babel-preset'],
    plugins: [
      // Required for expo-router (using babel-preset-expo instead)
    ],
  };
};
