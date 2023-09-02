import { program } from "commander";
import * as fs from "fs";
import * as path from "path";
import { ProjectJson } from "./project";
import * as chalk from "chalk";
import { execProject } from "./bundle-to-disk";

const bail = (msg: string) => {
  console.error(chalk.red(msg));
  process.exit(1);
};

const readProjectJson = (projectPath: string): ProjectJson => {
  let file = "";
  try {
    file = fs.readFileSync(projectPath, "utf-8");
  } catch (e) {
    throw bail(
      `Failed to read JSON configuration file at ${projectPath}: ${e}`
    );
  }

  let projectJson: any;

  try {
    projectJson = JSON.parse(file);
  } catch (e) {
    throw bail(`Failed to parse bff.json: ${e}`);
  }

  if (!projectJson.router) {
    throw bail(`Field "router" not found in bff.json`);
  }
  if (!projectJson.outputDir) {
    throw bail(`Field "outputDir" not found in bff.json`);
  }

  return {
    router: String(projectJson.router),
    outputDir: String(projectJson.outputDir),
    module: projectJson.module,
  };
};

const getProjectPath = (projectPath: string | undefined): string => {
  if (projectPath == null) {
    return path.join(process.cwd(), "bff.json");
  }
  if (projectPath.startsWith("/")) {
    return projectPath;
  }
  return path.join(process.cwd(), projectPath);
};

export const commanderExec = () => {
  const start = Date.now();
  program.option("-p, --project <string>");
  program.option("-v, --verbose");
  program.parse();
  const options = program.opts();
  const projectPath = getProjectPath(options.project);
  const projectJson = readProjectJson(projectPath);

  execProject(projectPath, projectJson, options.verbose ?? false);

  const end = Date.now();
  const duration = end - start;
  console.log(chalk.green(`Finished in ${duration}ms`));
};
