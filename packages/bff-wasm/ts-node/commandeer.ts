import { program } from "commander";
import { Bundler } from "./bundler";
import * as fs from "fs";
import * as path from "path";
import { readProjectJson } from "./project";

export const commanderExec = () => {
  program.requiredOption("-p, --project <string>");
  program.parse();
  const options = program.opts();
  const projectPath = options.project;
  const projectJson = readProjectJson(projectPath);
  const router = projectJson.router;
  const bundler = new Bundler();
  const entryPoint = path.join(path.dirname(projectPath), router);
  const outString = bundler.bundle(entryPoint);
  if (outString == null) {
    return;
  }
  const outputDir = path.join(path.dirname(projectPath), projectJson.outputDir);
  const outputFile = `${outputDir}/index.js`;
  fs.writeFileSync(outputFile, outString);
};
