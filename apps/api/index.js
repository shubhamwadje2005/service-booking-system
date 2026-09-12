// Universal entry point for Vercel Node runtime
const app = (() => {
  try {
    return require("./dist/index.js");
  } catch (err) {
    try {
      require("tsx");
      return require("./src/index.ts");
    } catch (e) {
      throw err;
    }
  }
})();

module.exports = app.default || app;
