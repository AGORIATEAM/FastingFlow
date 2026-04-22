module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // babel-preset-expo auto-loads reanimated plugin, which requires
          // react-native-worklets that is unavailable in Jest's Node env
          reanimated: !isTest,
        },
      ],
    ],
    plugins: isTest ? [] : ['react-native-reanimated/plugin'],
  };
};
