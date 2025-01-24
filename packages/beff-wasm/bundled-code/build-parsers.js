/* eslint-disable no-undef */
//@ts-check

function buildParsers(args) {
  const customFormats = args?.customFormats ?? {};
  //@ts-ignore
  for (const k of RequiredCustomFormats) {
    if (customFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }

  Object.keys(customFormats).forEach((k) => {
    const v = customFormats[k];
    //@ts-ignore
    registerCustomFormatter(k, v);
  });

  let decoders = {};
  //@ts-ignore
  Object.keys(buildValidatorsInput).forEach((k) => {
    //@ts-ignore
    let v = buildValidatorsInput[k];
    const validate = (input, options) => {
      if (options?.disallowExtraProperties ?? false) {
        throw new Error("disallowExtraProperties not supported");
      }
      const ok = v(null, input);
      if (typeof ok !== "boolean") {
        throw new Error("DEBUG: Expected boolean");
      }
      return ok;
    };
    const safeParse = (input, options) => {
      const ok = validate(input, options);
      // const validation_result = validatorCtx.errors;
      // if (validation_result == null) {
      //   return { success: true, data: new_value };
      // }
      // const errorsSlice = validation_result.slice(0, 10);
      // return { success: false, errors: errorsSlice };
      if (ok) {
        //@ts-ignore
        let p = buildParsersInput[k];
        const parsed = p(null, input);
        return { success: true, data: parsed };
      }
      return {
        success: false,
        errors: [
          {
            message: "failed to parse!!!",
            path: [],
            received: input,
          },
        ],
      };
    };
    const parse = (input, options) => {
      const safe = safeParse(input, options);
      if (safe.success) {
        return safe.data;
      }
      const error = new Error(`Failed to parse ${k}`);
      //@ts-ignore
      error.errors = safe.errors;
      throw error;
    };
    const zod = () => {
      //@ts-ignore
      return z.custom(
        (data) => safeParse(data).success,
        (val) => {
          const errors = safeParse(val).errors;
          //@ts-ignore
          return printErrors(errors, []);
        }
      );
    };
    decoders[k] = {
      parse,
      safeParse,
      zod,
      name: k,
      validate,
    };
  });
  return decoders;
}
