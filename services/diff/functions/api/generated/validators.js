

function add_path_to_errors(errors, path) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
    

const stringPredicates = {}
function registerStringFormat(name, predicate) {
  stringPredicates[name] = predicate;
}

function isCustomFormatInvalid(key, value) {
  const predicate = stringPredicates[key];
  if (predicate == null) {
    throw new Error("unknown string format: " + key);
  }
  return !predicate(value);
}

function MdResponse(input) {
    let error_acc_0 = [];
    let is_ok_1 = false;
    let error_acc_2 = [];
    if (typeof input == "object" && input != null) {
        if (input["_tag"] != "Heading") {
            error_acc_2.push({
                "error_kind": "NotEq",
                "expected_value": "Heading",
                "path": [
                    "MdResponse",
                    "_tag"
                ],
                "received": input["_tag"]
            });
        }
        if (typeof input["data"] != "string") {
            error_acc_2.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "MdResponse",
                    "data"
                ],
                "received": input["data"]
            });
        }
    } else {
        error_acc_2.push({
            "error_kind": "NotAnObject",
            "path": [
                "MdResponse"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_2.length === 0;
    let error_acc_3 = [];
    if (typeof input == "object" && input != null) {
        if (input["_tag"] != "Json") {
            error_acc_3.push({
                "error_kind": "NotEq",
                "expected_value": "Json",
                "path": [
                    "MdResponse",
                    "_tag"
                ],
                "received": input["_tag"]
            });
        }
        if (typeof input["data"] != "string") {
            error_acc_3.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "MdResponse",
                    "data"
                ],
                "received": input["data"]
            });
        }
    } else {
        error_acc_3.push({
            "error_kind": "NotAnObject",
            "path": [
                "MdResponse"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_3.length === 0;
    let error_acc_4 = [];
    if (typeof input == "object" && input != null) {
        if (input["_tag"] != "Text") {
            error_acc_4.push({
                "error_kind": "NotEq",
                "expected_value": "Text",
                "path": [
                    "MdResponse",
                    "_tag"
                ],
                "received": input["_tag"]
            });
        }
        if (typeof input["data"] != "string") {
            error_acc_4.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "MdResponse",
                    "data"
                ],
                "received": input["data"]
            });
        }
    } else {
        error_acc_4.push({
            "error_kind": "NotAnObject",
            "path": [
                "MdResponse"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_4.length === 0;
    let error_acc_5 = [];
    if (typeof input == "object" && input != null) {
        if (input["_tag"] != "TsTypes") {
            error_acc_5.push({
                "error_kind": "NotEq",
                "expected_value": "TsTypes",
                "path": [
                    "MdResponse",
                    "_tag"
                ],
                "received": input["_tag"]
            });
        }
        if (typeof input["data"] != "string") {
            error_acc_5.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "MdResponse",
                    "data"
                ],
                "received": input["data"]
            });
        }
    } else {
        error_acc_5.push({
            "error_kind": "NotAnObject",
            "path": [
                "MdResponse"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_5.length === 0;
    if (!(is_ok_1)) {
        error_acc_0.push({
            "error_kind": "InvalidUnion",
            "path": [
                "MdResponse"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
const validators = {
    MdResponse: MdResponse
};

export default { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };