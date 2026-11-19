type BeffCustomFormat = {
  name: string;
};

export type BeffUserSettings = {
  stringFormats: BeffCustomFormat[];
  numberFormats: BeffCustomFormat[];
  // `codegen.maxValidateFunctionSize`. Undefined uses the compiler's default.
  maxValidateFunctionSize: number | undefined;
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
  maxValidateFunctionSize: undefined,
};
export const parseUserSettings = (settings: any): BeffUserSettings => {
  if (settings == null) {
    return EMPTY_SETTINGS;
  }
  return {
    stringFormats: settings.stringFormats ?? [],
    numberFormats: settings.numberFormats ?? [],
    maxValidateFunctionSize: parseMaxValidateFunctionSize(settings.codegen?.maxValidateFunctionSize),
  };
};

const parseMaxValidateFunctionSize = (value: unknown): number | undefined => {
  if (value == null) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      `"codegen.maxValidateFunctionSize" must be a non-negative integer, got ${JSON.stringify(value)}`,
    );
  }
  return value;
};
