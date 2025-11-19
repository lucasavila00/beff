//@ts-nocheck

import {printErrors} from '@beff/client';
import {z} from 'zod';
import validatorsMod from "./validators.js"; const { registerStringFormatter, registerNumberFormatter, ObjectValidator, ObjectParser, MappedRecordParser, MappedRecordValidator, ArrayParser, ArrayValidator, CodecDecoder, StringWithFormatsDecoder, NumberWithFormatsDecoder, AnyOfValidator, AnyOfParser, AllOfValidator, AllOfParser, TupleParser, TupleValidator, RegexDecoder, ConstDecoder, AnyOfConstsDecoder, AnyOfDiscriminatedParser, AnyOfDiscriminatedValidator, validateString, validateNumber, validateFunction, validateBoolean, validateAny, validateNull, validateNever, parseIdentity, reportString, reportNumber, reportNull, reportBoolean, reportAny, reportNever, reportFunction, ArrayReporter, ObjectReporter, TupleReporter, AnyOfReporter, AllOfReporter, AnyOfDiscriminatedReporter, MappedRecordReporter, schemaString, schemaNumber, schemaBoolean, schemaNull, schemaAny, schemaNever, schemaFunction, ArraySchema, ObjectSchema, TupleSchema, AnyOfSchema, AllOfSchema, AnyOfDiscriminatedSchema, MappedRecordSchema, describeString, describeNumber, describeBoolean, describeNull, describeAny, describeNever, describeFunction, ArrayDescribe, ObjectDescribe, TupleDescribe, AnyOfDescribe, AllOfDescribe, AnyOfDiscriminatedDescribe, MappedRecordDescribe, validators, parsers, reporters, schemas, describers, c } = validatorsMod;
const RequiredStringFormats = ["ValidCurrency"];
const RequiredNumberFormats = [];
const hoisted_object_0 = {};
const hoisted_object_1 = {};
const hoisted_object_2 = {};
const hoisted_object_3 = hoisted_object_2;
const hoisted_object_4 = validateAny;
const hoisted_object_5 = new ObjectValidator(hoisted_object_0, hoisted_object_4);
const hoisted_object_6 = new ObjectParser({}, parseIdentity);
const hoisted_object_7 = new ObjectReporter(hoisted_object_0, hoisted_object_4, {}, reportAny);
const hoisted_object_8 = new ObjectSchema(hoisted_object_1, schemaAny);
const hoisted_object_9 = new ObjectDescribe(hoisted_object_3, describeAny);
const hoisted_anyArray_0 = validateAny;
const hoisted_anyArray_1 = new ArrayValidator(hoisted_anyArray_0);
const hoisted_anyArray_2 = new ArrayParser(parseIdentity);
const hoisted_anyArray_3 = new ArrayReporter(hoisted_anyArray_0, reportAny);
const hoisted_anyArray_4 = new ArraySchema(schemaAny);
const hoisted_anyArray_5 = new ArrayDescribe(describeAny);
const hoisted_T1_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["T1"] = (ctx.deps_counter["T1"] || 0) + 1;
        if (ctx.deps["T1"]) {
            return "T1";
        }
        ctx.deps["T1"] = true;
        ctx.deps["T1"] = describers.T1(ctx, input);
        return "T1";
    } else {
        if (ctx.deps_counter["T1"] > 1) {
            if (!ctx.deps["T1"]) {
                ctx.deps["T1"] = true;
                ctx.deps["T1"] = describers.T1(ctx, input);
            }
            return "T1";
        } else {
            return describers.T1(ctx, input);
        }
    }
};
const hoisted_T2_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["T2"] = (ctx.deps_counter["T2"] || 0) + 1;
        if (ctx.deps["T2"]) {
            return "T2";
        }
        ctx.deps["T2"] = true;
        ctx.deps["T2"] = describers.T2(ctx, input);
        return "T2";
    } else {
        if (ctx.deps_counter["T2"] > 1) {
            if (!ctx.deps["T2"]) {
                ctx.deps["T2"] = true;
                ctx.deps["T2"] = describers.T2(ctx, input);
            }
            return "T2";
        } else {
            return describers.T2(ctx, input);
        }
    }
};
const hoisted_T3_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["T3"] = (ctx.deps_counter["T3"] || 0) + 1;
        if (ctx.deps["T3"]) {
            return "T3";
        }
        ctx.deps["T3"] = true;
        ctx.deps["T3"] = describers.T3(ctx, input);
        return "T3";
    } else {
        if (ctx.deps_counter["T3"] > 1) {
            if (!ctx.deps["T3"]) {
                ctx.deps["T3"] = true;
                ctx.deps["T3"] = describers.T3(ctx, input);
            }
            return "T3";
        } else {
            return describers.T3(ctx, input);
        }
    }
};
const hoisted_InvalidSchemaWithDate_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["InvalidSchemaWithDate"] = (ctx.deps_counter["InvalidSchemaWithDate"] || 0) + 1;
        if (ctx.deps["InvalidSchemaWithDate"]) {
            return "InvalidSchemaWithDate";
        }
        ctx.deps["InvalidSchemaWithDate"] = true;
        ctx.deps["InvalidSchemaWithDate"] = describers.InvalidSchemaWithDate(ctx, input);
        return "InvalidSchemaWithDate";
    } else {
        if (ctx.deps_counter["InvalidSchemaWithDate"] > 1) {
            if (!ctx.deps["InvalidSchemaWithDate"]) {
                ctx.deps["InvalidSchemaWithDate"] = true;
                ctx.deps["InvalidSchemaWithDate"] = describers.InvalidSchemaWithDate(ctx, input);
            }
            return "InvalidSchemaWithDate";
        } else {
            return describers.InvalidSchemaWithDate(ctx, input);
        }
    }
};
const hoisted_InvalidSchemaWithBigInt_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["InvalidSchemaWithBigInt"] = (ctx.deps_counter["InvalidSchemaWithBigInt"] || 0) + 1;
        if (ctx.deps["InvalidSchemaWithBigInt"]) {
            return "InvalidSchemaWithBigInt";
        }
        ctx.deps["InvalidSchemaWithBigInt"] = true;
        ctx.deps["InvalidSchemaWithBigInt"] = describers.InvalidSchemaWithBigInt(ctx, input);
        return "InvalidSchemaWithBigInt";
    } else {
        if (ctx.deps_counter["InvalidSchemaWithBigInt"] > 1) {
            if (!ctx.deps["InvalidSchemaWithBigInt"]) {
                ctx.deps["InvalidSchemaWithBigInt"] = true;
                ctx.deps["InvalidSchemaWithBigInt"] = describers.InvalidSchemaWithBigInt(ctx, input);
            }
            return "InvalidSchemaWithBigInt";
        } else {
            return describers.InvalidSchemaWithBigInt(ctx, input);
        }
    }
};
const hoisted_DiscriminatedUnion_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["DiscriminatedUnion"] = (ctx.deps_counter["DiscriminatedUnion"] || 0) + 1;
        if (ctx.deps["DiscriminatedUnion"]) {
            return "DiscriminatedUnion";
        }
        ctx.deps["DiscriminatedUnion"] = true;
        ctx.deps["DiscriminatedUnion"] = describers.DiscriminatedUnion(ctx, input);
        return "DiscriminatedUnion";
    } else {
        if (ctx.deps_counter["DiscriminatedUnion"] > 1) {
            if (!ctx.deps["DiscriminatedUnion"]) {
                ctx.deps["DiscriminatedUnion"] = true;
                ctx.deps["DiscriminatedUnion"] = describers.DiscriminatedUnion(ctx, input);
            }
            return "DiscriminatedUnion";
        } else {
            return describers.DiscriminatedUnion(ctx, input);
        }
    }
};
const hoisted_RecursiveTree_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["RecursiveTree"] = (ctx.deps_counter["RecursiveTree"] || 0) + 1;
        if (ctx.deps["RecursiveTree"]) {
            return "RecursiveTree";
        }
        ctx.deps["RecursiveTree"] = true;
        ctx.deps["RecursiveTree"] = describers.RecursiveTree(ctx, input);
        return "RecursiveTree";
    } else {
        if (ctx.deps_counter["RecursiveTree"] > 1) {
            if (!ctx.deps["RecursiveTree"]) {
                ctx.deps["RecursiveTree"] = true;
                ctx.deps["RecursiveTree"] = describers.RecursiveTree(ctx, input);
            }
            return "RecursiveTree";
        } else {
            return describers.RecursiveTree(ctx, input);
        }
    }
};
const hoisted_SemVer_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["SemVer"] = (ctx.deps_counter["SemVer"] || 0) + 1;
        if (ctx.deps["SemVer"]) {
            return "SemVer";
        }
        ctx.deps["SemVer"] = true;
        ctx.deps["SemVer"] = describers.SemVer(ctx, input);
        return "SemVer";
    } else {
        if (ctx.deps_counter["SemVer"] > 1) {
            if (!ctx.deps["SemVer"]) {
                ctx.deps["SemVer"] = true;
                ctx.deps["SemVer"] = describers.SemVer(ctx, input);
            }
            return "SemVer";
        } else {
            return describers.SemVer(ctx, input);
        }
    }
};
const hoisted_NonEmptyString_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["NonEmptyString"] = (ctx.deps_counter["NonEmptyString"] || 0) + 1;
        if (ctx.deps["NonEmptyString"]) {
            return "NonEmptyString";
        }
        ctx.deps["NonEmptyString"] = true;
        ctx.deps["NonEmptyString"] = describers.NonEmptyString(ctx, input);
        return "NonEmptyString";
    } else {
        if (ctx.deps_counter["NonEmptyString"] > 1) {
            if (!ctx.deps["NonEmptyString"]) {
                ctx.deps["NonEmptyString"] = true;
                ctx.deps["NonEmptyString"] = describers.NonEmptyString(ctx, input);
            }
            return "NonEmptyString";
        } else {
            return describers.NonEmptyString(ctx, input);
        }
    }
};
const hoisted_ValidCurrency_0 = (ctx, input)=>{
    if (ctx.measure) {
        ctx.deps_counter["ValidCurrency"] = (ctx.deps_counter["ValidCurrency"] || 0) + 1;
        if (ctx.deps["ValidCurrency"]) {
            return "ValidCurrency";
        }
        ctx.deps["ValidCurrency"] = true;
        ctx.deps["ValidCurrency"] = describers.ValidCurrency(ctx, input);
        return "ValidCurrency";
    } else {
        if (ctx.deps_counter["ValidCurrency"] > 1) {
            if (!ctx.deps["ValidCurrency"]) {
                ctx.deps["ValidCurrency"] = true;
                ctx.deps["ValidCurrency"] = describers.ValidCurrency(ctx, input);
            }
            return "ValidCurrency";
        } else {
            return describers.ValidCurrency(ctx, input);
        }
    }
};
const buildValidatorsInput = {
    "DiscriminatedUnion": validators.DiscriminatedUnion,
    "InvalidSchemaWithBigInt": validators.InvalidSchemaWithBigInt,
    "InvalidSchemaWithDate": validators.InvalidSchemaWithDate,
    "NonEmptyString": validators.NonEmptyString,
    "RecursiveTree": validators.RecursiveTree,
    "SemVer": validators.SemVer,
    "T1": validators.T1,
    "T2": validators.T2,
    "T3": validators.T3,
    "ValidCurrency": validators.ValidCurrency,
    "any": validateAny,
    "anyArray": hoisted_anyArray_1.validateArrayValidator.bind(hoisted_anyArray_1),
    "boolean": validateBoolean,
    "null": validateNull,
    "number": validateNumber,
    "object": hoisted_object_5.validateObjectValidator.bind(hoisted_object_5),
    "string": validateString,
    "undefined": validateNull
};
const buildParsersInput = {
    "DiscriminatedUnion": parsers.DiscriminatedUnion,
    "InvalidSchemaWithBigInt": parsers.InvalidSchemaWithBigInt,
    "InvalidSchemaWithDate": parsers.InvalidSchemaWithDate,
    "NonEmptyString": parsers.NonEmptyString,
    "RecursiveTree": parsers.RecursiveTree,
    "SemVer": parsers.SemVer,
    "T1": parsers.T1,
    "T2": parsers.T2,
    "T3": parsers.T3,
    "ValidCurrency": parsers.ValidCurrency,
    "any": parseIdentity,
    "anyArray": hoisted_anyArray_2.parseArrayParser.bind(hoisted_anyArray_2),
    "boolean": parseIdentity,
    "null": parseIdentity,
    "number": parseIdentity,
    "object": hoisted_object_6.parseObjectParser.bind(hoisted_object_6),
    "string": parseIdentity,
    "undefined": parseIdentity
};
const buildReportersInput = {
    "DiscriminatedUnion": reporters.DiscriminatedUnion,
    "InvalidSchemaWithBigInt": reporters.InvalidSchemaWithBigInt,
    "InvalidSchemaWithDate": reporters.InvalidSchemaWithDate,
    "NonEmptyString": reporters.NonEmptyString,
    "RecursiveTree": reporters.RecursiveTree,
    "SemVer": reporters.SemVer,
    "T1": reporters.T1,
    "T2": reporters.T2,
    "T3": reporters.T3,
    "ValidCurrency": reporters.ValidCurrency,
    "any": reportAny,
    "anyArray": hoisted_anyArray_3.reportArrayReporter.bind(hoisted_anyArray_3),
    "boolean": reportBoolean,
    "null": reportNull,
    "number": reportNumber,
    "object": hoisted_object_7.reportObjectReporter.bind(hoisted_object_7),
    "string": reportString,
    "undefined": reportNull
};
const buildSchemaInput = {
    "DiscriminatedUnion": schemas.DiscriminatedUnion,
    "InvalidSchemaWithBigInt": schemas.InvalidSchemaWithBigInt,
    "InvalidSchemaWithDate": schemas.InvalidSchemaWithDate,
    "NonEmptyString": schemas.NonEmptyString,
    "RecursiveTree": schemas.RecursiveTree,
    "SemVer": schemas.SemVer,
    "T1": schemas.T1,
    "T2": schemas.T2,
    "T3": schemas.T3,
    "ValidCurrency": schemas.ValidCurrency,
    "any": schemaAny,
    "anyArray": hoisted_anyArray_4.schemaArraySchema.bind(hoisted_anyArray_4),
    "boolean": schemaBoolean,
    "null": schemaNull,
    "number": schemaNumber,
    "object": hoisted_object_8.schemaObjectSchema.bind(hoisted_object_8),
    "string": schemaString,
    "undefined": schemaNull
};
const buildDescribeInput = {
    "string": describeString,
    "number": describeNumber,
    "boolean": describeBoolean,
    "null": describeNull,
    "undefined": describeNull,
    "object": hoisted_object_9.describeObjectDescribe.bind(hoisted_object_9),
    "anyArray": hoisted_anyArray_5.describeArrayDescribe.bind(hoisted_anyArray_5),
    "any": describeAny,
    "T1": hoisted_T1_0,
    "T2": hoisted_T2_0,
    "T3": hoisted_T3_0,
    "InvalidSchemaWithDate": hoisted_InvalidSchemaWithDate_0,
    "InvalidSchemaWithBigInt": hoisted_InvalidSchemaWithBigInt_0,
    "DiscriminatedUnion": hoisted_DiscriminatedUnion_0,
    "RecursiveTree": hoisted_RecursiveTree_0,
    "SemVer": hoisted_SemVer_0,
    "NonEmptyString": hoisted_NonEmptyString_0,
    "ValidCurrency": hoisted_ValidCurrency_0
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