import * as fs from "fs";
export const readProjectJson = (projectPath: string) => {
  const projectJson = JSON.parse(fs.readFileSync(projectPath, "utf-8"));
  return projectJson;
};
