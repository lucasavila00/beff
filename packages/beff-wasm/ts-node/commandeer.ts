import { program } from "commander";
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

  if (!projectJson.router && !projectJson.parser) {
    throw bail(`Field "router" or "parser" not found in bff.json`);
  }
  if (!projectJson.outputDir) {
    throw bail(`Field "outputDir" not found in bff.json`);
  }

  return {
    router: projectJson.router == null ? projectJson.router : String(projectJson.router),
    parser: projectJson.parser == null ? projectJson.parser : String(projectJson.parser),
    outputDir: String(projectJson.outputDir),
    module: projectJson.module,
    settings: parseUserSettings(projectJson),
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
  const start = Date.now();
  program.option("-p, --project <string>");
  program.option("-v, --verbose");
  program.option("-w, --watch");
  program.parse();
  const options = program.opts();
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
