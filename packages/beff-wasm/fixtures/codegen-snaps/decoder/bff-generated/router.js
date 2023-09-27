
import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, encodeCodec, encodeAnyOf, encodeAllOf, encodeNumber, validators, encoders, c } = validatorsMod;
const meta = [
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/all-types",
        "return_encoder": function(input) {
            return encoders.AllTypes(input);
        },
        "return_validator": function(ctx, input) {
            return validators.AllTypes(ctx, input, true);
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
      "AllTypes": {
        "properties": {
          "allBooleans": {
            "type": "boolean"
          },
          "allNumbers": {
            "type": "number"
          },
          "allStrings": {
            "type": "string"
          },
          "any": {},
          "arrayOfStrings": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "booleanLiteral": {
            "const": true
          },
          "interface": {
            "$ref": "#/components/schemas/Post"
          },
          "intersection": {
            "allOf": [
              {
                "properties": {
                  "a": {
                    "const": 1
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
                    "const": 2
                  }
                },
                "required": [
                  "b"
                ],
                "type": "object"
              }
            ]
          },
          "null": {
            "type": "null"
          },
          "numberLiteral": {
            "const": 123
          },
          "optionalType": {
            "items": {
              "type": "number"
            },
            "type": "array"
          },
          "stringLiteral": {
            "const": "a"
          },
          "tuple": {
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
          "tupleWithRest": {
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
          "typeReference": {
            "$ref": "#/components/schemas/User"
          },
          "undefined": {
            "type": "null"
          },
          "unionOfLiterals": {
            "enum": [
              "a",
              "b",
              "c"
            ]
          },
          "unionOfTypes": {
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
                  "$ref": "#/components/schemas/User"
                },
                "type": "array"
              }
            ]
          },
          "unknown": {}
        },
        "required": [
          "allBooleans",
          "allNumbers",
          "allStrings",
          "any",
          "arrayOfStrings",
          "booleanLiteral",
          "interface",
          "intersection",
          "null",
          "numberLiteral",
          "stringLiteral",
          "tuple",
          "tupleWithRest",
          "typeReference",
          "undefined",
          "unionOfLiterals",
          "unionOfTypes",
          "unionWithNull",
          "unknown"
        ],
        "type": "object"
      },
      "Post": {
        "properties": {
          "content": {
            "type": "string"
          },
          "id": {
            "type": "string"
          }
        },
        "required": [
          "content",
          "id"
        ],
        "type": "object"
      },
      "User": {
        "properties": {
          "friends": {
            "items": {
              "$ref": "#/components/schemas/User"
            },
            "type": "array"
          },
          "id": {
            "type": "string"
          }
        },
        "required": [
          "friends",
          "id"
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
    "/all-types": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AllTypes"
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