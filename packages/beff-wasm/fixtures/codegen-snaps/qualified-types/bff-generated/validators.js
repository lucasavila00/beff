

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

function UserEntityOriginal(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "UserEntityOriginal",
                    "id"
                ],
                "received": input["id"]
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "UserEntityOriginal"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function Abc123(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "Abc123",
                    "a"
                ],
                "received": input["a"]
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "Abc123"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function Def(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "Def",
                    "a"
                ],
                "received": input["a"]
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "Def"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function XYZ(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "number") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "number",
                "path": [
                    "XYZ",
                    "a"
                ],
                "received": input["a"]
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "XYZ"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function AAAAA(input) {
    let error_acc_0 = [];
    if (input != 123) {
        error_acc_0.push({
            "error_kind": "NotEq",
            "expected_value": 123,
            "path": [
                "AAAAA"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
const validators = {
    UserEntityOriginal: UserEntityOriginal,
    Abc123: Abc123,
    Def: Def,
    XYZ: XYZ,
    AAAAA: AAAAA
};

export default { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };