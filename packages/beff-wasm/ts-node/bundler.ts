import * as wasm from "../pkg/beff_wasm";
import * as fs from "fs";
import { resolveModuleName } from "./tsc-slim/out";
import { codeFrameColumns } from "@babel/code-frame";
import * as chalk from "chalk";
import { ProjectModule } from "./project";
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

const resolveImportNoCache = (
  file_name: string,
  mod: string
): string | undefined => {
  const resolved = resolveModuleName(mod, file_name, {}, host);
  if ((globalThis as any).verbose) {
    console.log(
      `JS: Resolved -import ? from '${mod}'- at ${file_name} => ${resolved.resolvedModule?.resolvedFileName}`
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

let fsCache: Record<string, string> = {};
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
const emitDiagnosticInfo = (
  data: WasmDiagnosticInformation,
  padding: string
) => {
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

  let inf = data.related_information ?? [];
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
(globalThis as any).read_file_content = (file_name: string) => {
  try {
    const source_file = fs.readFileSync(file_name, "utf-8");
    return source_file;
  } catch (e) {
    return undefined;
  }
};
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
export type WritableModules = {
  js_validators: string;
  js_server_meta: string | undefined;
  js_client_meta: string | undefined;
  json_schema: string | undefined;
  js_built_parsers: string | undefined;
};
export class Bundler {
  constructor(verbose: boolean) {
    (globalThis as any).verbose = verbose;
    wasm.init(verbose);
  }

  public bundle(
    router_entrypoint: string | undefined,
    parser_entrypoint: string | undefined
  ): WritableModules | undefined {
    return wasm.bundle_to_string(
      router_entrypoint ?? "",
      parser_entrypoint ?? ""
    );
  }

  public diagnostics(
    router_entrypoint: string | undefined,
    parser_entrypoint: string | undefined
  ): WasmDiagnostic | null {
    return wasm.bundle_to_diagnostics(
      router_entrypoint ?? "",
      parser_entrypoint ?? ""
    );
  }

  public updateFileContent(file_name: string, content: string) {
    return wasm.update_file_content(file_name, content);
  }
}
