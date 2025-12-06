import { RegularDecodeError, UnionDecodeError, DecodeError } from "./types.js";

const prettyPrintValue = (it: unknown): string => {
  if (typeof it === "string") {
    return `"${it}"`;
  }
  if (typeof it === "number") {
    return `${it}`;
  }
  if (typeof it === "boolean") {
    return `${it}`;
  }
  if (it === null) {
    return "null";
  }
  if (Array.isArray(it)) {
    return `Array`;
  }
  if (typeof it === "object") {
    return `Object`;
  }
  return JSON.stringify(it);
};

const joinWithDot = (it: string[]): string => {
  if (it.length === 0) {
    return "";
  }
  let acc = it[0];
  for (const item of it.slice(1)) {
    // skip dot if first char is [
    if (item.startsWith("[")) {
      acc += item;
    } else {
      acc += "." + item;
    }
  }
  return acc;
};

const printPath = (parentPath: string[], path: string[]): string => {
  const mergedPath = [...parentPath, ...path];
  return mergedPath.length > 0 ? `(${joinWithDot(mergedPath)})` : "";
};
const joinFilteredStrings = (it: string[]): string => {
  return it.filter((it) => it.length > 0).join(" ");
};
const printRegularError = (err: RegularDecodeError, parentPath: string[], showReceived: boolean): string => {
  const path = printPath(parentPath, err.path);
  const msg = [err.message, showReceived ? `received: ${prettyPrintValue(err.received)}` : ""]
    .filter((it) => it.length > 0)
    .join(", ");
  return joinFilteredStrings([path, msg]);
};
const printUnionError = (err: UnionDecodeError, parentPath: string[]): string => {
  const path = printPath(parentPath, err.path);
  const printedErrors = printErrorsPart(err.errors, [], false);
  const innerMessages =
    printedErrors.length > 5
      ? printedErrors.slice(0, 5).join(" OR ") + " and more..."
      : printedErrors.join(" | ");

  const msg = [`Failed to decode one of (${innerMessages})`, `received: ${prettyPrintValue(err.received)}`]
    .filter((it) => it.length > 0)
    .join(", ");
  return joinFilteredStrings([path, msg]);
};
const printErrorsPart = (it: DecodeError[], parentPath: string[], showReceived: boolean): string[] => {
  return it.map((err) => {
    if ("isUnionError" in err) {
      return printUnionError(err, parentPath);
    }
    return printRegularError(err, parentPath, showReceived);
  });
};
export const printErrors = (it: DecodeError[], parentPath: string[] = []): string => {
  return printErrorsPart(it, parentPath, true)
    .map((msg, idx, all) =>
      all.length == 1 ? joinFilteredStrings([msg]) : joinFilteredStrings([`#${idx}`, msg]),
    )
    .join(" | ");
};
