module.exports = {
  configureWebpack: {
    devtool: "source-map",
  },
  publicPath:
    process.env.NODE_ENV === "production"
      ? "/" + process.env.CI_PROJECT_NAME + "/"
      : "/",
};
