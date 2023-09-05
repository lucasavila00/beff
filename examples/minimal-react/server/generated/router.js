
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
        "pattern": "/*",
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
                "coercer": function(input) {
                    return coerce_string(input);
                },
                "name": "name",
                "required": false,
                "type": "query",
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (input == null) {
                        return error_acc_0;
                    }
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "string",
                            "path": [
                                "name"
                            ],
                            "received": input
                        });
                    }
                    return error_acc_0;
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
                        "expected_type": "string",
                        "path": [
                            "responseBody",
                            "text"
                        ],
                        "received": input["text"]
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
            },
            {
                "coercer": function(input) {
                    return coerce_number(input);
                },
                "name": "a",
                "required": true,
                "type": "query",
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "number") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "number",
                            "path": [
                                "a"
                            ],
                            "received": input
                        });
                    }
                    return error_acc_0;
                }
            },
            {
                "coercer": function(input) {
                    return coerce_number(input);
                },
                "name": "b",
                "required": true,
                "type": "query",
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "number") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "number",
                            "path": [
                                "b"
                            ],
                            "received": input
                        });
                    }
                    return error_acc_0;
                }
            }
        ],
        "pattern": "/sum",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input == "object" && input != null) {
                if (typeof input["result"] != "number") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "expected_type": "number",
                        "path": [
                            "responseBody",
                            "result"
                        ],
                        "received": input["result"]
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
    },
    "/sum": {
      "get": {
        "parameters": [
          {
            "in": "query",
            "name": "a",
            "required": true,
            "schema": {
              "type": "number"
            }
          },
          {
            "in": "query",
            "name": "b",
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
                  "properties": {
                    "result": {
                      "type": "number"
                    }
                  },
                  "required": [
                    "result"
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