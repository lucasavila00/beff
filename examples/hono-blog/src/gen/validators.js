
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

function Post(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Post",
                    "id"
                ],
                "received": input["id"],
                "expected_type": "string"
            });
        }
        if (typeof input["title"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Post",
                    "title"
                ],
                "received": input["title"],
                "expected_type": "string"
            });
        }
        if (typeof input["body"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Post",
                    "body"
                ],
                "received": input["body"],
                "expected_type": "string"
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "Post"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function Param(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["title"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Param",
                    "title"
                ],
                "received": input["title"],
                "expected_type": "string"
            });
        }
        if (typeof input["body"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Param",
                    "body"
                ],
                "received": input["body"],
                "expected_type": "string"
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "Param"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
const validators = {
    Post: Post,
    Param: Param
};

module.exports =  { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };