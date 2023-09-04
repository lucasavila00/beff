
import vals from "./validators.js"; const { validators, add_path_to_errors, registerStringFormat, isCustomFormatInvalid } = vals;

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
        "method_kind": "use",
        "params": [],
        "pattern": "/greeting",
        "return_validator": function(input) {
            let error_acc_0 = [];
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
                "type": "query",
                "name": "name",
                "required": false,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (input == null) {
                        return error_acc_0;
                    }
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
        "pattern": "/greeting",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input == "object" && input != null) {
                if (typeof input["text"] != "string") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "responseBody",
                            "text"
                        ],
                        "received": input["text"],
                        "expected_type": "string"
                    });
                }
            } else {
                error_acc_0.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "responseBody"
                    ],
                    "received": input
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
    "schemas": {}
  },
  "info": {
    "title": "No title",
    "version": "0.0.0"
  },
  "openapi": "3.1.0",
  "paths": {
    "/greeting": {
      "get": {
        "parameters": [
          {
            "in": "query",
            "name": "name",
            "required": false,
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
                  "properties": {
                    "text": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "text"
                  ],
                  "type": "object"
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