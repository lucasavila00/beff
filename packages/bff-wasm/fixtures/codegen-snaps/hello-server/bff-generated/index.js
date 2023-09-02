
class CoercionFailure {}
function add_path_to_errors(errors, path) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
function coerce_string(input) {
  return input;
}
const isNumeric = (num) =>
  (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
  !isNaN(num );
function coerce_number(input) {
  if (isNumeric(input)) {
    return Number(input);
  }
  return new CoercionFailure();
}
function coerce_boolean(input) {
  if (input === "true" || input === "false") {
    return input === "true";
  }
  if (input === "1" || input === "0") {
    return input === "1";
  }
  return new CoercionFailure();
}
function coerce_union(input, ...cases) {
  for (const c of cases) {
    const r = coerce(c, input);
    if (!(r instanceof CoercionFailure)) {
      return r;
    }
  }
  return new CoercionFailure();
}
function coerce(coercer, value) {
  return coercer(value);
}

function validate_DataTypesKitchenSink(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["basic"] == "object" && input["basic"] != null) {
            if (typeof input["basic"]["a"] != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "basic",
                        "a"
                    ]
                });
            }
            if (typeof input["basic"]["b"] != "number") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "number"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "basic",
                        "b"
                    ]
                });
            }
            if (typeof input["basic"]["c"] != "boolean") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "boolean"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "basic",
                        "c"
                    ]
                });
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnObject"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "basic"
                ]
            });
        }
        if (Array.isArray(input["array1"])) {
            for (const array_item_1 of input["array1"]){
                if (typeof array_item_1 != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "DataTypesKitchenSink",
                            "array1",
                            "[]"
                        ]
                    });
                }
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "array1"
                ]
            });
        }
        if (Array.isArray(input["array2"])) {
            for (const array_item_2 of input["array2"]){
                if (typeof array_item_2 != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "DataTypesKitchenSink",
                            "array2",
                            "[]"
                        ]
                    });
                }
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "array2"
                ]
            });
        }
        if (Array.isArray(input["tuple1"])) {
            if (typeof input["tuple1"][0] != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple1",
                        "[0]"
                    ]
                });
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "tuple1"
                ]
            });
        }
        if (Array.isArray(input["tuple2"])) {
            if (typeof input["tuple2"][0] != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple2",
                        "[0]"
                    ]
                });
            }
            if (typeof input["tuple2"][1] != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple2",
                        "[1]"
                    ]
                });
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "tuple2"
                ]
            });
        }
        if (Array.isArray(input["tuple_rest"])) {
            if (typeof input["tuple_rest"][0] != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_rest",
                        "[0]"
                    ]
                });
            }
            if (typeof input["tuple_rest"][1] != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_rest",
                        "[1]"
                    ]
                });
            }
            if (Array.isArray(input["tuple_rest"].slice(2))) {
                for (const array_item_3 of input["tuple_rest"].slice(2)){
                    if (typeof array_item_3 != "number") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "number"
                            ],
                            "path": [
                                "DataTypesKitchenSink",
                                "tuple_rest",
                                "[]",
                                "[]"
                            ]
                        });
                    }
                }
            } else {
                error_acc_0.push({
                    "kind": [
                        "NotAnArray"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_rest",
                        "[]"
                    ]
                });
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "tuple_rest"
                ]
            });
        }
        let is_ok_4 = false;
        let error_acc_5 = [];
        if (typeof input["nullable"] != "string") {
            error_acc_5.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "nullable"
                ]
            });
        }
        is_ok_4 = is_ok_4 || error_acc_5.length === 0;
        let error_acc_6 = [];
        if (input["nullable"] != null) {
            error_acc_6.push({
                "kind": [
                    "NotEq",
                    null
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "nullable"
                ]
            });
        }
        is_ok_4 = is_ok_4 || error_acc_6.length === 0;
        if (!(is_ok_4)) {
            error_acc_0.push({
                "kind": [
                    "InvalidUnion"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "nullable"
                ]
            });
        }
        let is_ok_7 = false;
        let error_acc_8 = [];
        if (typeof input["many_nullable"] != "number") {
            error_acc_8.push({
                "kind": [
                    "NotTypeof",
                    "number"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "many_nullable"
                ]
            });
        }
        is_ok_7 = is_ok_7 || error_acc_8.length === 0;
        let error_acc_9 = [];
        if (typeof input["many_nullable"] != "string") {
            error_acc_9.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "many_nullable"
                ]
            });
        }
        is_ok_7 = is_ok_7 || error_acc_9.length === 0;
        let error_acc_10 = [];
        if (input["many_nullable"] != null) {
            error_acc_10.push({
                "kind": [
                    "NotEq",
                    null
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "many_nullable"
                ]
            });
        }
        is_ok_7 = is_ok_7 || error_acc_10.length === 0;
        if (!(is_ok_7)) {
            error_acc_0.push({
                "kind": [
                    "InvalidUnion"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "many_nullable"
                ]
            });
        }
        if (input["optional_prop"] != null) {
            if (typeof input["optional_prop"] != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "optional_prop"
                    ]
                });
            }
        }
        let is_ok_11 = false;
        let error_acc_12 = [];
        if (typeof input["union_with_undefined"] != "string") {
            error_acc_12.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "union_with_undefined"
                ]
            });
        }
        is_ok_11 = is_ok_11 || error_acc_12.length === 0;
        let error_acc_13 = [];
        if (input["union_with_undefined"] != null) {
            error_acc_13.push({
                "kind": [
                    "NotEq",
                    null
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "union_with_undefined"
                ]
            });
        }
        is_ok_11 = is_ok_11 || error_acc_13.length === 0;
        if (!(is_ok_11)) {
            error_acc_0.push({
                "kind": [
                    "InvalidUnion"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "union_with_undefined"
                ]
            });
        }
        let is_ok_14 = false;
        let error_acc_15 = [];
        if (typeof input["union_of_many"] != "string") {
            error_acc_15.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "union_of_many"
                ]
            });
        }
        is_ok_14 = is_ok_14 || error_acc_15.length === 0;
        let error_acc_16 = [];
        if (typeof input["union_of_many"] != "number") {
            error_acc_16.push({
                "kind": [
                    "NotTypeof",
                    "number"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "union_of_many"
                ]
            });
        }
        is_ok_14 = is_ok_14 || error_acc_16.length === 0;
        let error_acc_17 = [];
        if (typeof input["union_of_many"] != "boolean") {
            error_acc_17.push({
                "kind": [
                    "NotTypeof",
                    "boolean"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "union_of_many"
                ]
            });
        }
        is_ok_14 = is_ok_14 || error_acc_17.length === 0;
        if (!(is_ok_14)) {
            error_acc_0.push({
                "kind": [
                    "InvalidUnion"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "union_of_many"
                ]
            });
        }
        if (typeof input["literals"] == "object" && input["literals"] != null) {
            if (input["literals"]["a"] != "a") {
                error_acc_0.push({
                    "kind": [
                        "NotEq",
                        "a"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "literals",
                        "a"
                    ]
                });
            }
            if (input["literals"]["b"] != 1) {
                error_acc_0.push({
                    "kind": [
                        "NotEq",
                        1
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "literals",
                        "b"
                    ]
                });
            }
            if (input["literals"]["c"] != true) {
                error_acc_0.push({
                    "kind": [
                        "NotEq",
                        true
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "literals",
                        "c"
                    ]
                });
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnObject"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "literals"
                ]
            });
        }
        let is_ok_18 = false;
        let error_acc_19 = [];
        if (input["enum"] != "a") {
            error_acc_19.push({
                "kind": [
                    "NotEq",
                    "a"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "enum"
                ]
            });
        }
        is_ok_18 = is_ok_18 || error_acc_19.length === 0;
        let error_acc_20 = [];
        if (input["enum"] != "b") {
            error_acc_20.push({
                "kind": [
                    "NotEq",
                    "b"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "enum"
                ]
            });
        }
        is_ok_18 = is_ok_18 || error_acc_20.length === 0;
        let error_acc_21 = [];
        if (input["enum"] != "c") {
            error_acc_21.push({
                "kind": [
                    "NotEq",
                    "c"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "enum"
                ]
            });
        }
        is_ok_18 = is_ok_18 || error_acc_21.length === 0;
        if (!(is_ok_18)) {
            error_acc_0.push({
                "kind": [
                    "InvalidUnion"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "enum"
                ]
            });
        }
        if (Array.isArray(input["tuple_lit"])) {
            if (input["tuple_lit"][0] != "a") {
                error_acc_0.push({
                    "kind": [
                        "NotEq",
                        "a"
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_lit",
                        "[0]"
                    ]
                });
            }
            if (input["tuple_lit"][1] != 1) {
                error_acc_0.push({
                    "kind": [
                        "NotEq",
                        1
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_lit",
                        "[1]"
                    ]
                });
            }
            if (input["tuple_lit"][2] != true) {
                error_acc_0.push({
                    "kind": [
                        "NotEq",
                        true
                    ],
                    "path": [
                        "DataTypesKitchenSink",
                        "tuple_lit",
                        "[2]"
                    ]
                });
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "tuple_lit"
                ]
            });
        }
        if (input["str_template"] != "ab") {
            error_acc_0.push({
                "kind": [
                    "NotEq",
                    "ab"
                ],
                "path": [
                    "DataTypesKitchenSink",
                    "str_template"
                ]
            });
        }
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "DataTypesKitchenSink"
            ]
        });
    }
    return error_acc_0;
}
function validate_A(input) {
    let error_acc_0 = [];
    if (typeof input != "string") {
        error_acc_0.push({
            "kind": [
                "NotTypeof",
                "string"
            ],
            "path": [
                "A"
            ]
        });
    }
    return error_acc_0;
}
function validate_User(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "number") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "number"
                ],
                "path": [
                    "User",
                    "id"
                ]
            });
        }
        if (typeof input["name"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "User",
                    "name"
                ]
            });
        }
        if (Array.isArray(input["entities"])) {
            for (const array_item_1 of input["entities"]){
                error_acc_0.push(...add_path_to_errors(validate_UserEntity(array_item_1), [
                    "User",
                    "entities",
                    "[]"
                ]));
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "User",
                    "entities"
                ]
            });
        }
        if (input["optional_prop"] != null) {
            if (typeof input["optional_prop"] != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "User",
                        "optional_prop"
                    ]
                });
            }
        }
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "User"
            ]
        });
    }
    return error_acc_0;
}
function validate_UserEntity(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "UserEntity",
                    "id"
                ]
            });
        }
        error_acc_0.push(...add_path_to_errors(validate_A(input["idA"]), [
            "UserEntity",
            "idA"
        ]));
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "UserEntity"
            ]
        });
    }
    return error_acc_0;
}
const meta = [
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/data-types-kitchen-sink",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_DataTypesKitchenSink(input), [
                "[GET] /data-types-kitchen-sink.response_body"
            ]));
            return error_acc_0;
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/anon-func",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "[GET] /anon-func.response_body"
                    ]
                });
            }
            return error_acc_0;
        }
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "header",
                "name": "user_agent",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "string"
                            ],
                            "path": [
                                'Header Argument "user_agent"'
                            ]
                        });
                    }
                    return error_acc_0;
                },
                "coercer": function(input) {
                    return coerce_string(input);
                }
            },
            {
                "type": "cookie",
                "name": "ads_id",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "string"
                            ],
                            "path": [
                                'Cookie Argument "ads_id"'
                            ]
                        });
                    }
                    return error_acc_0;
                },
                "coercer": function(input) {
                    return coerce_string(input);
                }
            }
        ],
        "pattern": "/users",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (Array.isArray(input)) {
                for (const array_item_1 of input){
                    if (typeof array_item_1 != "string") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "string"
                            ],
                            "path": [
                                "[GET] /users.response_body",
                                "[]"
                            ]
                        });
                    }
                }
            } else {
                error_acc_0.push({
                    "kind": [
                        "NotAnArray"
                    ],
                    "path": [
                        "[GET] /users.response_body"
                    ]
                });
            }
            return error_acc_0;
        }
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "path",
                "name": "id",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "number") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "number"
                            ],
                            "path": [
                                'Path Parameter "id"'
                            ]
                        });
                    }
                    return error_acc_0;
                },
                "coercer": function(input) {
                    return coerce_number(input);
                }
            }
        ],
        "pattern": "/users/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_User(input), [
                "[GET] /users/{id}.response_body"
            ]));
            return error_acc_0;
        }
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "path",
                "name": "id",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "string"
                            ],
                            "path": [
                                'Path Parameter "id"'
                            ]
                        });
                    }
                    return error_acc_0;
                },
                "coercer": function(input) {
                    return coerce_string(input);
                }
            }
        ],
        "pattern": "/users2/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "[GET] /users2/{id}.response_body"
                    ]
                });
            }
            return error_acc_0;
        }
    },
    {
        "method_kind": "post",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "path",
                "name": "id",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "string"
                            ],
                            "path": [
                                'Path Parameter "id"'
                            ]
                        });
                    }
                    return error_acc_0;
                },
                "coercer": function(input) {
                    return coerce_string(input);
                }
            }
        ],
        "pattern": "/users2/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "[POST] /users2/{id}.response_body"
                    ]
                });
            }
            return error_acc_0;
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/users3",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "[GET] /users3.response_body"
                    ]
                });
            }
            return error_acc_0;
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/users4",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "[GET] /users4.response_body"
                    ]
                });
            }
            return error_acc_0;
        }
    },
    {
        "method_kind": "post",
        "params": [],
        "pattern": "/users4",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "kind": [
                        "NotTypeof",
                        "string"
                    ],
                    "path": [
                        "[POST] /users4.response_body"
                    ]
                });
            }
            return error_acc_0;
        }
    }
];


