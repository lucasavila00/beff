import wasm from "../pkg/hello_wasm";
import fs from "fs/promises";
import path from "path";
import resolve from "enhanced-resolve";

const isRelativeImport = (mod: string) => {
  return mod.startsWith("./") || mod.startsWith("../") || mod.startsWith("/");
};

const log = (message: string) => {
  const d = new Date();
  console.log(`${d.getSeconds()}:${d.getMilliseconds()} - JS: ${message}`);
};
const myResolve = resolve.create({
  // or resolve.create.sync
  extensions: [".ts", ".tsx", ".d.ts"],
  // see more options below
});

const resolveRelativeImport = async (
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
  if (isRelativeImport(mod)) {
    return resolveRelativeImport(file_name, mod);
  }

  log(`JS: File is not relative: ${mod}`);
  return undefined;
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
