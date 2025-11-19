//@ts-nocheck

import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerStringFormatter, registerNumberFormatter, ObjectValidator, ObjectParser, MappedRecordParser, MappedRecordValidator, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatsDecoder, NumberWithFormatsDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, MappedRecordReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, MappedRecordSchema, describeString, describeNumber, describeBoolean, describeNull, describeAny, describeNever, describeFunction, ArrayDescribe, ObjectDescribe, TupleDescribe, AnyOfDescribe, AllOfDescribe, AnyOfDiscriminatedDescribe, MappedRecordDescribe, validators, parsers, reporters, schemas, describers, c } = validatorsMod;
const RequiredStringFormats = ["ValidCurrency"];
const RequiredNumberFormats = [];
const hoisted_A_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["A"] = (ctx.deps_counter["A"] || 0) + 1;
        if (ctx.deps["A"]) {
            return "A";
        }
        ctx.deps["A"] = true;
        ctx.deps["A"] = describers.A(ctx, input);
        return "A";
    } else {
        if (ctx.deps_counter["A"] > 1) {
            if (!ctx.deps["A"]) {
                ctx.deps["A"] = true;
                ctx.deps["A"] = describers.A(ctx, input);
            }
            return "A";
        } else {
            return describers.A(ctx, input);
        }
    }
};
const buildValidatorsInput = {
    "A": validators.A
};
const buildParsersInput = {
    "A": parsers.A
};
const buildReportersInput = {
    "A": reporters.A
};
const buildSchemaInput = {
    "A": schemas.A
};
const buildDescribeInput = {
    "A": hoisted_A_0
};



function buildParsers(args) {
  const stringFormats = args?.stringFormats ?? {};
  
  for (const k of RequiredStringFormats) {
    if (stringFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }

  Object.keys(stringFormats).forEach((k) => {
    const v = stringFormats[k];
    
    registerStringFormatter(k, v);
  });

  const numberFormats = args?.numberFormats ?? {};
  
  for (const k of RequiredNumberFormats) {
    if (numberFormats[k] == null) {
      throw new Error(`Missing custom format ${k}`);
    }
  }

  Object.keys(numberFormats).forEach((k) => {
    const v = numberFormats[k];
    
    registerNumberFormatter(k, v);
  });

  let decoders = {};
  
  Object.keys(buildValidatorsInput).forEach((k) => {
    
    let v = buildValidatorsInput[k];
    const validate = (input, options) => {
      const disallowExtraProperties = options?.disallowExtraProperties ?? false;
      const ctx = { disallowExtraProperties };
      const ok = v(ctx, input);
      if (typeof ok !== "boolean") {
        throw new Error("INTERNAL ERROR: Expected boolean");
      }
      return ok;
    };

    
    const schemaFn = buildSchemaInput[k];
    const schema = () => {
      const ctx = {
        path: [],
        seen: {},
      };
      return schemaFn(ctx);
    };

    
    const describeFn = buildDescribeInput[k];
    const describe = () => {
      const ctx = {
        deps: {},
        deps_counter: {},
        measure: true,
      };
      let out = describeFn(ctx);
      ctx["deps"] = {}
      ctx['measure']=false
      out = describeFn(ctx);
      let sortedDepsKeys = Object.keys(ctx.deps).sort();
      
      
      
      
      const depsPart = sortedDepsKeys
        .map((key) => {
          return `type ${key} = ${ctx.deps[key]};`;
        })
        .join("\n\n");
      
      
      
      const outPart = `type Codec${k} = ${out};`;
      return [depsPart, outPart].filter((it) => it != null && it.length > 0).join("\n\n");
    };

    const safeParse = (input, options) => {
      const disallowExtraProperties = options?.disallowExtraProperties ?? false;
      const ok = validate(input, options);
      if (ok) {
        
        let p = buildParsersInput[k];
        let ctx = { disallowExtraProperties };
        const parsed = p(ctx, input);
        return { success: true, data: parsed };
      }
      
      let e = buildReportersInput[k];
      let ctx = { path: [], disallowExtraProperties };
      return {
        success: false,
        errors: e(ctx, input).slice(0, 10),
      };
    };
    const parse = (input, options) => {
      const safe = safeParse(input, options);
      if (safe.success) {
        return safe.data;
      }
      
      const explained = printErrors(safe.errors, []);
      throw new Error(`Failed to parse ${k} - ${explained}`);
    };
    const zod = () => {
      
      return z.custom(
        (data) => safeParse(data).success,
        (val) => {
          const errors = safeParse(val).errors;
          
          return printErrors(errors, []);
        },
      );
    };
    decoders[k] = {
      parse,
      safeParse,
      zod,
      name: k,
      validate,
      schema,
      describe,
    };
  });
  return decoders;
}

export default { buildParsers };