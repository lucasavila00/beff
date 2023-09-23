export type BeffCustomFormat = {
  name: string;
};

export type BeffUserSettings = {
  customFormats: BeffCustomFormat[];
};
export type ProjectJson = {
  router?: string;
  parser?: string;
  outputDir: string;
  module: ProjectModule | undefined;
  settings: BeffUserSettings;
};

export type ProjectModule = "cjs" | "esm";

const EMPTY_SETTINGS: BeffUserSettings = {
  customFormats: [],
};
export const parseUserSettings = (settings: any): BeffUserSettings => {
  if (settings == null) {
    return EMPTY_SETTINGS;
  }
  return {
    customFormats: settings.customFormats ?? [],
  };
};
