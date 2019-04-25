module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        target: "node"
      },
      "@babel/preset-es2015"
    ]
  ],
  plugins: ["@babel/plugin-syntax-dynamic-import"],
  retainLines: true,
  comments: true
};
