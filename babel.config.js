module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      '@react-native/babel-preset',
      '@babel/preset-typescript',
    ],
    plugins: [
      '@babel/plugin-transform-react-jsx',
    ],
  };
};
