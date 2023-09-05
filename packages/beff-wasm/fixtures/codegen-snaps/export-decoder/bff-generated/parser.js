
import vals from "./validators.js"; const { validators, add_path_to_errors, registerStringFormat, isCustomFormatInvalid } = vals;
const buildParsersInput = {
    "NotPublicRenamed": function(input) {
        let error_acc_0 = [];
        error_acc_0.push(...add_path_to_errors(validators.NotPublic(input), []));
        return error_acc_0;
    },
    "Password": function(input) {
        let error_acc_0 = [];
        error_acc_0.push(...add_path_to_errors(validators.Password(input), []));
        return error_acc_0;
    },
    "StartsWithA": function(input) {
        let error_acc_0 = [];
        error_acc_0.push(...add_path_to_errors(validators.StartsWithA(input), []));
        return error_acc_0;
    },
    "User": function(input) {
        let error_acc_0 = [];
        error_acc_0.push(...add_path_to_errors(validators.User(input), []));
        return error_acc_0;
    },
    "Users": function(input) {
        let error_acc_0 = [];
        if (Array.isArray(input)) {
            for(let index = 0; index < input.length; index++){
                const array_item_1 = input[index];
                error_acc_0.push(...add_path_to_errors(validators.User(array_item_1), [
                    "[" + index + "]"
                ]));
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [],
                "received": input
            });
        }
        return error_acc_0;
    }
};


class BffParseError {
  constructor(errors) {
    this.errors = errors;
  }
}
function buildParsers() {
  let decoders ={};
  Object.keys(buildParsersInput).forEach(k => {
    let v = buildParsersInput[k];
    const safeParse = (input) => {
      const validation_result = v(input);
      if (validation_result.length === 0) {
        return { success: true, data: input };
      }
      return { success: false, errors: validation_result };
    }
    const parse = (input) => {
      const safe = safeParse(input);
      if (safe.success) {
        return safe.data;
      }
      throw new BffParseError(safe.errors)
    };
    decoders[k] = {
      parse, safeParse
    };
  });
  return decoders;
}

export default { buildParsers, registerStringFormat };