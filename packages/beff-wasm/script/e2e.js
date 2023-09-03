//@ts-check
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const util = require("util");

const execAsync = util.promisify(childProcess.exec);
const oneCodegenSnap = async (subFolder) => {
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
};

const oneFuture = async (subFolder) => {
  const bin = path.join(__dirname, "../npm-bin/index.js");
  const p = path.join(__dirname, "../fixtures/future", subFolder, "bff.json");
  const command = `node ${bin} -p ${p}`;
  console.log(command);
  try {
    await execAsync(command);
    throw "should fail";
  } catch (e) {
    if (e == "should fail") {
      console.error(`should fail ${subFolder}`);
      throw e;
    }

    const stderr = e.stderr.trim();
    const stdout = e.stdout.trim();
    if (!stderr) {
      console.error(stderr);
      throw new Error("stderr is empty");
    }
    fs.writeFileSync(
      path.join(__dirname, "../fixtures/future", subFolder, "stderr.log"),
      stderr
    );

    fs.writeFileSync(
      path.join(__dirname, "../fixtures/future", subFolder, "stdout.log"),
      stdout
    );
  }
};
const oneFailure = async (subFolder) => {
  const bin = path.join(__dirname, "../npm-bin/index.js");
  const p = path.join(__dirname, "../fixtures/errors", subFolder, "bff.json");
  const command = `node ${bin} -p ${p}`;
  console.log(command);
  try {
    await execAsync(command);
    throw "should fail";
  } catch (e) {
    if (e == "should fail") {
      console.error(`should fail ${subFolder}`);
      throw e;
    }

    const stderr = e.stderr.trim();
    const stdout = e.stdout.trim();
    if (!stderr) {
      console.error(stderr);
      throw new Error("stderr is empty");
    }
    fs.writeFileSync(
      path.join(__dirname, "../fixtures/errors", subFolder, "stderr.log"),
      stderr
    );

    fs.writeFileSync(
      path.join(__dirname, "../fixtures/errors", subFolder, "stdout.log"),
      stdout
    );
  }
};
const oneVitest = async (subFolder) => {
  const bin = path.join(__dirname, "../npm-bin/index.js");
  const p = path.join(__dirname, "../vitest", subFolder, "bff.json");
  const command = `node ${bin} -p ${p}`;
  console.log(command);
  const result = await execAsync(command);
  console.log(result.stdout.trim());

  const stderr = result.stderr.trim();
  if (stderr) {
    console.error(stderr);
    throw new Error("stderr is not empty");
  }
};

const vitest = async () => {
  const subFolders = fs.readdirSync(path.join(__dirname, "../vitest"));
  const folders = subFolders.filter((f) => f !== ".gitignore");
  await Promise.all(folders.map(oneVitest));
};

const failures = async () => {
  const subFolders = fs.readdirSync(path.join(__dirname, "../fixtures/errors"));
  await Promise.all(subFolders.map(oneFailure));
};

const futures = async () => {
  const subFolders = fs.readdirSync(path.join(__dirname, "../fixtures/future"));
  await Promise.all(subFolders.map(oneFuture));
};

const codegenSnaps = async () => {
  const subFolders = fs.readdirSync(
    path.join(__dirname, "../fixtures/codegen-snaps")
  );

  await Promise.all(subFolders.map(oneCodegenSnap));
};
const main = async () => {
  await Promise.all([codegenSnaps(), failures(), vitest(), futures()]);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
