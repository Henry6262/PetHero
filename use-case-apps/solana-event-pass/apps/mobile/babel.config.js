module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          native: {
            // Force full Babel transforms so private class fields (#prop) and
            // other modern syntax are compiled down before reaching Hermes/JSC.
            // This prevents "private properties are not supported" on older engines.
            unstable_transformProfile: 'default',
          },
        },
      ],
    ],
    plugins: ['@babel/plugin-transform-class-static-block'],
  };
};
