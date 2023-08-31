const { commanderExec } = require("../dist-cli/cli.js");

const start = Date.now();
try {
  commanderExec();
} catch (e) {
  throw e;
} finally {
  const end = Date.now();
  const d = new Date();
  if (globalThis.verbose) {
    console.log(
      `${d.getSeconds()}:${d.getMilliseconds()} - npm-bin: ${end - start}ms`
    );
  }
}
