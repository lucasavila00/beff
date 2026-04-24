import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const cjsDir = path.join(packageRoot, "dist", "cjs");

fs.mkdirSync(cjsDir, { recursive: true });
fs.writeFileSync(path.join(cjsDir, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2) + "\n");
