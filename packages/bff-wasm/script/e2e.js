const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const util = require("util");

const execAsync = util.promisify(childProcess.exec);
const codegenSnaps = async () => {
  const subFolders = fs.readdirSync(
    path.join(__dirname, "../fixtures/codegen-snaps")
  );
  for (const subFolder of subFolders) {
    const bin = path.join(__dirname, "../npm-bin/index.js");
    const p = path.join(
      __dirname,
      "../fixtures/codegen-snaps",
      subFolder,
      "bff.json"
    );
    const command = `node ${bin} -p ${p}`;
    console.log(command);
    const result = await execAsync(command);
    console.log(result.stdout.trim());

    const stderr = result.stderr.trim();
    if (stderr) {
      console.error(stderr);
      throw new Error("stderr is not empty");
    }
  }
};
const failures = async () => {
  const subFolders = fs.readdirSync(path.join(__dirname, "../fixtures/errors"));
  for (const subFolder of subFolders) {
    const bin = path.join(__dirname, "../npm-bin/index.js");
    const p = path.join(__dirname, "../fixtures/errors", subFolder, "bff.json");
    const command = `node ${bin} -p ${p}`;
    console.log(command);
    try {
      await execAsync(command);
      throw "should fail";
    } catch (e) {
      if (e == "should fail") throw e;

      const stderr = e.stderr.trim();
      const stdout = e.stdout.trim();
      if (!stderr) {
        console.error(stderr);
        throw new Error("stderr is empty");
      }
    }

    // fs.writeFileSync(
    //   path.join(__dirname, "../fixtures/errors", subFolder, "bff.stderr"),
    //   stderr
    // );

    // fs.writeFileSync(
    //   path.join(__dirname, "../fixtures/errors", subFolder, "bff.stdout"),
    //   stdout
    // );
  }
};

const main = async () => {
  await codegenSnaps();
  await failures();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
