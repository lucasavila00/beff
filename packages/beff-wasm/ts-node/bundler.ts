import * as wasm from "../pkg/beff_wasm";
import * as fs from "fs";
import * as path from "path";
// import { resolveModuleName } from "./tsc-slim/out";
import {
  resolveModuleName,
  sys as tsSys,
  findConfigFile,
  readConfigFile,
  parseJsonConfigFileContent,
} from "./tsc-slim/out";
import { codeFrameColumns } from "@babel/code-frame";
import * as chalk from "chalk";
import { BeffUserSettings } from "./project";
interface ModuleResolutionHost {
  fileExists(fileName: string): boolean;
  readFile(fileName: string): string | undefined;
  trace?(s: string): void;
  directoryExists?(directoryName: string): boolean;
  /**
   * Resolve a symbolic link.
   * @see https://nodejs.org/api/fs.html#fs_fs_realpathsync_path_options
   */
  realpath?(path: string): string;
  getCurrentDirectory?(): string;
  getDirectories?(path: string): string[];
  useCaseSensitiveFileNames?: boolean | (() => boolean) | undefined;
}

const host: ModuleResolutionHost = {
  fileExists: (file_name: string) => {
    return fs.existsSync(file_name);
  },
  readFile: function (fileName: string): string | undefined {
    return fs.readFileSync(fileName, "utf-8");
  },
};

let compilerOptionsCache: any = null;
const resolveCompilerOptions = () => {
  if (compilerOptionsCache) {
    return compilerOptionsCache;
  }

  // Find tsconfig.json file
  const tsconfigPath = findConfigFile(process.cwd(), tsSys.fileExists, "tsconfig.json");

  if (!tsconfigPath) {
    return {};
  }

  // Read tsconfig.json file
  const tsconfigFile = readConfigFile(tsconfigPath, tsSys.readFile);

  // Resolve extends
  const parsedTsconfig = parseJsonConfigFileContent(tsconfigFile.config, tsSys, path.dirname(tsconfigPath));

  compilerOptionsCache = parsedTsconfig.options;
  return compilerOptionsCache;
};
const resolveImportNoCache = (file_name: string, mod: string): string | undefined => {
  const resolved = resolveModuleName(mod, file_name, resolveCompilerOptions(), host);
  if ((globalThis as any).verbose) {
    console.log(
      `JS: Resolved -import ? from '${mod}'- at ${file_name} => ${resolved.resolvedModule?.resolvedFileName}`,
    );
  }
  return resolved.resolvedModule?.resolvedFileName;
};

const resolvedCache: Record<string, Record<string, string | undefined>> = {};

const resolveImport = (file_name: string, mod: string): string | undefined => {
  const cached = resolvedCache?.[file_name]?.[mod];
  if (cached) {
    return cached;
  }

  const result = resolveImportNoCache(file_name, mod);
  if (result) {
    resolvedCache[file_name] = resolvedCache[file_name] || {};
    resolvedCache[file_name][mod] = result;
  }
  return result;
};

const fsCache: Record<string, string> = {};
const getRawLines = (fileName: string): string | undefined => {
  if (fsCache[fileName]) {
    return fsCache[fileName];
  }
  try {
    const rawLines = fs.readFileSync(fileName, "utf-8");
    fsCache[fileName] = rawLines;
    return rawLines;
  } catch (e) {
    return undefined;
  }
};
const emitDiagnosticInfo = (data: WasmDiagnosticInformation, padding: string) => {
  if (data.UnknownFile) {
    const diag = data.UnknownFile;
    console.error(padding + chalk.red(`${diag.current_file}`));
    console.error(padding + diag.message);
    console.error("");
    return;
  }
  const diag = data.KnownFile;
  const line = diag.line_lo;
  const col = diag.col_lo + 1;
  const location = {
    start: { line: diag.line_lo, column: diag.col_lo + 1 },
    end: { line: diag.line_hi, column: diag.col_hi + 1 },
  };

  const rawLines = getRawLines(diag.file_name);
  if (rawLines == null) {
    console.error(`File not found while reporting error: ${diag.file_name}`);
    return;
  }
  const result = codeFrameColumns(rawLines, location, {
    message: diag.message,
    highlightCode: true,
  });

  const resultWithPadding = result

    .split("\n")
    .map((line) => padding + line)
    .join("\n");

  console.error(padding + `${diag.file_name}:${line}:${col}`);
  console.error(resultWithPadding);
  console.error("");
};

