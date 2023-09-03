export type ProjectJson = {
  router?: string;
  parser?: string;
  outputDir: string;
  module: ProjectModule | undefined;
};

export type ProjectModule = "cjs" | "esm";
