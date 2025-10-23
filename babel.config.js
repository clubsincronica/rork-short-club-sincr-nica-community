module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Ensure Hermes compatibility
      [
        'babel-plugin-syntax-hermes-parser',
        {
          flow: 'strip',
        },
      ],
    ],
  };
};