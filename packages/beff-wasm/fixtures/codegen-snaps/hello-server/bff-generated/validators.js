
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

function DataTypesKitchenSink(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["basic"] == "object" && input["basic"] != null) {
            if (typeof input["basic"]["a"] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "DataTypesKitchenSink",
                        "basic",
                        "a"
                    ],
                    "received": input["basic"]["a"],
                    "expected_type": "string"
                });
            }
            if (typeof input["basic"]["b"] != "number") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "DataTypesKitchenSink",
                        "basic",
                        "b"
                    ],
                    "received": input["basic"]["b"],
                    "expected_type": "number"
                });
            }
            if (typeof input["basic"]["c"] != "boolean") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "DataTypesKitchenSink",
                        "basic",
                        "c"
                    ],
                    "received": input["basic"]["c"],
                    "expected_type": "boolean"
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnObject",
                "path": [
                    "DataTypesKitchenSink",
                    "basic"
                ],
                "received": input["basic"]
            });
        }
        if (Array.isArray(input["array1"])) {
            for(let index = 0; index < input["array1"].length; index++){
                const array_item_1 = input["array1"][index];
                if (typeof array_item_1 != "string") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "DataTypesKitchenSink",
                            "array1",
                            "[" + index + "]"
                        ],
                        "received": array_item_1,
                        "expected_type": "string"
                    });
                }
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "DataTypesKitchenSink",
                    "array1"
                ],
                "received": input["array1"]
            });
        }
        if (Array.isArray(input["array2"])) {
            for(let index = 0; index < input["array2"].length; index++){
                const array_item_2 = input["array2"][index];
                if (typeof array_item_2 != "string") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "DataTypesKitchenSink",
                            "array2",
                            "[" + index + "]"
                        ],
                        "received": array_item_2,
                        "expected_type": "string"
                    });
                }
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "DataTypesKitchenSink",
                    "array2"
                ],
                "received": input["array2"]
            });
        }
        if (Array.isArray(input["tuple1"])) {
            if (typeof input["tuple1"][0] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple1",
                        "[0]"
                    ],
                    "received": input["tuple1"][0],
                    "expected_type": "string"
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "DataTypesKitchenSink",
                    "tuple1"
                ],
                "received": input["tuple1"]
            });
        }
        if (Array.isArray(input["tuple2"])) {
            if (typeof input["tuple2"][0] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple2",
                        "[0]"
                    ],
                    "received": input["tuple2"][0],
                    "expected_type": "string"
                });
            }
            if (typeof input["tuple2"][1] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple2",
                        "[1]"
                    ],
                    "received": input["tuple2"][1],
                    "expected_type": "string"
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "DataTypesKitchenSink",
                    "tuple2"
                ],
                "received": input["tuple2"]
            });
        }
        if (Array.isArray(input["tuple_rest"])) {
            if (typeof input["tuple_rest"][0] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_rest",
                        "[0]"
                    ],
                    "received": input["tuple_rest"][0],
                    "expected_type": "string"
                });
            }
            if (typeof input["tuple_rest"][1] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_rest",
                        "[1]"
                    ],
                    "received": input["tuple_rest"][1],
                    "expected_type": "string"
                });
            }
            if (Array.isArray(input["tuple_rest"].slice(2))) {
                for(let index = 0; index < input["tuple_rest"].slice(2).length; index++){
                    const array_item_3 = input["tuple_rest"].slice(2)[index];
                    if (typeof array_item_3 != "number") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "path": [
                                "DataTypesKitchenSink",
                                "tuple_rest",
                                "[" + index + "]",
                                "[" + index + "]"
                            ],
                            "received": array_item_3,
                            "expected_type": "number"
                        });
                    }
                }
            } else {
                error_acc_0.push({
                    "error_kind": "NotAnArray",
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_rest",
                        "[" + index + "]"
                    ],
                    "received": input["tuple_rest"].slice(2)
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "DataTypesKitchenSink",
                    "tuple_rest"
                ],
                "received": input["tuple_rest"]
            });
        }
        let is_ok_4 = false;
        let error_acc_5 = [];
        if (typeof input["nullable"] != "string") {
            error_acc_5.push({
                "error_kind": "NotTypeof",
                "path": [
                    "DataTypesKitchenSink",
                    "nullable"
                ],
                "received": input["nullable"],
                "expected_type": "string"
            });
        }
        is_ok_4 = is_ok_4 || error_acc_5.length === 0;
        let error_acc_6 = [];
        if (input["nullable"] != null) {
            error_acc_6.push({
                "error_kind": "NotEq",
                "path": [
                    "DataTypesKitchenSink",
                    "nullable"
                ],
                "received": input["nullable"],
                "expected_value": null
            });
        }
        is_ok_4 = is_ok_4 || error_acc_6.length === 0;
        if (!(is_ok_4)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "DataTypesKitchenSink",
                    "nullable"
                ],
                "received": input["nullable"]
            });
        }
        let is_ok_7 = false;
        let error_acc_8 = [];
        if (typeof input["many_nullable"] != "number") {
            error_acc_8.push({
                "error_kind": "NotTypeof",
                "path": [
                    "DataTypesKitchenSink",
                    "many_nullable"
                ],
                "received": input["many_nullable"],
                "expected_type": "number"
            });
        }
        is_ok_7 = is_ok_7 || error_acc_8.length === 0;
        let error_acc_9 = [];
        if (typeof input["many_nullable"] != "string") {
            error_acc_9.push({
                "error_kind": "NotTypeof",
                "path": [
                    "DataTypesKitchenSink",
                    "many_nullable"
                ],
                "received": input["many_nullable"],
                "expected_type": "string"
            });
        }
        is_ok_7 = is_ok_7 || error_acc_9.length === 0;
        let error_acc_10 = [];
        if (input["many_nullable"] != null) {
            error_acc_10.push({
                "error_kind": "NotEq",
                "path": [
                    "DataTypesKitchenSink",
                    "many_nullable"
                ],
                "received": input["many_nullable"],
                "expected_value": null
            });
        }
        is_ok_7 = is_ok_7 || error_acc_10.length === 0;
        if (!(is_ok_7)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "DataTypesKitchenSink",
                    "many_nullable"
                ],
                "received": input["many_nullable"]
            });
        }
        if (input["optional_prop"] != null) {
            if (typeof input["optional_prop"] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "DataTypesKitchenSink",
                        "optional_prop"
                    ],
                    "received": input["optional_prop"],
                    "expected_type": "string"
                });
            }
        }
        let is_ok_11 = false;
        let error_acc_12 = [];
        if (typeof input["union_with_undefined"] != "string") {
            error_acc_12.push({
                "error_kind": "NotTypeof",
                "path": [
                    "DataTypesKitchenSink",
                    "union_with_undefined"
                ],
                "received": input["union_with_undefined"],
                "expected_type": "string"
            });
        }
        is_ok_11 = is_ok_11 || error_acc_12.length === 0;
        let error_acc_13 = [];
        if (input["union_with_undefined"] != null) {
            error_acc_13.push({
                "error_kind": "NotEq",
                "path": [
                    "DataTypesKitchenSink",
                    "union_with_undefined"
                ],
                "received": input["union_with_undefined"],
                "expected_value": null
            });
        }
        is_ok_11 = is_ok_11 || error_acc_13.length === 0;
        if (!(is_ok_11)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "DataTypesKitchenSink",
                    "union_with_undefined"
                ],
                "received": input["union_with_undefined"]
            });
        }
        let is_ok_14 = false;
        let error_acc_15 = [];
        if (typeof input["union_of_many"] != "string") {
            error_acc_15.push({
                "error_kind": "NotTypeof",
                "path": [
                    "DataTypesKitchenSink",
                    "union_of_many"
                ],
                "received": input["union_of_many"],
                "expected_type": "string"
            });
        }
        is_ok_14 = is_ok_14 || error_acc_15.length === 0;
        let error_acc_16 = [];
        if (typeof input["union_of_many"] != "number") {
            error_acc_16.push({
                "error_kind": "NotTypeof",
                "path": [
                    "DataTypesKitchenSink",
                    "union_of_many"
                ],
                "received": input["union_of_many"],
                "expected_type": "number"
            });
        }
        is_ok_14 = is_ok_14 || error_acc_16.length === 0;
        let error_acc_17 = [];
        if (typeof input["union_of_many"] != "boolean") {
            error_acc_17.push({
                "error_kind": "NotTypeof",
                "path": [
                    "DataTypesKitchenSink",
                    "union_of_many"
                ],
                "received": input["union_of_many"],
                "expected_type": "boolean"
            });
        }
        is_ok_14 = is_ok_14 || error_acc_17.length === 0;
        if (!(is_ok_14)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "DataTypesKitchenSink",
                    "union_of_many"
                ],
                "received": input["union_of_many"]
            });
        }
        if (typeof input["literals"] == "object" && input["literals"] != null) {
            if (input["literals"]["a"] != "a") {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "path": [
                        "DataTypesKitchenSink",
                        "literals",
                        "a"
                    ],
                    "received": input["literals"]["a"],
                    "expected_value": "a"
                });
            }
            if (input["literals"]["b"] != 1) {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "path": [
                        "DataTypesKitchenSink",
                        "literals",
                        "b"
                    ],
                    "received": input["literals"]["b"],
                    "expected_value": 1
                });
            }
            if (input["literals"]["c"] != true) {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "path": [
                        "DataTypesKitchenSink",
                        "literals",
                        "c"
                    ],
                    "received": input["literals"]["c"],
                    "expected_value": true
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnObject",
                "path": [
                    "DataTypesKitchenSink",
                    "literals"
                ],
                "received": input["literals"]
            });
        }
        let is_ok_18 = false;
        let error_acc_19 = [];
        if (input["enum"] != "a") {
            error_acc_19.push({
                "error_kind": "NotEq",
                "path": [
                    "DataTypesKitchenSink",
                    "enum"
                ],
                "received": input["enum"],
                "expected_value": "a"
            });
        }
        is_ok_18 = is_ok_18 || error_acc_19.length === 0;
        let error_acc_20 = [];
        if (input["enum"] != "b") {
            error_acc_20.push({
                "error_kind": "NotEq",
                "path": [
                    "DataTypesKitchenSink",
                    "enum"
                ],
                "received": input["enum"],
                "expected_value": "b"
            });
        }
        is_ok_18 = is_ok_18 || error_acc_20.length === 0;
        let error_acc_21 = [];
        if (input["enum"] != "c") {
            error_acc_21.push({
                "error_kind": "NotEq",
                "path": [
                    "DataTypesKitchenSink",
                    "enum"
                ],
                "received": input["enum"],
                "expected_value": "c"
            });
        }
        is_ok_18 = is_ok_18 || error_acc_21.length === 0;
        if (!(is_ok_18)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "DataTypesKitchenSink",
                    "enum"
                ],
                "received": input["enum"]
            });
        }
        if (Array.isArray(input["tuple_lit"])) {
            if (input["tuple_lit"][0] != "a") {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_lit",
                        "[0]"
                    ],
                    "received": input["tuple_lit"][0],
                    "expected_value": "a"
                });
            }
            if (input["tuple_lit"][1] != 1) {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_lit",
                        "[1]"
                    ],
                    "received": input["tuple_lit"][1],
                    "expected_value": 1
                });
            }
            if (input["tuple_lit"][2] != true) {
                error_acc_0.push({
                    "error_kind": "NotEq",
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_lit",
                        "[2]"
                    ],
                    "received": input["tuple_lit"][2],
                    "expected_value": true
                });
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "DataTypesKitchenSink",
                    "tuple_lit"
                ],
                "received": input["tuple_lit"]
            });
        }
        if (input["str_template"] != "ab") {
            error_acc_0.push({
                "error_kind": "NotEq",
                "path": [
                    "DataTypesKitchenSink",
                    "str_template"
                ],
                "received": input["str_template"],
                "expected_value": "ab"
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "DataTypesKitchenSink"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function A(input) {
    let error_acc_0 = [];
    if (typeof input != "string") {
        error_acc_0.push({
            "error_kind": "NotTypeof",
            "path": [
                "A"
            ],
            "received": input,
            "expected_type": "string"
        });
    }
    return error_acc_0;
}
function User(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "number") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "User",
                    "id"
                ],
                "received": input["id"],
                "expected_type": "number"
            });
        }
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
        if (Array.isArray(input["entities"])) {
            for(let index = 0; index < input["entities"].length; index++){
                const array_item_1 = input["entities"][index];
                error_acc_0.push(...add_path_to_errors(validators.UserEntity(array_item_1), [
                    "User",
                    "entities",
                    "[" + index + "]"
                ]));
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [
                    "User",
                    "entities"
                ],
                "received": input["entities"]
            });
        }
        if (input["optional_prop"] != null) {
            if (typeof input["optional_prop"] != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "User",
                        "optional_prop"
                    ],
                    "received": input["optional_prop"],
                    "expected_type": "string"
                });
            }
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
function UserEntity(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "UserEntity",
                    "id"
                ],
                "received": input["id"],
                "expected_type": "string"
            });
        }
        error_acc_0.push(...add_path_to_errors(validators.A(input["idA"]), [
            "UserEntity",
            "idA"
        ]));
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "UserEntity"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
const validators = {
    DataTypesKitchenSink: DataTypesKitchenSink,
    A: A,
    User: User,
    UserEntity: UserEntity
};

export  { validators, isCustomFormatInvalid, registerStringFormat, add_path_to_errors };