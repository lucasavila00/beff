import { validators, add_path_to_errors, registerStringFormat, isCustomFormatInvalid } from "./validators.js";

class CoercionFailure {}
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
                                "id"
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
          "500": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    }
  }
} ;
export { meta, schema };