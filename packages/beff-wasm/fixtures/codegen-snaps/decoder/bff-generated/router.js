
import vals from "./validators.js"; const { validators, add_path_to_errors, registerStringFormat, isCustomFormatInvalid } = vals;

class CoercionFailure {
  constructor(original) {
    this.__isCoercionFailure = true;
    this.original = original
  }
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
  return new CoercionFailure(input);
}
function coerce_boolean(input) {
  if (input === "true" || input === "false") {
    return input === "true";
  }
  if (input === "1" || input === "0") {
    return input === "1";
  }
  return new CoercionFailure(input);
}
function coerce_union(input, ...cases) {
  for (const c of cases) {
    const r = coerce(c, input);
    if (!(r instanceof CoercionFailure)) {
      return r;
    }
  }
  return new CoercionFailure(input);
}
function coerce(coercer, value) {
  return coercer(value);
}

const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "coercer": function(input) {
                    return coerce_string(input);
                },
                "name": "id",
                "required": true,
                "type": "path",
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "string",
                            "path": [
                                "id"
                            ],
                            "received": input
                        });
                    }
                    return error_acc_0;
                }
            }
        ],
        "pattern": "/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validators.User(input), [
                "responseBody"
            ]));
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
                "type": "null"
              },
              {
                "type": "number"
              },
              {
                "items": {
                  "$ref": "#/components/schemas/ChildUser"
                },
                "type": "array"
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
          "e",
          "g",
          "h",
          "i",
          "union",
          "unionWithNull"
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
          "500": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    }
  }
} ;
export default { meta, schema };