import * as wasm from "../pkg/hello_wasm";
import * as fs from "fs";
import { resolveModuleName } from "typescript";
import { codeFrameColumns } from "@babel/code-frame";
import * as chalk from "chalk";
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
const emitDiagnostics = (diag: BundleDiagnostic) => {
  let fsCache: Record<string, string> = {};

  const getRawLines = (fileName: string): string | undefined => {
    if (fsCache[fileName]) {
      return fsCache[fileName];
    }
    const rawLines = fs.readFileSync(fileName, "utf-8");
    fsCache[fileName] = rawLines;
    return rawLines;
  };
  console.error(chalk.red(`Found ${diag.diagnostics.length} errors`));
  console.error("");

  diag.diagnostics.forEach((diag) => {
    const location = {
      start: { line: diag.line_lo, column: diag.col_lo + 1 },
      end: { line: diag.line_hi, column: diag.col_hi + 1 },
    };

    const rawLines = getRawLines(diag.file_name);
    if (rawLines == null) {
      throw new Error(
        `File not found while reporting error: ${diag.file_name}`
      );
    }
    const result = codeFrameColumns(rawLines, location, {
      message: diag.message,
      highlightCode: true,
    });

    const line = diag.line_lo;
    const col = diag.col_lo + 1;

    console.error(chalk.red(`${diag.file_name}:${line}:${col}`));
    console.error(result);
    console.error("");
  });
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

type BundleDiagnosticItem = {
  message: string;
  file_name: string;
  line_lo: number;
  col_lo: number;
  line_hi: number;
  col_hi: number;
};
type BundleDiagnostic = {
  diagnostics: BundleDiagnosticItem[];
};

export class Bundler {
  constructor(verbose: boolean) {
    (globalThis as any).verbose = verbose;
    wasm.init(verbose);
  }

  public bundle(file_name: string): string | undefined {
    return wasm.bundle_to_string(file_name);
  }

  public diagnostics(file_name: string): BundleDiagnostic | null {
    return wasm.bundle_to_diagnostics(file_name);
  }

  public updateFileContent(file_name: string, content: string) {
    return wasm.update_file_content(file_name, content);
  }
}