const schema =  {
  "components": {
    "responses": {
      "DecodeError": {
        "content": {
          "application/json": {
            "schema": {
              "properties": {
                "message": {
                  "type": "string"
                }
              },
              "required": [
                "message"
              ],
              "type": "object"
            }
          }
        },
        "description": "Invalid parameters or request body"
      },
      "UnexpectedError": {
        "content": {
          "application/json": {
            "schema": {
              "properties": {
                "message": {
                  "type": "string"
                }
              },
              "required": [
                "message"
              ],
              "type": "object"
            }
          }
        },
        "description": "Unexpected Error"
      }
    },
    "schemas": {
      "A": {
        "type": "string"
      },
      "DataTypesKitchenSink": {
        "properties": {
          "array1": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "array2": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "basic": {
            "properties": {
              "a": {
                "type": "string"
              },
              "b": {
                "type": "number"
              },
              "c": {
                "type": "boolean"
              }
            },
            "required": [
              "a",
              "b",
              "c"
            ],
            "type": "object"
          },
          "enum": {
            "enum": [
              "a",
              "b",
              "c"
            ]
          },
          "literals": {
            "properties": {
              "a": {
                "const": "a"
              },
              "b": {
                "const": 1.0
              },
              "c": {
                "const": true
              }
            },
            "required": [
              "a",
              "b",
              "c"
            ],
            "type": "object"
          },
          "many_nullable": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "nullable": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "optional_prop": {
            "type": "string"
          },
          "str_template": {
            "const": "ab"
          },
          "tuple1": {
            "maxItems": 1.0,
            "minItems": 1.0,
            "prefixItems": [
              {
                "type": "string"
              }
            ],
            "type": "array"
          },
          "tuple2": {
            "maxItems": 2.0,
            "minItems": 2.0,
            "prefixItems": [
              {
                "type": "string"
              },
              {
                "type": "string"
              }
            ],
            "type": "array"
          },
          "tuple_lit": {
            "maxItems": 3.0,
            "minItems": 3.0,
            "prefixItems": [
              {
                "const": "a"
              },
              {
                "const": 1.0
              },
              {
                "const": true
              }
            ],
            "type": "array"
          },
          "tuple_rest": {
            "items": {
              "type": "number"
            },
            "prefixItems": [
              {
                "type": "string"
              },
              {
                "type": "string"
              }
            ],
            "type": "array"
          },
          "union_of_many": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              },
              {
                "type": "boolean"
              }
            ]
          },
          "union_with_undefined": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          }
        },
        "required": [
          "basic",
          "array1",
          "array2",
          "tuple1",
          "tuple2",
          "tuple_rest",
          "nullable",
          "many_nullable",
          "union_with_undefined",
          "union_of_many",
          "literals",
          "enum",
          "tuple_lit",
          "str_template"
        ],
        "type": "object"
      },
      "User": {
        "properties": {
          "entities": {
            "items": {
              "$ref": "#/components/schemas/UserEntity"
            },
            "type": "array"
          },
          "id": {
            "type": "number"
          },
          "name": {
            "type": "string"
          },
          "optional_prop": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "name",
          "entities"
        ],
        "type": "object"
      },
      "UserEntity": {
        "properties": {
          "id": {
            "type": "string"
          },
          "idA": {
            "$ref": "#/components/schemas/A"
          }
        },
        "required": [
          "id",
          "idA"
        ],
        "type": "object"
      }
    }
  },
  "info": {
    "description": "Optional multiline or single-line description in [CommonMark](http://commonmark.org/help/) or HTML.",
    "title": "Sample API",
    "version": "0.1.9"
  },
  "openapi": "3.1.0",
  "paths": {
    "/anon-func": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "string"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    },
    "/data-types-kitchen-sink": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DataTypesKitchenSink"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    },
    "/users": {
      "get": {
        "parameters": [
          {
            "in": "header",
            "name": "user_agent",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "in": "cookie",
            "name": "ads_id",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "type": "string"
                  },
                  "type": "array"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    },
    "/users/{id}": {
      "get": {
        "parameters": [
          {
            "description": "The user id.",
            "in": "path",
            "name": "id",
            "required": true,
            "schema": {
              "type": "number"
            }
          }
        ],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    },
    "/users2/{id}": {
      "get": {
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "string"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      },
      "post": {
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "string"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    },
    "/users3": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "string"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    },
    "/users4": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "string"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      },
      "post": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "string"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    }
  }
} ;
export  { meta, schema };