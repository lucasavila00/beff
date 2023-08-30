import { program } from "commander";
import { Bundler } from "./bundler";
import fs from "fs/promises";
import path from "path";
const readProjectJson = async (projectPath: string) => {
  const projectJson = JSON.parse(await fs.readFile(projectPath, "utf-8"));
  return projectJson;
};

const execProject = async (absoluteProjectPath: string) => {
  const projectJson = await readProjectJson(absoluteProjectPath);
  const router = projectJson.router;
  const absoluteEntryPoint = path.join(
    path.dirname(absoluteProjectPath),
    router
  );

  const bundler = new Bundler();
  const outString = await bundler.bundle(absoluteEntryPoint);

  const absoluteOutDir = path.join(
    path.dirname(absoluteProjectPath),
    projectJson.outputDir
  );
  const outputFile = `${absoluteOutDir}/index.js`;
  await fs.writeFile(outputFile, outString);
};

const getAbsolutePathOfProject = (p: string) => {
  return p;
};

export const commanderExec = async () => {
  program.requiredOption("-p, --project <string>");
  program.parse();
  const options = program.opts();
  const absoluteProjectPath = getAbsolutePathOfProject(options.project);
  return execProject(absoluteProjectPath);
};
