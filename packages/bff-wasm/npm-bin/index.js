const { commanderExec } = require("../dist-cli/cli.js");

const start = Date.now();
commanderExec()
  .then(() => {
    const end = Date.now();
    const d = new Date();

    console.log(
      `${d.getSeconds()}:${d.getMilliseconds()} - npm-bin: ${end - start}ms`
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
