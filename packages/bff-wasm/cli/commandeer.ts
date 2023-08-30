import { program } from "commander";
import { Bundler } from "./bundler";
import fs from "fs";
import path from "path";
const readProjectJson = (projectPath: string) => {
  const projectJson = JSON.parse(fs.readFileSync(projectPath, "utf-8"));
  return projectJson;
};

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
  const outputDir = path.join(path.dirname(projectPath), projectJson.outputDir);
  const outputFile = `${outputDir}/index.js`;
  fs.writeFileSync(outputFile, outString);
};
