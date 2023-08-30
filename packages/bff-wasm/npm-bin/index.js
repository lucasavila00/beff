const { commanderExec } = require("../dist-cli/cli.js");
commanderExec().catch((e) => {
  console.error(e);
  process.exit(1);
});
