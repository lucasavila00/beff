const { commanderExec } = require("../dist-cli/cli.js");

const start = Date.now();
commanderExec();
const end = Date.now();
const d = new Date();
console.log(
  `${d.getSeconds()}:${d.getMilliseconds()} - npm-bin: ${end - start}ms`
);
