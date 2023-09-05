

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
        if (typeof input["age"] != "number") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "number",
                "path": [
                    "User",
                    "age"
                ],
                "received": input["age"]
            });
        }
        if (typeof input["name"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "User",
                    "name"
                ],
                "received": input["name"]
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
function Password(input) {
    let error_acc_0 = [];
    if (isCustomFormatInvalid("password", input)) {
        error_acc_0.push({
            "error_kind": "StringFormatCheckFailed",
            "expected_type": "password",
            "path": [
                "Password"
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
            "expected_type": "StartsWithA",
            "path": [
                "StartsWithA"
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
                "expected_type": "string",
                "path": [
                    "NotPublic",
                    "a"
                ],
                "received": input["a"]
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
const validators = {
    User: User,
    Password: Password,
    StartsWithA: StartsWithA,
    NotPublic: NotPublic
};

export default { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };