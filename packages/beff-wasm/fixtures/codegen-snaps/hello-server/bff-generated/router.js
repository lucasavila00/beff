
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
        "method_kind": "get",
        "params": [],
        "pattern": "/data-types-kitchen-sink",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validators.DataTypesKitchenSink(input), [
                "responseBody"
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
                    "error_kind": "NotTypeof",
                    "path": [
                        "responseBody"
                    ],
                    "received": input,
                    "expected_type": "string"
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
                            "error_kind": "NotTypeof",
                            "path": [
                                "user_agent"
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
        "pattern": "/users",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (Array.isArray(input)) {
                for(let index = 0; index < input.length; index++){
                    const array_item_1 = input[index];
                    if (typeof array_item_1 != "string") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "path": [
                                "responseBody",
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
                "type": "path",
                "name": "id",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "number") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "path": [
                                "id"
                            ],
                            "received": input,
                            "expected_type": "number"
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
            error_acc_0.push(...add_path_to_errors(validators.User(input), [
                "responseBody"
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
        "pattern": "/users2/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "responseBody"
                    ],
                    "received": input,
                    "expected_type": "string"
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
        "pattern": "/users2/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "path": [
                        "responseBody"
                    ],
                    "received": input,
                    "expected_type": "string"
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
                    "error_kind": "NotTypeof",
                    "path": [
                        "responseBody"
                    ],
                    "received": input,
                    "expected_type": "string"
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
                    "error_kind": "NotTypeof",
                    "path": [
                        "responseBody"
                    ],
                    "received": input,
                    "expected_type": "string"
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
                    "error_kind": "NotTypeof",
                    "path": [
                        "responseBody"
                    ],
                    "received": input,
                    "expected_type": "string"
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
          "500": {
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
          "500": {
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
          "500": {
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
          "500": {
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
          "500": {
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
          "500": {
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
          "500": {
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
          "500": {
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
          "500": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    }
  }
} ;
export default { meta, schema };