const emitDiagnosticItem = (data: WasmDiagnosticItem) => {
  if ((data.message ?? "").length > 0) {
    console.error(chalk.red.bold("Error: " + data.message));
  } else {
    if (data.cause.UnknownFile) {
      console.error(chalk.red.bold("Error"));
    } else {
      console.error(chalk.red.bold("Error: " + data.cause.KnownFile.message));
    }
  }
  emitDiagnosticInfo(data.cause, " ".repeat(1));

  const inf = data.related_information ?? [];
  if (inf.length == 0) {
    return;
  }
  inf.forEach((data) => {
    console.error(chalk.yellow(" ".repeat(4) + "Caused by:"));
    emitDiagnosticInfo(data, " ".repeat(5));
  });
};
const emitDiagnostics = (diag: WasmDiagnostic) => {
  diag.diagnostics.forEach((data) => {
    emitDiagnosticItem(data);
    console.log("");
  });
  const ers = diag.diagnostics.length === 1 ? "error" : "errors";
  console.error(chalk.yellow(`Found ${diag.diagnostics.length} ${ers}`));
};

(globalThis as any).resolve_import = resolveImport;
(globalThis as any).emit_diagnostic = emitDiagnostics;

type KnownFile = {
  message: string;
  file_name: string;

  line_lo: number;
  col_lo: number;
  line_hi: number;
  col_hi: number;
};
type UnknownFile = {
  message: string;
  current_file: string;
};
export type WasmDiagnosticInformation =
  | { KnownFile: KnownFile; UnknownFile?: never }
  | { UnknownFile: UnknownFile; KnownFile?: never };

type WasmDiagnosticItem = {
  cause: WasmDiagnosticInformation;
  related_information: WasmDiagnosticInformation[] | undefined;
  message?: string;
};
type WasmDiagnostic = {
  diagnostics: WasmDiagnosticItem[];
};

export class Bundler {
  cbs: ((path: string) => void)[];
  constructor(verbose: boolean) {
    (globalThis as any).verbose = verbose;
    wasm.init(verbose);

    this.cbs = [];

    (globalThis as any).read_file_content = (file_name: string) => {
      try {
        const source_file = fs.readFileSync(file_name, "utf-8");
        for (const cb of this.cbs) {
          cb(file_name);
        }
        return source_file;
      } catch (e) {
        if (verbose) {
          console.error(e);
        }
        return undefined;
      }
    };
  }

  public onFileRead(cb: (path: string) => void) {
    this.cbs.push(cb);
  }

  public bundle_v2(parser_entrypoint: string | undefined, settings: BeffUserSettings): string | undefined {
    return wasm.bundle_to_string_v2(parser_entrypoint ?? "", serializeSettings(settings));
  }

  public diagnostics(
    parser_entrypoint: string | undefined,
    settings: BeffUserSettings,
  ): WasmDiagnostic | null {
    return wasm.bundle_to_diagnostics(parser_entrypoint ?? "", serializeSettings(settings));
  }

  public updateFileContent(file_name: string, content: string) {
    return wasm.update_file_content(file_name, content);
  }
}
function serializeSettings(settings: BeffUserSettings) {
  return {
    string_formats: settings.stringFormats.map((it) => it.name) ?? [],
    number_formats: settings.numberFormats.map((it) => it.name) ?? [],
    frontend: settings.frontendVersion,
  };
}
