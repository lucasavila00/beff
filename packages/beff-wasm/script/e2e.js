//@ts-check
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const util = require("util");
const PQueue = require("p-queue").default;
const execAsync = util.promisify(childProcess.exec);

const removePathFromLog = (content) => {
  const p = path.join(__dirname, "../fixtures");
  return content.replaceAll(p, "");
};

const binPath = "../../beff-cli/bin/index.js";

const oneCodegenSnap = (subFolder) => async () => {
  const bin = path.join(__dirname, binPath);
  const p = path.join(__dirname, "../fixtures/codegen-snaps", subFolder, "bff.json");
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

const oneFuture = (subFolder) => async () => {
  const bin = path.join(__dirname, binPath);
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
      removePathFromLog(stderr)
    );

    fs.writeFileSync(
      path.join(__dirname, "../fixtures/future", subFolder, "stdout.log"),
      removePathFromLog(stdout)
    );
  }
};
const oneFailure = (subFolder) => async () => {
  const bin = path.join(__dirname, binPath);
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
      removePathFromLog(stderr)
    );

    fs.writeFileSync(
      path.join(__dirname, "../fixtures/errors", subFolder, "stdout.log"),
      removePathFromLog(stdout)
    );
  }
};
const oneVitest = (subFolder) => async () => {
  const bin = path.join(__dirname, binPath);
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

const vitest = () => {
  const subFolders = fs.readdirSync(path.join(__dirname, "../vitest"));
  const folders = subFolders.filter((f) => f !== ".gitignore" && !f.endsWith(".d.ts"));
  return folders.map(oneVitest);
};

const failures = () => {
  const subFolders = fs.readdirSync(path.join(__dirname, "../fixtures/errors"));
  return subFolders.map(oneFailure);
};

const futures = () => {
  const subFolders = fs.readdirSync(path.join(__dirname, "../fixtures/future"));
  return subFolders.map(oneFuture);
};

const codegenSnaps = () => {
  const subFolders = fs.readdirSync(path.join(__dirname, "../fixtures/codegen-snaps"));

  return subFolders.map(oneCodegenSnap);
};

const main = async () => {
  const queue = new PQueue({ concurrency: 8 });
  await queue.addAll([...codegenSnaps(), ...failures(), ...vitest(), ...futures()]);

  await queue.onIdle();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
