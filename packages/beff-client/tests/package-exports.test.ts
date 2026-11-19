import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "beff-client-package-"));
const tempProjectDir = path.join(tempRoot, "project");
const installedPackageDir = path.join(tempProjectDir, "node_modules", "@beff", "client");
const installedZodDir = path.join(tempProjectDir, "node_modules", "zod");
const zodPackageRoot = path.dirname(require.resolve("zod/package.json"));

const runNode = (args: string[]) =>
  execFileSync(process.execPath, args, {
    cwd: tempProjectDir,
    env: process.env,
    encoding: "utf8",
  }).trim();

describe("published package exports", () => {
  beforeAll(() => {
    execFileSync("pnpm", ["build"], {
      cwd: packageRoot,
      env: process.env,
      encoding: "utf8",
    });

    fs.mkdirSync(installedPackageDir, { recursive: true });
    fs.mkdirSync(path.dirname(installedZodDir), { recursive: true });
    fs.cpSync(path.join(packageRoot, "package.json"), path.join(installedPackageDir, "package.json"));
    fs.cpSync(path.join(packageRoot, "dist"), path.join(installedPackageDir, "dist"), { recursive: true });
    fs.cpSync(zodPackageRoot, installedZodDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("exposes named exports from the root entrypoint under ESM import", () => {
    const output = runNode([
      "--input-type=module",
      "-e",
      'const mod = await import("@beff/client"); console.log(typeof mod.b?.String);',
    ]);

    expect(output).toBe("function");
  });

  it("exposes named exports from the codegen subpath under ESM import", () => {
    const output = runNode([
      "--input-type=module",
      "-e",
      'const mod = await import("@beff/client/codegen-v2"); console.log(typeof mod.AllOfRuntype);',
    ]);

    expect(output).toBe("function");
  });

  it("continues to expose the root entrypoint under CommonJS require", () => {
    const output = runNode(["-e", 'const mod = require("@beff/client"); console.log(typeof mod.b?.String);']);

    expect(output).toBe("function");
  });

  it("continues to expose the codegen subpath under CommonJS require", () => {
    const output = runNode([
      "-e",
      'const mod = require("@beff/client/codegen-v2"); console.log(typeof mod.AllOfRuntype);',
    ]);

    expect(output).toBe("function");
  });
});
