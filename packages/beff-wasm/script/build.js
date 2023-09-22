//@ts-check
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const util = require("util");

const execAsync = util.promisify(childProcess.exec);

const isDebug = process.env.DEBUG === "true";
const main = async () => {
  const mode = isDebug ? "--dev" : "--release";

  const cmds = {
    "build-rust": `wasm-pack build ${mode} --target nodejs`,
    "build-cli":
      "esbuild ts-node/commandeer.ts --bundle --outfile=dist-cli/cli.js --platform=node --target=node14 --external:pnpapi --external:./pkg/beff_wasm.js --external:./pkg/beff_wasm_bg.js",
    "build-ext":
      "esbuild ts-node/extension.ts --bundle --outfile=dist-ext/extension.js --platform=node --target=node14 --external:pnpapi --external:vscode --external:./pkg/beff_wasm.js --external:./pkg/beff_wasm_bg.js",
    "copy-cli":
      "cp -r ./dist-cli/. ../beff-cli/dist-cli && cp -r ./pkg/. ../beff-cli/pkg/ && rm ../beff-cli/pkg/.gitignore",
  };

  for (const [name, cmd] of Object.entries(cmds)) {
    console.log(name);
    await execAsync(cmd);
  }
};

main();
