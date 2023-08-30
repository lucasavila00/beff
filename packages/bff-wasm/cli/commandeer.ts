import { program } from "commander";
import { Bundler } from "./bundler";
import fs from "fs";
import path from "path";
const readProjectJson = (projectPath: string) => {
  const projectJson = JSON.parse(fs.readFileSync(projectPath, "utf-8"));
  return projectJson;
};

const execProject = (absoluteProjectPath: string) => {
  const projectJson = readProjectJson(absoluteProjectPath);
  const router = projectJson.router;
  const absoluteEntryPoint = path.join(
    path.dirname(absoluteProjectPath),
    router
  );

  const bundler = new Bundler();
  const outString = bundler.bundle(absoluteEntryPoint);

  const absoluteOutDir = path.join(
    path.dirname(absoluteProjectPath),
    projectJson.outputDir
  );
  const outputFile = `${absoluteOutDir}/index.js`;
  fs.writeFileSync(outputFile, outString);
};

const getAbsolutePathOfProject = (p: string) => {
  return p;
};

export const commanderExec = () => {
  program.requiredOption("-p, --project <string>");
  program.parse();
  const options = program.opts();
  const absoluteProjectPath = getAbsolutePathOfProject(options.project);
  return execProject(absoluteProjectPath);
};
