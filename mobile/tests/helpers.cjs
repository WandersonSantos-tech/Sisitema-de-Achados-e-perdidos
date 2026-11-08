const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  babel = require("@babel/core");
function load(relative, mocks = {}, globals = {}) {
  const filename = path.resolve(__dirname, "..", relative);
  const code = babel.transformSync(fs.readFileSync(filename, "utf8"), {
    babelrc: false,
    configFile: false,
    plugins: ["@babel/plugin-transform-modules-commonjs"],
    presets: relative.endsWith(".jsx") ? ["@babel/preset-react"] : [],
  }).code;
  const module = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (name) =>
        Object.hasOwn(mocks, name) ? mocks[name] : require(name),
      process,
      console,
      setTimeout,
      clearTimeout,
      AbortController,
      FormData,
      URL,
      ...globals,
    },
    { filename },
  );
  return module.exports;
}
module.exports = { load };
