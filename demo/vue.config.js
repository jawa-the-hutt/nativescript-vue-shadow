module.exports = {
  chainWebpack: (config) => {
    // for debugging the project
    config.devtool('inline-source-map');
  },
  runtimeCompiler: true
};
