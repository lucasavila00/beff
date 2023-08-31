import { program } from "commander";
import { Bundler } from "./bundler";
import * as fs from "fs";
import * as path from "path";
import { readProjectJson } from "./project";
import * as chalk from "chalk";

export const commanderExec = () => {
  const start = Date.now();
  program.requiredOption("-p, --project <string>");
  program.option("-v, --verbose");
  program.parse();
  const options = program.opts();
  const projectPath = options.project;
  const projectJson = readProjectJson(projectPath);
  const router = projectJson.router;
  const bundler = new Bundler(options.verbose ?? false);
  const entryPoint = path.join(path.dirname(projectPath), router);
  const outString = bundler.bundle(entryPoint);
  if (outString == null) {
    process.exit(1);
  }
  const outputDir = path.join(path.dirname(projectPath), projectJson.outputDir);
  const outputFile = `${outputDir}/index.js`;
  fs.writeFileSync(outputFile, outString);
  const end = Date.now();
  const duration = end - start;
  console.log(chalk.green(`Finished in ${duration}ms`));
};
