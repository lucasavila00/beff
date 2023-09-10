

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

function AllTypes(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["allBooleans"] != "boolean") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "boolean",
                "path": [
                    "AllTypes",
                    "allBooleans"
                ],
                "received": input["allBooleans"]
            });
        }
        if (typeof input["allNumbers"] != "number") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "number",
                "path": [
                    "AllTypes",
                    "allNumbers"
                ],
                "received": input["allNumbers"]
            });
        }
        if (typeof input["allStrings"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "AllTypes",
                    "allStrings"
                ],
                "received": input["allStrings"]
            });
        }
        if (Array.isArray(input["arrayOfStrings"])) {
            for(let index = 0; index < input["arrayOfStrings"].length; index++){
                const array_item_1 = input["arrayOfStrings"][index];
                if (typeof array_item_1 != "string") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "expected_type": "string",
                        "path": [
                            "AllTypes",
                            "arrayOfStrings",
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
                    "AllTypes",
                    "arrayOfStrings"
                ],
                "received": input["arrayOfStrings"]
            });
        }
        if (input["booleanLiteral"] != true) {
            error_acc_0.push({
                "error_kind": "NotEq",
                "expected_value": true,
                "path": [
                    "AllTypes",
                    "booleanLiteral"
                ],
                "received": input["booleanLiteral"]
            });
        }
        error_acc_0.push(...add_path_to_errors(validators.Post(input["interface"]), [
            "AllTypes",
            "interface"
        ]));
        if (typeof input["intersection"] == "object" && input["intersection"] != null) {
            if (input["intersection"]["a"] != 1) {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "expected_value": 1,
                    "path": [
                        "AllTypes",
                        "intersection",
                        "a"
                    ],
                    "received": input["intersection"]["a"]
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnObject",
                "path": [
                    "AllTypes",
                    "intersection"
                ],
                "received": input["intersection"]
            });
        }
        if (typeof input["intersection"] == "object" && input["intersection"] != null) {
            if (input["intersection"]["b"] != 2) {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "expected_value": 2,
                    "path": [
                        "AllTypes",
                        "intersection",
                        "b"
                    ],
                    "received": input["intersection"]["b"]
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnObject",
                "path": [
                    "AllTypes",
                    "intersection"
                ],
                "received": input["intersection"]
            });
        }
        if (input["null"] != null) {
            error_acc_0.push({
                "error_kind": "NotEq",
                "expected_value": null,
                "path": [
                    "AllTypes",
                    "null"
                ],
                "received": input["null"]
            });
        }
        if (input["numberLiteral"] != 123) {
            error_acc_0.push({
                "error_kind": "NotEq",
                "expected_value": 123,
                "path": [
                    "AllTypes",
                    "numberLiteral"
                ],
                "received": input["numberLiteral"]
            });
        }
        if (input["optionalType"] != null) {
            if (Array.isArray(input["optionalType"])) {
                for(let index = 0; index < input["optionalType"].length; index++){
                    const array_item_2 = input["optionalType"][index];
                    if (typeof array_item_2 != "number") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "number",
                            "path": [
                                "AllTypes",
                                "optionalType",
                                "[" + index + "]"
                            ],
                            "received": array_item_2
                        });
                    }
                }
            } else {
                error_acc_0.push({
                    "error_kind": "NotAnArray",
                    "path": [
                        "AllTypes",
                        "optionalType"
                    ],
                    "received": input["optionalType"]
                });
            }
        }
        if (input["stringLiteral"] != "a") {
            error_acc_0.push({
                "error_kind": "NotEq",
                "expected_value": "a",
                "path": [
                    "AllTypes",
                    "stringLiteral"
                ],
                "received": input["stringLiteral"]
            });
        }
        if (Array.isArray(input["tuple"])) {
            if (typeof input["tuple"][0] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "string",
                    "path": [
                        "AllTypes",
                        "tuple",
                        "[0]"
                    ],
                    "received": input["tuple"][0]
                });
            }
            if (typeof input["tuple"][1] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "string",
                    "path": [
                        "AllTypes",
                        "tuple",
                        "[1]"
                    ],
                    "received": input["tuple"][1]
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "AllTypes",
                    "tuple"
                ],
                "received": input["tuple"]
            });
        }
        if (Array.isArray(input["tupleWithRest"])) {
            if (typeof input["tupleWithRest"][0] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "string",
                    "path": [
                        "AllTypes",
                        "tupleWithRest",
                        "[0]"
                    ],
                    "received": input["tupleWithRest"][0]
                });
            }
            if (typeof input["tupleWithRest"][1] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "string",
                    "path": [
                        "AllTypes",
                        "tupleWithRest",
                        "[1]"
                    ],
                    "received": input["tupleWithRest"][1]
                });
            }
            if (Array.isArray(input["tupleWithRest"].slice(2))) {
                for(let index = 0; index < input["tupleWithRest"].slice(2).length; index++){
                    const array_item_3 = input["tupleWithRest"].slice(2)[index];
                    if (typeof array_item_3 != "number") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "number",
                            "path": [
                                "AllTypes",
                                "tupleWithRest",
                                "[" + index + "]",
                                "[" + index + "]"
                            ],
                            "received": array_item_3
                        });
                    }
                }
            } else {
                error_acc_0.push({
                    "error_kind": "NotAnArray",
                    "path": [
                        "AllTypes",
                        "tupleWithRest",
                        "[" + index + "]"
                    ],
                    "received": input["tupleWithRest"].slice(2)
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "AllTypes",
                    "tupleWithRest"
                ],
                "received": input["tupleWithRest"]
            });
        }
        error_acc_0.push(...add_path_to_errors(validators.User(input["typeReference"]), [
            "AllTypes",
            "typeReference"
        ]));
        if (input["undefined"] != null) {
            error_acc_0.push({
                "error_kind": "NotEq",
                "expected_value": null,
                "path": [
                    "AllTypes",
                    "undefined"
                ],
                "received": input["undefined"]
            });
        }
        let is_ok_4 = false;
        let error_acc_5 = [];
        if (input["unionOfLiterals"] != "a") {
            error_acc_5.push({
                "error_kind": "NotEq",
                "expected_value": "a",
                "path": [
                    "AllTypes",
                    "unionOfLiterals"
                ],
                "received": input["unionOfLiterals"]
            });
        }
        is_ok_4 = is_ok_4 || error_acc_5.length === 0;
        let error_acc_6 = [];
        if (input["unionOfLiterals"] != "b") {
            error_acc_6.push({
                "error_kind": "NotEq",
                "expected_value": "b",
                "path": [
                    "AllTypes",
                    "unionOfLiterals"
                ],
                "received": input["unionOfLiterals"]
            });
        }
        is_ok_4 = is_ok_4 || error_acc_6.length === 0;
        let error_acc_7 = [];
        if (input["unionOfLiterals"] != "c") {
            error_acc_7.push({
                "error_kind": "NotEq",
                "expected_value": "c",
                "path": [
                    "AllTypes",
                    "unionOfLiterals"
                ],
                "received": input["unionOfLiterals"]
            });
        }
        is_ok_4 = is_ok_4 || error_acc_7.length === 0;
        if (!(is_ok_4)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "AllTypes",
                    "unionOfLiterals"
                ],
                "received": input["unionOfLiterals"]
            });
        }
        let is_ok_8 = false;
        let error_acc_9 = [];
        if (typeof input["unionOfTypes"] != "string") {
            error_acc_9.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "AllTypes",
                    "unionOfTypes"
                ],
                "received": input["unionOfTypes"]
            });
        }
        is_ok_8 = is_ok_8 || error_acc_9.length === 0;
        let error_acc_10 = [];
        if (typeof input["unionOfTypes"] != "number") {
            error_acc_10.push({
                "error_kind": "NotTypeof",
                "expected_type": "number",
                "path": [
                    "AllTypes",
                    "unionOfTypes"
                ],
                "received": input["unionOfTypes"]
            });
        }
        is_ok_8 = is_ok_8 || error_acc_10.length === 0;
        if (!(is_ok_8)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "AllTypes",
                    "unionOfTypes"
                ],
                "received": input["unionOfTypes"]
            });
        }
        let is_ok_11 = false;
        let error_acc_12 = [];
        if (input["unionWithNull"] != null) {
            error_acc_12.push({
                "error_kind": "NotEq",
                "expected_value": null,
                "path": [
                    "AllTypes",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
            });
        }
        is_ok_11 = is_ok_11 || error_acc_12.length === 0;
        let error_acc_13 = [];
        if (typeof input["unionWithNull"] != "number") {
            error_acc_13.push({
                "error_kind": "NotTypeof",
                "expected_type": "number",
                "path": [
                    "AllTypes",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
            });
        }
        is_ok_11 = is_ok_11 || error_acc_13.length === 0;
        let error_acc_14 = [];
        if (Array.isArray(input["unionWithNull"])) {
            for(let index = 0; index < input["unionWithNull"].length; index++){
                const array_item_15 = input["unionWithNull"][index];
                error_acc_14.push(...add_path_to_errors(validators.User(array_item_15), [
                    "AllTypes",
                    "unionWithNull",
                    "[" + index + "]"
                ]));
            }
        } else {
            error_acc_14.push({
                "error_kind": "NotAnArray",
                "path": [
                    "AllTypes",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
            });
        }
        is_ok_11 = is_ok_11 || error_acc_14.length === 0;
        if (!(is_ok_11)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "AllTypes",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "AllTypes"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function Post(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["content"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "Post",
                    "content"
                ],
                "received": input["content"]
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
function User(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (Array.isArray(input["friends"])) {
            for(let index = 0; index < input["friends"].length; index++){
                const array_item_1 = input["friends"][index];
                error_acc_0.push(...add_path_to_errors(validators.User(array_item_1), [
                    "User",
                    "friends",
                    "[" + index + "]"
                ]));
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "User",
                    "friends"
                ],
                "received": input["friends"]
            });
        }
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "User",
                    "id"
                ],
                "received": input["id"]
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
    AllTypes: AllTypes,
    Post: Post,
    User: User
};

export default { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };