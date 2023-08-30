import wasm from "../pkg/hello_wasm";
import fs from "fs";
import { resolveModuleName } from "typescript";

const resolveImportNoCache = (
  file_name: string,
  mod: string
): string | undefined => {
  // if (isRelativeImport(mod)) {
  //   return resolveRelativeImport(file_name, mod);
  // }

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
  const r = resolveModuleName(mod, file_name, {}, host);
  console.log(
    `JS: Resolved -import ? from '${mod}'- at ${file_name} => ${r.resolvedModule?.resolvedFileName}`
  );
  return r.resolvedModule?.resolvedFileName;

  // return undefined;
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
globalThis.resolve_import = resolveImport;
export class Bundler {
  seenFiles: Set<string> = new Set();
  constructor() {
    wasm.init();
  }

  private readFile(file_name: string): string {
    console.log(`JS: Reading file ${file_name}`);
    return fs.readFileSync(file_name, "utf-8");
  }

  private parseSourceFileRecursive(file_name: string) {
    if (this.seenFiles.has(file_name)) {
      return;
    }
    this.seenFiles.add(file_name);
    const source_file = this.readFile(file_name);
    wasm.parse_source_file(file_name, source_file);
    const nextFiles: string[] = wasm.read_files_to_import();
    wasm.clear_files_to_import();
    for (const file of nextFiles) {
      this.parseSourceFileRecursive(file);
    }
  }

  public bundle(file_name: string): string {
    this.parseSourceFileRecursive(file_name);
    return wasm.bundle_to_string(file_name);
  }
}
