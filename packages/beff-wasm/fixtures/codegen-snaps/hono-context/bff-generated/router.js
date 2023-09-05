
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
        "method_kind": "use",
        "params": [],
        "pattern": "/posts/*",
        "return_validator": function(input) {
            let error_acc_0 = [];
            return error_acc_0;
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input == "object" && input != null) {
                if (typeof input["message"] != "string") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "expected_type": "string",
                        "path": [
                            "responseBody",
                            "message"
                        ],
                        "received": input["message"]
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
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            }
        ],
        "pattern": "/posts",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input == "object" && input != null) {
                if (typeof input["ok"] != "boolean") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "expected_type": "boolean",
                        "path": [
                            "responseBody",
                            "ok"
                        ],
                        "received": input["ok"]
                    });
                }
                if (Array.isArray(input["posts"])) {
                    for(let index = 0; index < input["posts"].length; index++){
                        const array_item_1 = input["posts"][index];
                    }
                } else {
                    error_acc_0.push({
                        "error_kind": "NotAnArray",
                        "path": [
                            "responseBody",
                            "posts"
                        ],
                        "received": input["posts"]
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
    "/": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
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
    "/posts": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "ok": {
                      "type": "boolean"
                    },
                    "posts": {
                      "items": {},
                      "type": "array"
                    }
                  },
                  "required": [
                    "ok",
                    "posts"
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