
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
                    return coerce_number(input);
                },
                "name": "limit",
                "required": false,
                "type": "query",
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (input == null) {
                        return error_acc_0;
                    }
                    if (typeof input != "number") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "number",
                            "path": [
                                "limit"
                            ],
                            "received": input
                        });
                    }
                    return error_acc_0;
                }
            }
        ],
        "pattern": "/optional-query-param",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "number") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "number",
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
                    "expected_type": "string",
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
                    return coerce_string(input);
                },
                "name": "user_agent",
                "required": true,
                "type": "header",
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "string",
                            "path": [
                                "user_agent"
                            ],
                            "received": input
                        });
                    }
                    return error_acc_0;
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
                            "expected_type": "string",
                            "path": [
                                "responseBody",
                                "[" + index + "]"
                            ],
                            "received": array_item_1
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
                "coercer": function(input) {
                    return coerce_number(input);
                },
                "name": "id",
                "required": true,
                "type": "path",
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "number") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "number",
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
        "pattern": "/users2/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "string",
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
        "method_kind": "post",
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
        "pattern": "/users2/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "string",
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
        "params": [],
        "pattern": "/users3",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "string",
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
        "params": [],
        "pattern": "/users4",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "string",
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
        "method_kind": "post",
        "params": [],
        "pattern": "/users4",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input != "string") {
                error_acc_0.push({
                    "error_kind": "NotTypeof",
                    "expected_type": "string",
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
                "const": 1
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
                "type": "null"
              },
              {
                "type": "string"
              },
              {
                "type": "number"
              }
            ]
          },
          "nullable": {
            "anyOf": [
              {
                "type": "null"
              },
              {
                "type": "string"
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
            "maxItems": 1,
            "minItems": 1,
            "prefixItems": [
              {
                "type": "string"
              }
            ],
            "type": "array"
          },
          "tuple2": {
            "maxItems": 2,
            "minItems": 2,
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
            "maxItems": 3,
            "minItems": 3,
            "prefixItems": [
              {
                "const": "a"
              },
              {
                "const": 1
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
                "type": "boolean"
              },
              {
                "type": "string"
              },
              {
                "type": "number"
              }
            ]
          },
          "union_with_undefined": {
            "anyOf": [
              {
                "type": "null"
              },
              {
                "type": "string"
              }
            ]
          }
        },
        "required": [
          "array1",
          "array2",
          "basic",
          "enum",
          "literals",
          "many_nullable",
          "nullable",
          "str_template",
          "tuple1",
          "tuple2",
          "tuple_lit",
          "tuple_rest",
          "union_of_many",
          "union_with_undefined"
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
          "entities",
          "id",
          "name"
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
    "/optional-query-param": {
      "get": {
        "parameters": [
          {
            "in": "query",
            "name": "limit",
            "required": false,
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
                  "type": "number"
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