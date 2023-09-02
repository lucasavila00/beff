
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

function validate_ChildUser(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "ChildUser",
                    "id"
                ],
                "received": input["id"],
                "expected_type": "string"
            });
        }
        error_acc_0.push(...add_path_to_errors(validate_User(input["user"]), [
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
function validate_User(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "User",
                    "a"
                ],
                "received": input["a"],
                "expected_type": "string"
            });
        }
        if (typeof input["b"] != "number") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "User",
                    "b"
                ],
                "received": input["b"],
                "expected_type": "number"
            });
        }
        if (typeof input["c"] != "boolean") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "User",
                    "c"
                ],
                "received": input["c"],
                "expected_type": "boolean"
            });
        }
        if (Array.isArray(input["c2"])) {
            for (const array_item_1 of input["c2"]){
                if (typeof array_item_1 != "boolean") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "User",
                            "c2",
                            "[]"
                        ],
                        "received": array_item_1,
                        "expected_type": "boolean"
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
        if (Array.isArray(input["d"])) {
            for (const array_item_2 of input["d"]){
                error_acc_0.push(...add_path_to_errors(validate_User(array_item_2), [
                    "User",
                    "d",
                    "[]"
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
        if (input["childUser"] != null) {
            error_acc_0.push(...add_path_to_errors(validate_ChildUser(input["childUser"]), [
                "User",
                "childUser"
            ]));
        }
        if (input["thisUser"] != null) {
            error_acc_0.push(...add_path_to_errors(validate_User(input["thisUser"]), [
                "User",
                "thisUser"
            ]));
        }
        if (input["thisUser2"] != null) {
            if (typeof input["thisUser2"] == "object" && input["thisUser2"] != null) {
                error_acc_0.push(...add_path_to_errors(validate_User(input["thisUser2"]["user"]), [
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
        let is_ok_3 = false;
        let error_acc_4 = [];
        if (typeof input["union"] != "string") {
            error_acc_4.push({
                "error_kind": "NotTypeof",
                "path": [
                    "User",
                    "union"
                ],
                "received": input["union"],
                "expected_type": "string"
            });
        }
        is_ok_3 = is_ok_3 || error_acc_4.length === 0;
        let error_acc_5 = [];
        if (typeof input["union"] != "number") {
            error_acc_5.push({
                "error_kind": "NotTypeof",
                "path": [
                    "User",
                    "union"
                ],
                "received": input["union"],
                "expected_type": "number"
            });
        }
        is_ok_3 = is_ok_3 || error_acc_5.length === 0;
        if (!(is_ok_3)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "User",
                    "union"
                ],
                "received": input["union"]
            });
        }
        let is_ok_6 = false;
        let error_acc_7 = [];
        if (Array.isArray(input["unionWithNull"])) {
            for (const array_item_8 of input["unionWithNull"]){
                error_acc_7.push(...add_path_to_errors(validate_ChildUser(array_item_8), [
                    "User",
                    "unionWithNull",
                    "[]"
                ]));
            }
        } else {
            error_acc_7.push({
                "error_kind": "NotAnArray",
                "path": [
                    "User",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
            });
        }
        is_ok_6 = is_ok_6 || error_acc_7.length === 0;
        let error_acc_9 = [];
        if (typeof input["unionWithNull"] != "number") {
            error_acc_9.push({
                "error_kind": "NotTypeof",
                "path": [
                    "User",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"],
                "expected_type": "number"
            });
        }
        is_ok_6 = is_ok_6 || error_acc_9.length === 0;
        let error_acc_10 = [];
        if (input["unionWithNull"] != null) {
            error_acc_10.push({
                "error_kind": "NotEq",
                "path": [
                    "User",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"],
                "expected_value": null
            });
        }
        is_ok_6 = is_ok_6 || error_acc_10.length === 0;
        if (!(is_ok_6)) {
            error_acc_0.push({
                "error_kind": "InvalidUnion",
                "path": [
                    "User",
                    "unionWithNull"
                ],
                "received": input["unionWithNull"]
            });
        }
        if (input["f"] != null) {}
        if (input["g"] != "a") {
            error_acc_0.push({
                "error_kind": "NotEq",
                "path": [
                    "User",
                    "g"
                ],
                "received": input["g"],
                "expected_value": "a"
            });
        }
        let is_ok_11 = false;
        let error_acc_12 = [];
        if (input["h"] != "a") {
            error_acc_12.push({
                "error_kind": "NotEq",
                "path": [
                    "User",
                    "h"
                ],
                "received": input["h"],
                "expected_value": "a"
            });
        }
        is_ok_11 = is_ok_11 || error_acc_12.length === 0;
        let error_acc_13 = [];
        if (input["h"] != "b") {
            error_acc_13.push({
                "error_kind": "NotEq",
                "path": [
                    "User",
                    "h"
                ],
                "received": input["h"],
                "expected_value": "b"
            });
        }
        is_ok_11 = is_ok_11 || error_acc_13.length === 0;
        let error_acc_14 = [];
        if (input["h"] != "c") {
            error_acc_14.push({
                "error_kind": "NotEq",
                "path": [
                    "User",
                    "h"
                ],
                "received": input["h"],
                "expected_value": "c"
            });
        }
        is_ok_11 = is_ok_11 || error_acc_14.length === 0;
        if (!(is_ok_11)) {
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
                    "path": [
                        "User",
                        "i",
                        "a"
                    ],
                    "received": input["i"]["a"],
                    "expected_value": 1
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
                    "path": [
                        "User",
                        "i",
                        "b"
                    ],
                    "received": input["i"]["b"],
                    "expected_value": 2
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
const meta = [
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
                            "error_kind": "NotTypeof",
                            "path": [
                                'Path Parameter "id"'
                            ],
                            "received": input,
                            "expected_type": "string"
                        });
                    }
                    return error_acc_0;
                },
                "coercer": function(input) {
                    return coerce_string(input);
                }
            }
        ],
        "pattern": "/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_User(input), [
                "[GET] /{id}.response_body"
            ]));
            return error_acc_0;
        }
    }
];
const buildParsersInput = {};


function buildParsers() {
  let decoders ={};
  Object.keys(buildParsersInput).forEach(k => {
    let v = buildParsersInput[k];
    const safeParse = (input) => {
      const validation_result = v(input);
      if (validation_result.length === 0) {
        return { success: true, data: input };
      }
      return { success: false, errors: validation_result };
    }
    const parse = (input) => {
      const safe = safeParse(input);
      if (safe.success) {
        return safe.data;
      }
      throw new Error(JSON.stringify(safe.errors));
    };
    decoders[k] = {
      parse, safeParse
    };
  });
  return decoders;
}

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
      "ChildUser": {
        "properties": {
          "id": {
            "type": "string"
          },
          "user": {
            "$ref": "#/components/schemas/User"
          }
        },
        "required": [
          "id",
          "user"
        ],
        "type": "object"
      },
      "User": {
        "properties": {
          "a": {
            "type": "string"
          },
          "b": {
            "type": "number"
          },
          "c": {
            "type": "boolean"
          },
          "c2": {
            "items": {
              "type": "boolean"
            },
            "type": "array"
          },
          "childUser": {
            "$ref": "#/components/schemas/ChildUser"
          },
          "d": {
            "items": {
              "$ref": "#/components/schemas/User"
            },
            "type": "array"
          },
          "e": {},
          "f": {},
          "g": {
            "const": "a"
          },
          "h": {
            "enum": [
              "a",
              "b",
              "c"
            ]
          },
          "i": {
            "allOf": [
              {
                "properties": {
                  "a": {
                    "const": 1.0
                  }
                },
                "required": [
                  "a"
                ],
                "type": "object"
              },
              {
                "properties": {
                  "b": {
                    "const": 2.0
                  }
                },
                "required": [
                  "b"
                ],
                "type": "object"
              }
            ]
          },
          "thisUser": {
            "$ref": "#/components/schemas/User"
          },
          "thisUser2": {
            "properties": {
              "user": {
                "$ref": "#/components/schemas/User"
              }
            },
            "required": [
              "user"
            ],
            "type": "object"
          },
          "union": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              }
            ]
          },
          "unionWithNull": {
            "anyOf": [
              {
                "items": {
                  "$ref": "#/components/schemas/ChildUser"
                },
                "type": "array"
              },
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ]
          }
        },
        "required": [
          "a",
          "b",
          "c",
          "c2",
          "d",
          "union",
          "unionWithNull",
          "e",
          "g",
          "h",
          "i"
        ],
        "type": "object"
      }
    }
  },
  "info": {
    "title": "No title",
    "version": "0.0.0"
  },
  "openapi": "3.1.0",
  "paths": {
    "/{id}": {
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
    }
  }
} ;
export  { meta, schema, buildParsers };