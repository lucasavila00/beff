/* eslint-disable no-undef */
//@ts-check

class BffParseError {
  constructor(errors) {
    this.errors = errors;
  }
}
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
    registerCustomFormatter(k, v);
  });


  let decoders = {};
  //@ts-ignore
  Object.keys(buildParsersInput).forEach((k) => {
    //@ts-ignore
    let v = buildParsersInput[k];
    const safeParse = (input) => {
      const validatorCtx = {};
      const new_value = v(validatorCtx, input);
      const validation_result = validatorCtx.errors;
      if (validation_result == null) {
        return { success: true, data: new_value };
      }
      return { success: false, errors: validation_result };
    };
    const parse = (input) => {
      const safe = safeParse(input);
      if (safe.success) {
        return safe.data;
      }
      throw new BffParseError(safe.errors);
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
      zod
    };
  });
  return decoders;
}
