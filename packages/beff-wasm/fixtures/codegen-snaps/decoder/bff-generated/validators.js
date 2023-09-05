

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

function ChildUser(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "ChildUser",
                    "id"
                ],
                "received": input["id"]
            });
        }
        error_acc_0.push(...add_path_to_errors(validators.User(input["user"]), [
            "ChildUser",
            "user"
        ]));
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "ChildUser"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function User(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "User",
                    "a"
                ],
                "received": input["a"]
            });
        }
        if (typeof input["b"] != "number") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "number",
                "path": [
                    "User",
                    "b"
                ],
                "received": input["b"]
            });
        }
        if (typeof input["c"] != "boolean") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "boolean",
                "path": [
                    "User",
                    "c"
                ],
                "received": input["c"]
            });
        }
        if (Array.isArray(input["c2"])) {
            for(let index = 0; index < input["c2"].length; index++){
                const array_item_1 = input["c2"][index];
                if (typeof array_item_1 != "boolean") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "expected_type": "boolean",
                        "path": [
                            "User",
                            "c2",
                            "[" + index + "]"
                        ],
                        "received": array_item_1
                    });
                }
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "User",
                    "c2"
                ],
                "received": input["c2"]
            });
        }
        if (input["childUser"] != null) {
            error_acc_0.push(...add_path_to_errors(validators.ChildUser(input["childUser"]), [
                "User",
                "childUser"
            ]));
        }
        if (Array.isArray(input["d"])) {
            for(let index = 0; index < input["d"].length; index++){
                const array_item_2 = input["d"][index];
                error_acc_0.push(...add_path_to_errors(validators.User(array_item_2), [
                    "User",
                    "d",
                    "[" + index + "]"
                ]));
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "User",
                    "d"
                ],
                "received": input["d"]
            });
        }
        if (input["f"] != null) {}
        if (input["g"] != "a") {
            error_acc_0.push({
                "error_kind": "NotEq",
                "expected_value": "a",
                "path": [
                    "User",
                    "g"
                ],
                "received": input["g"]
            });
        }
        let is_ok_3 = false;
        let error_acc_4 = [];
        if (input["h"] != "a") {
            error_acc_4.push({
                "error_kind": "NotEq",
                "expected_value": "a",
                "path": [
                    "User",
                    "h"
                ],
                "received": input["h"]
            });
        }
        is_ok_3 = is_ok_3 || error_acc_4.length === 0;
        let error_acc_5 = [];
        if (input["h"] != "b") {
            error_acc_5.push({
                "error_kind": "NotEq",
                "expected_value": "b",
                "path": [
                    "User",
                    "h"
                ],
                "received": input["h"]
            });
        }
        is_ok_3 = is_ok_3 || error_acc_5.length === 0;
        let error_acc_6 = [];
        if (input["h"] != "c") {
            error_acc_6.push({
                "error_kind": "NotEq",
                "expected_value": "c",
                "path": [
                    "User",
                    "h"
                ],
                "received": input["h"]
            });
        }
        is_ok_3 = is_ok_3 || error_acc_6.length === 0;
        if (!(is_ok_3)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "User",
                    "h"
                ],
                "received": input["h"]
            });
        }
        if (typeof input["i"] == "object" && input["i"] != null) {
            if (input["i"]["a"] != 1) {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "expected_value": 1,
                    "path": [
                        "User",
                        "i",
                        "a"
                    ],
                    "received": input["i"]["a"]
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnObject",
                "path": [
                    "User",
                    "i"
                ],
                "received": input["i"]
            });
        }
        if (typeof input["i"] == "object" && input["i"] != null) {
            if (input["i"]["b"] != 2) {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "expected_value": 2,
                    "path": [
                        "User",
                        "i",
                        "b"
                    ],
                    "received": input["i"]["b"]
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnObject",
                "path": [
                    "User",
                    "i"
                ],
                "received": input["i"]
            });
        }
        if (input["thisUser"] != null) {
            error_acc_0.push(...add_path_to_errors(validators.User(input["thisUser"]), [
                "User",
                "thisUser"
            ]));
        }
        if (input["thisUser2"] != null) {
            if (typeof input["thisUser2"] == "object" && input["thisUser2"] != null) {
                error_acc_0.push(...add_path_to_errors(validators.User(input["thisUser2"]["user"]), [
                    "User",
                    "thisUser2",
                    "user"
                ]));
            } else {
                error_acc_0.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "User",
                        "thisUser2"
                    ],
                    "received": input["thisUser2"]
                });
            }
        }
        let is_ok_7 = false;
        let error_acc_8 = [];
        if (typeof input["union"] != "string") {
            error_acc_8.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "User",
                    "union"
                ],
                "received": input["union"]
            });
        }
        is_ok_7 = is_ok_7 || error_acc_8.length === 0;
        let error_acc_9 = [];
        if (typeof input["union"] != "number") {
            error_acc_9.push({
                "error_kind": "NotTypeof",
                "expected_type": "number",
                "path": [
                    "User",
                    "union"
                ],
                "received": input["union"]
            });
        }
        is_ok_7 = is_ok_7 || error_acc_9.length === 0;
        if (!(is_ok_7)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "User",
                    "union"
                ],
                "received": input["union"]
            });
        }
        let is_ok_10 = false;
        let error_acc_11 = [];
        if (input["unionWithNull"] != null) {
            error_acc_11.push({
                "error_kind": "NotEq",
                "expected_value": null,
                "path": [
                    "User",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
            });
        }
        is_ok_10 = is_ok_10 || error_acc_11.length === 0;
        let error_acc_12 = [];
        if (typeof input["unionWithNull"] != "number") {
            error_acc_12.push({
                "error_kind": "NotTypeof",
                "expected_type": "number",
                "path": [
                    "User",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
            });
        }
        is_ok_10 = is_ok_10 || error_acc_12.length === 0;
        let error_acc_13 = [];
        if (Array.isArray(input["unionWithNull"])) {
            for(let index = 0; index < input["unionWithNull"].length; index++){
                const array_item_14 = input["unionWithNull"][index];
                error_acc_13.push(...add_path_to_errors(validators.ChildUser(array_item_14), [
                    "User",
                    "unionWithNull",
                    "[" + index + "]"
                ]));
            }
        } else {
            error_acc_13.push({
                "error_kind": "NotAnArray",
                "path": [
                    "User",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
            });
        }
        is_ok_10 = is_ok_10 || error_acc_13.length === 0;
        if (!(is_ok_10)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "User",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
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
const validators = {
    ChildUser: ChildUser,
    User: User
};

export default { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };