import { program } from "commander";
import { Bundler } from "./bundler";
export const commanderExec = () => {
  program.requiredOption("-e, --entry <string>");

  program.parse();

  const options = program.opts();

  if (options.entry == null) {
    console.error("Must provide entry file");
    process.exit(1);
  }

  const bundler = new Bundler();
  const outString = bundler.bundle(options.entry);
  console.log(outString);
};
