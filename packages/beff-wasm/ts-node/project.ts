export type ProjectJson = {
  router: string;
  outputDir: string;
  module: ProjectModule | undefined;
};

export type ProjectModule = "cjs" | "esm";
