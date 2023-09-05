

function add_path_to_errors(errors, path) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
    

const stringPredicates = {}
function registerStringFormat(name, predicate) {
  stringPredicates[name] = predicate;
}

// a hint to UIs to mask the input
registerStringFormat("password", () => true);

function isCustomFormatInvalid(key, value) {
  const predicate = stringPredicates[key];
  if (predicate == null) {
    throw new Error("unknown string format: " + key);
  }
  return !predicate(value);
}

function A(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "A",
                    "a"
                ],
                "received": input["a"]
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "A"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
const validators = {
    A: A
};

export default { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };