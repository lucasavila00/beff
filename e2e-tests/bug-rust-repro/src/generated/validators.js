//@ts-nocheck
/* eslint-disable */




const customFormatters = {};

function registerCustomFormatter(name, validator) {
  customFormatters[name] = validator;
}

function decodeString(ctx, input) {
  return typeof input === "string";
}

function decodeNumber(ctx, input) {
  return typeof input === "number";
}

function decodeBoolean(ctx, input) {
  return typeof input === "boolean";
}
function decodeAny(ctx, input) {
  return true;
}
function decodeNull(ctx, input) {
  if (input == null) {
    return true;
  }
  return false;
}
function decodeNever(ctx, input) {
  return false;
}
function decodeFunction(ctx, input) {
  return typeof input === "function";
}

class ConstDecoder {
  constructor(value) {
    this.value = value;
  }

  decodeConstDecoder(ctx, input) {
    return input === this.value;
  }
}

class RegexDecoder {
  constructor(regex, description) {
    this.regex = regex;
    this.description = description;
  }

  decodeRegexDecoder(ctx, input) {
    if (typeof input === "string") {
      return this.regex.test(input);
    }
    return false;
  }
}

class ObjectDecoder {
  constructor(data, additionalPropsValidator = null) {
    this.data = data;
    this.additionalPropsValidator = additionalPropsValidator;
  }

  decodeObjectDecoder(ctx, input) {
    if (typeof input === "object" && !Array.isArray(input) && input !== null) {
      const configKeys = Object.keys(this.data);
      for (const k of configKeys) {
        const v = this.data[k];
        if (!v(ctx, input[k])) {
          return false;
        }
      }

      if (this.additionalPropsValidator != null) {
        const inputKeys = Object.keys(input);
        const extraKeys = inputKeys.filter((k) => !configKeys.includes(k));
        for (const k of extraKeys) {
          const v = input[k];
          if (!this.additionalPropsValidator(ctx, v)) {
            return false;
          }
        }
      }

      return true;
    }
    return false;
  }
}

class ArrayDecoder {
  constructor(data) {
    this.data = data;
  }

  decodeArrayDecoder(ctx, input) {
    if (Array.isArray(input)) {
      for (let i = 0; i < input.length; i++) {
        const v = input[i];
        const ok = this.data(ctx, v);
        if (!ok) {
          return false;
        }
      }
    }
    return true;
  }
}
class CodecDecoder {
  constructor(codec) {
    this.codec = codec;
  }
  decodeCodecDecoder(ctx, input) {
    switch (this.codec) {
      case "Codec::ISO8061": {
        const d = new Date(input);
        return !isNaN(d.getTime());
      }
      case "Codec::BigInt": {
        if (typeof input === "bigint") {
          return true;
        }
        if (typeof input === "number") {
          return true;
        }
        if (typeof input === "string") {
          try {
            return true;
          } catch (e) {
            
          }
        }
        return false;
      }
    }
    return false;
  }
}

class StringWithFormatDecoder {
  constructor(format) {
    this.format = format;
  }

  decodeStringWithFormatDecoder(ctx, input) {
    if (typeof input !== "string") {
      return false;
    }

    const validator = customFormatters[this.format];

    if (validator == null) {
      return false;
    }

    return validator(input);
  }
}
class AnyOfDiscriminatedDecoder {
  constructor(discriminator, mapping) {
    this.discriminator = discriminator;
    this.mapping = mapping;
  }

  decodeAnyOfDiscriminatedDecoder(ctx, input) {
    const d = input[this.discriminator];
    if (d == null) {
      return false;
    }
    const v = this.mapping[d];
    if (v == null) {
      
      return false;
    }
    if (!v(ctx, input)) {
      return false;
    }
    return true;
  }
}

class AnyOfConstsDecoder {
  constructor(consts) {
    this.consts = consts;
  }
  decodeAnyOfConstsDecoder(ctx, input) {
    if (input == null) {
      if (this.consts.includes(null) || this.consts.includes(undefined)) {
        return true;
      }
    }
    return this.consts.includes(input);
  }
}

class AnyOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAnyOfDecoder(ctx, input) {
    for (const v of this.vs) {
      if (v(ctx, input)) {
        return true;
      }
    }
    return false;
  }
}
class AllOfDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeAllOfDecoder(ctx, input) {
    for (const v of this.vs) {
      if (!v(ctx, input)) {
        return false;
      }
    }
    return true;
  }
}
class TupleDecoder {
  constructor(vs) {
    this.vs = vs;
  }
  decodeTupleDecoder(ctx, input) {
    if (Array.isArray(input)) {
      let idx = 0;
      for (const prefixVal of this.vs.prefix) {
        if (!prefixVal(ctx, input[idx])) {
          return false;
        }
        idx++;
      }
      const itemVal = this.vs.items;
      if (itemVal != null) {
        for (let i = idx; i < input.length; i++) {
          if (!itemVal(ctx, input[i])) {
            return false;
          }
        }
      } else {
        if (input.length > idx) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
}


function ValidateA(ctx, input) {
    return (decodeString)(ctx, input);
}
const validators = {
    A: ValidateA
};

export default { ObjectDecoder, ArrayDecoder, decodeString, decodeNumber, CodecDecoder, decodeFunction, StringWithFormatDecoder, AnyOfDecoder, AllOfDecoder, decodeBoolean, decodeAny, TupleDecoder, decodeNull, decodeNever, RegexDecoder, ConstDecoder, registerCustomFormatter, AnyOfConstsDecoder, AnyOfDiscriminatedDecoder, validators };