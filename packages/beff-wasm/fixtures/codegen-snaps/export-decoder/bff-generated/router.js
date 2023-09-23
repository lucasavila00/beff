
import vals from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, encodeCodec, validators, encoders, registerStringFormat, c } = vals;
const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "encoder": function(input) {
                    return input;
                },
                "name": "name",
                "required": true,
                "type": "path",
                "validator": function(ctx, input) {
                    return decodeString(ctx, input, true);
                }
            }
        ],
        "pattern": "/{name}",
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
                "encoder": function(input) {
                    return input;
                },
                "name": "uuid",
                "required": true,
                "type": "path",
                "validator": function(ctx, input) {
                    return decodeString(ctx, input, true);
                }
            },
            {
                "encoder": function(input) {
                    return encoders.Password(input);
                },
                "name": "p",
                "required": true,
                "type": "query",
                "validator": function(ctx, input) {
                    return validators.Password(ctx, input, true);
                }
            }
        ],
        "pattern": "/check-uuid/{uuid}",
        "return_encoder": function(input) {
            return encoders.StartsWithA(input);
        },
        "return_validator": function(ctx, input) {
            return validators.StartsWithA(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            }
        ],
        "pattern": "/UnionNested",
        "return_encoder": function(input) {
            return encoders.UnionNestedNamed(input);
        },
        "return_validator": function(ctx, input) {
            return validators.UnionNestedNamed(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            }
        ],
        "pattern": "/UnionNestedInline",
        "return_encoder": function(input) {
            return input;
        },
        "return_validator": function(ctx, input) {
            return decodeAnyOf(ctx, input, true, [
                (ctx, input)=>(decodeConst(ctx, input, true, 1)),
                (ctx, input)=>(decodeConst(ctx, input, true, 2)),
                (ctx, input)=>(decodeConst(ctx, input, true, 3)),
                (ctx, input)=>(decodeConst(ctx, input, true, 4)),
                (ctx, input)=>(decodeConst(ctx, input, true, 5)),
                (ctx, input)=>(decodeConst(ctx, input, true, 6))
            ]);
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
        "enum": [
          1,
          2
        ]
      },
      "B": {
        "enum": [
          2,
          3
        ]
      },
      "D": {
        "enum": [
          4,
          5
        ]
      },
      "E": {
        "enum": [
          5,
          6
        ]
      },
      "Password": {
        "format": "password",
        "type": "string"
      },
      "StartsWithA": {
        "format": "StartsWithA",
        "type": "string"
      },
      "UnionNestedNamed": {
        "anyOf": [
          {
            "$ref": "#/components/schemas/A"
          },
          {
            "$ref": "#/components/schemas/B"
          },
          {
            "$ref": "#/components/schemas/D"
          },
          {
            "$ref": "#/components/schemas/E"
          }
        ]
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
          "age",
          "name"
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
    "/UnionNested": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UnionNestedNamed"
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
    "/UnionNestedInline": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "enum": [
                    1,
                    2,
                    3,
                    4,
                    5,
                    6
                  ]
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
export default { meta, schema };