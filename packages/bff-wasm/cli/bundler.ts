import wasm from "../pkg/hello_wasm";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import resolve from "enhanced-resolve";
import { resolveModuleName } from "typescript";

const isRelativeImport = (mod: string) => {
  return mod.startsWith("./") || mod.startsWith("../") || mod.startsWith("/");
};

const log = (message: string) => {
  const d = new Date();
  console.log(`${d.getSeconds()}:${d.getMilliseconds()} - JS: ${message}`);
};
const myResolve = resolve.create({
  // or resolve.create.sync
  extensions: [".ts", ".tsx", ".mts", ".cts", ".d.ts"],
  // see more options below
});

const resolveWithWebpackThing = async (
  file_name: string,
  mod: string
): Promise<string | undefined> => {
  const result = await new Promise<string | undefined | false>((rs, rj) =>
    myResolve(path.dirname(file_name), mod, (err, res) => {
      if (err) {
        rj(err);
      } else {
        rs(res);
      }
    })
  );
  if (result) {
    log(`JS: Resolved import to: ${result}`);
    return result;
  }
  log(`JS: File could not be resolved: ${mod}`);
  return undefined;
};

const resolveOneFileNoCache = async (
  file_name: string,
  mod: string
): Promise<string | undefined> => {
  log(`JS: Resolving -import ? from '${mod}'- at ${file_name}`);
  // if (isRelativeImport(mod)) {
  //   // should never throw
  //   return await resolveWithWebpackThing(file_name, mod);
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
      return fsSync.existsSync(file_name);
    },
    readFile: function (fileName: string): string | undefined {
      return fsSync.readFileSync(fileName, "utf-8");
    },
  };
  const r = resolveModuleName(mod, file_name, {}, host);
  return r.resolvedModule?.resolvedFileName;
  // console.log(r);
  // // try {
  // //   await resolveWithWebpackThing(file_name, mod);
  // // } catch (e) {
  // //   console.error(e);
  // //   console.error(e?.message);
  // //   console.error(e?.details);
  // // }

  // log(`JS: File is not relative: ${mod}`);
  // return undefined;
};

const resolvedCache = new Map<string, string | undefined>();
const resolveOneFile = async (
  file_name: string,
  mod: string
): Promise<string | undefined> => {
  const cacheKey = `${file_name}::${mod}`;
  if (resolvedCache.has(cacheKey)) {
    return resolvedCache.get(cacheKey);
  }
  const result = await resolveOneFileNoCache(file_name, mod);
  resolvedCache.set(cacheKey, result);
  return result;
};
type UnresolvedPacket = {
  references: { file_name: string; imported_mod: string }[];
};
type ResolvedPacket = {
  resolved: (string | undefined)[];
};
const resolveImports = async (
  data: UnresolvedPacket
): Promise<ResolvedPacket> => {
  const resolved = await Promise.all(
    data.references.map((ref) => {
      return resolveOneFile(ref.file_name, ref.imported_mod);
    })
  );
  return { resolved };
};
//@ts-ignore
globalThis.resolve_imports = resolveImports;

type ReadResultPacket = {
  next_files: string[];
};
export class Bundler {
  seenFiles = new Set<string>();
  constructor() {
    wasm.init();
  }

  private async readFile(file_name: string): Promise<string> {
    log(`JS: Reading file ${file_name}`);
    return fs.readFile(file_name, "utf-8");
  }

  private async parseSourceFileRecursive(file_name: string) {
    if (this.seenFiles.has(file_name)) {
      return;
    }
    this.seenFiles.add(file_name);
    const source_file = await this.readFile(file_name);
    log(`JS: Parsing file ${file_name}`);
    const readResult: ReadResultPacket = await wasm.parse_source_file(
      file_name,
      source_file
    );
    log(`JS: Parsed file ${file_name}`);
    await Promise.all(
      readResult.next_files.map((file) => this.parseSourceFileRecursive(file))
    );
  }

  public async bundle(file_name: string): Promise<string> {
    await this.parseSourceFileRecursive(file_name);
    return wasm.bundle_to_string(file_name);
  }
}
