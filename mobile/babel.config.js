module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          reanimated: false,
          worklets: false,
        },
      ],
    ],
    plugins: ['@babel/plugin-syntax-import-meta'],
  };
};
