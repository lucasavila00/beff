import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { ProjectJson, parseUserSettings } from "./project";
import * as chalk from "chalk";
import { execProject } from "./bundle-to-disk";
import { Bundler } from "./bundler";
import chokidar from "chokidar";
const bail = (msg: string) => {
  console.error(chalk.red(msg));
  process.exit(1);
};

const readProjectJson = (projectPath: string): ProjectJson => {
  let file = "";
  try {
    file = fs.readFileSync(projectPath, "utf-8");
  } catch (e) {
    throw bail(`Failed to read JSON configuration file at ${projectPath}: ${e}`);
  }

  let projectJson: any;

  try {
    projectJson = JSON.parse(file);
  } catch (e) {
    throw bail(`Failed to parse bff.json: ${e}`);
  }

  if (!projectJson.parser) {
    throw bail(`Field or "parser" not found in bff.json`);
  }
  if (!projectJson.outputDir) {
    throw bail(`Field "outputDir" not found in bff.json`);
  }

  return {
    parser: projectJson.parser == null ? projectJson.parser : String(projectJson.parser),
    outputDir: String(projectJson.outputDir),
    module: projectJson.module,
    settings: parseUserSettings(projectJson),
    codegen: projectJson.codegen == null ? 2 : projectJson.codegen === 2 ? 2 : 1,
  };
};

const getProjectPath = (projectPath: string | undefined): string => {
  if (projectPath == null) {
    //TODO: beff.json
    return path.join(process.cwd(), "bff.json");
  }
  if (projectPath.startsWith("/")) {
    return projectPath;
  }
  return path.join(process.cwd(), projectPath);
};

const watching: Record<string, boolean> = {};
export const commanderExec = () => {
  const program = new Command();

  const start = Date.now();
  const command = program
    .name("beff")
    .description("Generate validators from TypeScript types")
    .option("-p, --project <string>", "Path to the project file")
    .option("-v, --verbose", "Print verbose output")
    .option("-w, --watch", "Watch for file changes")
    .parse();
  const options = command.opts();
  const projectPath = getProjectPath(options.project);
  const projectJson = readProjectJson(projectPath);
  const verbose = options.verbose ?? false;
  const bundler = new Bundler(verbose);

  const exec = () => execProject(bundler, projectPath, projectJson, verbose);

  // if watch mode, start watching the files that are imported by the entry point
  if (options.watch) {
    const updateFile = (path: string) => {
      console.log(chalk.green(`File changed: ${path}`));
      try {
        const newContent = fs.readFileSync(path, "utf-8");
        bundler?.updateFileContent(path, newContent);
        exec();
      } catch (e) {
        console.error(e);
      }
    };
    bundler.onFileRead((path) => {
      if (watching[path]) {
        return;
      }
      watching[path] = true;
      chokidar.watch(path).on("change", updateFile);
    });
    exec();
  } else {
    const res = exec();
    if (res == "failed") {
      process.exit(1);
    }
  }

  const end = Date.now();
  const duration = end - start;
  console.log(chalk.green(`Finished in ${duration}ms`));
};
