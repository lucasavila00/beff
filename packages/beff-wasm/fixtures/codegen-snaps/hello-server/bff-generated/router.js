
import vals from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, encodeCodec, validators, encoders, registerStringFormat, c } = vals;
const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "limit",
                "required": false,
                "type": "query",
                "validator": function(ctx, input) {
                    return decodeNumber(ctx, input, false);
                }
            }
        ],
        "pattern": "/optional-query-param",
        "return_encoder": function(input) {
            return input;
        },
        "return_validator": function(ctx, input) {
            return decodeNumber(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/data-types-kitchen-sink",
        "return_encoder": function(input) {
            return encoders.DataTypesKitchenSink(input);
        },
        "return_validator": function(ctx, input) {
            return validators.DataTypesKitchenSink(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/anon-func",
        "return_encoder": function(input) {
            return input;
        },
        "return_validator": function(ctx, input) {
            return decodeString(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "user_agent",
                "required": true,
                "type": "header",
                "validator": function(ctx, input) {
                    return decodeString(ctx, input, true);
                }
            }
        ],
        "pattern": "/users",
        "return_encoder": function(input) {
            return input.map((input)=>(input));
        },
        "return_validator": function(ctx, input) {
            return decodeArray(ctx, input, true, (ctx, input)=>(decodeString(ctx, input, true)));
        }
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "id",
                "required": true,
                "type": "path",
                "validator": function(ctx, input) {
                    return decodeNumber(ctx, input, true);
                }
            }
        ],
        "pattern": "/users/{id}",
        "return_encoder": function(input) {
            return encoders.User(input);
        },
        "return_validator": function(ctx, input) {
            return validators.User(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "id",
                "required": true,
                "type": "path",
                "validator": function(ctx, input) {
                    return decodeString(ctx, input, true);
                }
            }
        ],
        "pattern": "/users2/{id}",
        "return_encoder": function(input) {
            return input;
        },
        "return_validator": function(ctx, input) {
            return decodeString(ctx, input, true);
        }
    },
    {
        "method_kind": "post",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "id",
                "required": true,
                "type": "path",
                "validator": function(ctx, input) {
                    return decodeString(ctx, input, true);
                }
            }
        ],
        "pattern": "/users2/{id}",
        "return_encoder": function(input) {
            return input;
        },
        "return_validator": function(ctx, input) {
            return decodeString(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/users3",
        "return_encoder": function(input) {
            return input;
        },
        "return_validator": function(ctx, input) {
            return decodeString(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/users4",
        "return_encoder": function(input) {
            return input;
        },
        "return_validator": function(ctx, input) {
            return decodeString(ctx, input, true);
        }
    },
    {
        "method_kind": "post",
        "params": [],
        "pattern": "/users4",
        "return_encoder": function(input) {
            return input;
        },
        "return_validator": function(ctx, input) {
            return decodeString(ctx, input, true);
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
    "description": "Optional multiline or single-line description in [CommonMark](http://commonmark.org/help/) or HTML.\n\n",
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