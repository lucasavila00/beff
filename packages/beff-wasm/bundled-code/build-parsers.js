/* eslint-disable no-undef */
//@ts-check

function buildParsers(args) {

  const customFormats = args?.customFormats ?? {}
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
  Object.keys(buildParsersInput).forEach((k) => {
    //@ts-ignore
    let v = buildParsersInput[k];
    const safeParse = (input, options) => {
      const validatorCtx = {
        disallowExtraProperties: options?.disallowExtraProperties ?? false,
      };
      const new_value = v(validatorCtx, input);
      const validation_result = validatorCtx.errors;
      if (validation_result == null) {
        return { success: true, data: new_value };
      }
      const errorsSlice = validation_result.slice(0, 10);
      return { success: false, errors: errorsSlice };
    };
    const parse = (input, options) => {
      const safe = safeParse(input, options);
      if (safe.success) {
        return safe.data;
      }
      const error = new Error(`Failed to parse ${k}`);
      //@ts-ignore
      error.errors = safe.errors;
      throw error
    };
    const zod = () => {
      //@ts-ignore
      return z.custom(data => safeParse(data).success, val => {
        const errors = safeParse(val).errors;
        //@ts-ignore
        return printErrors(errors, [])
      })
    }
    decoders[k] = {
      parse,
      safeParse,
      zod,
      //@ts-ignore
      jsonSchema: jsonSchema[k]
    };
  });
  return decoders;
}
