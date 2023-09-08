
Object.defineProperty(exports, "__esModule", {
  value: true
});
    

function add_path_to_errors(errors, path) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
    

const stringPredicates = {}
function registerStringFormat(name, predicate) {
  stringPredicates[name] = predicate;
}

// a hint to UIs to mask the input

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
        if (typeof input["body"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "Post",
                    "body"
                ],
                "received": input["body"]
            });
        }
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "Post",
                    "id"
                ],
                "received": input["id"]
            });
        }
        if (typeof input["title"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "Post",
                    "title"
                ],
                "received": input["title"]
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
        if (typeof input["body"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "Param",
                    "body"
                ],
                "received": input["body"]
            });
        }
        if (typeof input["title"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "Param",
                    "title"
                ],
                "received": input["title"]
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

exports.default = { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };