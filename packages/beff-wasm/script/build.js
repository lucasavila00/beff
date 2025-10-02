//@ts-check
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const util = require("util");

const execAsync = util.promisify(childProcess.exec);

const isDebug = process.env.DEBUG === "true";

const deleteComments = (code) => {
  return code.replace(/\/\/.*/g, "").replace(/\/\*.*\*\//g, "");
};

const makeJsBundle = () => {
  const allFiles = fs.readdirSync(path.join(__dirname, "../bundled-code"));
  const jsFiles = allFiles.filter((f) => f.endsWith(".js") || f.endsWith("d.ts"));
  const jsBundle = jsFiles.map((f) => [
    f,
    deleteComments(fs.readFileSync(path.join(__dirname, "../bundled-code", f), "utf-8")),
  ]);
  const bundle = Object.fromEntries(jsBundle);
  const folder = path.join(__dirname, "../ts-node/generated");
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  fs.writeFileSync(path.join(folder, "bundle.ts"), `export default ${JSON.stringify(bundle)}`);
};

const main = async () => {
  await makeJsBundle();

  const mode = isDebug ? "--dev" : "--release";

  const cmds = {
    "build-rust": `wasm-pack build ${mode} --target nodejs`,
    "build-cli":
      "esbuild ts-node/commandeer.ts --bundle --outfile=dist-cli/cli.js --platform=node --target=node14 --external:pnpapi --external:./pkg/beff_wasm.js --external:./pkg/beff_wasm_bg.js",
    "copy-cli":
      "cp -r ./dist-cli/. ../beff-cli/dist-cli && cp -r ./pkg/. ../beff-cli/pkg/ && rm ../beff-cli/pkg/.gitignore",
  };

  for (const [name, cmd] of Object.entries(cmds)) {
    console.log(name);
    await execAsync(cmd);
  }
};

main();
