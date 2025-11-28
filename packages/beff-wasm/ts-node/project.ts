export type BeffCustomFormat = {
  name: string;
};

export type BeffUserSettings = {
  stringFormats: BeffCustomFormat[];
  numberFormats: BeffCustomFormat[];
  frontendVersion: "v1" | "v2";
};
export type ProjectJson = {
  parser?: string;
  outputDir: string;
  module: ProjectModule | undefined;
  settings: BeffUserSettings;
};

export type ProjectModule = "cjs" | "esm";

const EMPTY_SETTINGS: BeffUserSettings = {
  stringFormats: [],
  numberFormats: [],
  frontendVersion: "v1",
};
export const parseUserSettings = (settings: any): BeffUserSettings => {
  if (settings == null) {
    return EMPTY_SETTINGS;
  }
  return {
    stringFormats: settings.stringFormats ?? [],
    numberFormats: settings.numberFormats ?? [],
    frontendVersion: settings.frontendVersion ?? "v1",
  };
};
