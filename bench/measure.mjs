// The calls that runtime.mjs and compare.mjs measure, and the function that measures them.

// Milliseconds per call, measured for at least 200 ms after one warm-up call.
export function measure(f) {
  f();
  let calls = 0;
  const start = performance.now();
  let elapsed = 0;
  while (elapsed < 200) {
    f();
    calls++;
    elapsed = performance.now() - start;
  }
  return elapsed / calls;
}

// The calls on the `Root` parser. Each call gets a valid and an invalid input.
export function operations(Root) {
  return {
    validate: (valid) => Root.validate(valid),
    safeParse: (valid) => Root.safeParse(valid),
    parse: (valid) => Root.parse(valid),
    "validate (invalid)": (_, invalid) => Root.validate(invalid),
    "safeParse (invalid)": (_, invalid) => Root.safeParse(invalid),
    "parse (invalid)": (_, invalid) => {
      try {
        Root.parse(invalid);
      } catch (e) {
        if (e.message.startsWith("Failed to parse")) return;
        throw e;
      }
      throw new Error("parse accepted an invalid value");
    },
  };
}
