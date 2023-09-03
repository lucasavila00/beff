
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

function User(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["name"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "User",
                    "name"
                ],
                "received": input["name"],
                "expected_type": "string"
            });
        }
        if (typeof input["age"] != "number") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "User",
                    "age"
                ],
                "received": input["age"],
                "expected_type": "number"
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "User"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function NotPublic(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "NotPublic",
                    "a"
                ],
                "received": input["a"],
                "expected_type": "string"
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "NotPublic"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function StartsWithA(input) {
    let error_acc_0 = [];
    if (isCustomFormatInvalid("StartsWithA", input)) {
        error_acc_0.push({
            "error_kind": "StringFormatCheckFailed",
            "path": [
                "StartsWithA"
            ],
            "received": input,
            "expected_type": "StartsWithA"
        });
    }
    return error_acc_0;
}
function Password(input) {
    let error_acc_0 = [];
    if (isCustomFormatInvalid("password", input)) {
        error_acc_0.push({
            "error_kind": "StringFormatCheckFailed",
            "path": [
                "Password"
            ],
            "received": input,
            "expected_type": "password"
        });
    }
    return error_acc_0;
}
const validators = {
    User: User,
    NotPublic: NotPublic,
    StartsWithA: StartsWithA,
    Password: Password
};

export  { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };