const { commanderExec } = require("../dist-cli/cli.js");

const start = Date.now();
commanderExec()
  .then(() => {
    const end = Date.now();
    console.log(`npm-bin: ${end - start}ms`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
