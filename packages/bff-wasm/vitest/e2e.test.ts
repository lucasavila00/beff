import { it, expect } from "vitest";
import fs from "fs";
import path from "path";
import childProcess from "child_process";
import util from "util";

const execAsync = util.promisify(childProcess.exec);

it("codegen-snaps", async () => {
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
    const result = await execAsync(command);
    console.log(result.stdout.trim());

    const stderr = result.stderr.trim();
    if (stderr) {
      console.error(stderr);
      throw new Error("stderr is not empty");
    }
  }
});
