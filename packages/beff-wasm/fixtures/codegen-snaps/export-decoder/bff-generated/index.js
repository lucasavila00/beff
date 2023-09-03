
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

function validate_User(input) {
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
function validate_NotPublic(input) {
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
function validate_StartsWithA(input) {
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
function validate_Password(input) {
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
const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "path",
                "name": "name",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "path": [
                                "name"
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
        "pattern": "/{name}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_User(input), [
                "[GET] /{name}.response_body"
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
                "name": "uuid",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "path": [
                                "uuid"
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
            },
            {
                "type": "query",
                "name": "p",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    error_acc_0.push(...add_path_to_errors(validate_Password(input), [
                        "p"
                    ]));
                    return error_acc_0;
                },
                "coercer": function(input) {
                    return coerce_string(input);
                }
            }
        ],
        "pattern": "/check-uuid/{uuid}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_StartsWithA(input), [
                "[GET] /check-uuid/{uuid}.response_body"
            ]));
            return error_acc_0;
        }
    }
];
const buildParsersInput = {
    "User": function(input) {
        let error_acc_0 = [];
        error_acc_0.push(...add_path_to_errors(validate_User(input), []));
        return error_acc_0;
    },
    "Users": function(input) {
        let error_acc_0 = [];
        if (Array.isArray(input)) {
            for(let index = 0; index < input.length; index++){
                const array_item_1 = input[index];
                error_acc_0.push(...add_path_to_errors(validate_User(array_item_1), [
                    "[" + index + "]"
                ]));
            }
        } else {
            error_acc_0.push({
                "error_kind": "NotAnArray",
                "path": [],
                "received": input
            });
        }
        return error_acc_0;
    },
    "NotPublicRenamed": function(input) {
        let error_acc_0 = [];
        error_acc_0.push(...add_path_to_errors(validate_NotPublic(input), []));
        return error_acc_0;
    },
    "StartsWithA": function(input) {
        let error_acc_0 = [];
        error_acc_0.push(...add_path_to_errors(validate_StartsWithA(input), []));
        return error_acc_0;
    },
    "Password": function(input) {
        let error_acc_0 = [];
        error_acc_0.push(...add_path_to_errors(validate_Password(input), []));
        return error_acc_0;
    }
};


class BffParseError {
  constructor(errors) {
    this.errors = errors;
  }
}
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
      throw new BffParseError(safe.errors)
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
      "Password": {
        "format": "password",
        "type": "string"
      },
      "StartsWithA": {
        "format": "StartsWithA",
        "type": "string"
      },
      "User": {
        "properties": {
          "age": {
            "type": "number"
          },
          "name": {
            "type": "string"
          }
        },
        "required": [
          "name",
          "age"
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
    "/check-uuid/{uuid}": {
      "get": {
        "parameters": [
          {
            "in": "path",
            "name": "uuid",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "in": "query",
            "name": "p",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Password"
            }
          }
        ],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/StartsWithA"
                }
              }
            },
            "description": "Successful Operation"
          },
          "422": {
            "$ref": "#/components/responses/DecodeError"
          },
          "500": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    },
    "/{name}": {
      "get": {
        "parameters": [
          {
            "in": "path",
            "name": "name",
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
          "500": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    }
  }
} ;
export  { meta, schema, buildParsers, registerStringFormat };