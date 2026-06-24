module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
   plugins: [
      // ... your other plugins if any (like nativewind)
      'react-native-reanimated/plugin', // Must be listed last!
    ],
  };
};
