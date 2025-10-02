export type BeffCustomFormat = {
  name: string;
};

export type BeffUserSettings = {
  stringFormats: BeffCustomFormat[];
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
};
export const parseUserSettings = (settings: any): BeffUserSettings => {
  if (settings == null) {
    return EMPTY_SETTINGS;
  }
  return {
    stringFormats: settings.stringFormats ?? [],
  };
};
