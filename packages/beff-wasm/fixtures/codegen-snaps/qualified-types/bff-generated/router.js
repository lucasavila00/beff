
import validatorsMod from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, decodeAnyOf, decodeAllOf, decodeBoolean, decodeAny, decodeTuple, decodeNull, decodeConst, encodeCodec, encodeAnyOf, encodeAllOf, encodeNumber, validators, encoders, c } = validatorsMod;
const meta = [
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/abc",
        "return_encoder": function(input) {
            return encoders.UserEntityOriginal(input);
        },
        "return_validator": function(ctx, input) {
            return validators.UserEntityOriginal(ctx, input, true);
        }
    },
    {
        "method_kind": "post",
        "params": [],
        "pattern": "/abc",
        "return_encoder": function(input) {
            return encoders.Abc123(input);
        },
        "return_validator": function(ctx, input) {
            return validators.Abc123(ctx, input, true);
        }
    },
    {
        "method_kind": "put",
        "params": [],
        "pattern": "/abc",
        "return_encoder": function(input) {
            return encoders.Def(input);
        },
        "return_validator": function(ctx, input) {
            return validators.Def(ctx, input, true);
        }
    },
    {
        "method_kind": "delete",
        "params": [],
        "pattern": "/abc",
        "return_encoder": function(input) {
            return encoders.XYZ(input);
        },
        "return_validator": function(ctx, input) {
            return validators.XYZ(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/def",
        "return_encoder": function(input) {
            return encoders.UserEntityOriginal(input);
        },
        "return_validator": function(ctx, input) {
            return validators.UserEntityOriginal(ctx, input, true);
        }
    },
    {
        "method_kind": "post",
        "params": [],
        "pattern": "/def",
        "return_encoder": function(input) {
            return encoders.AAAAA(input);
        },
        "return_validator": function(ctx, input) {
            return validators.AAAAA(ctx, input, true);
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
      "AAAAA": {
        "const": 123
      },
      "Abc123": {
        "properties": {
          "a": {
            "type": "string"
          }
        },
        "required": [
          "a"
        ],
        "type": "object"
      },
      "Def": {
        "properties": {
          "a": {
            "type": "string"
          }
        },
        "required": [
          "a"
        ],
        "type": "object"
      },
      "UserEntityOriginal": {
        "properties": {
          "id": {
            "type": "string"
          }
        },
        "required": [
          "id"
        ],
        "type": "object"
      },
      "XYZ": {
        "properties": {
          "a": {
            "type": "number"
          }
        },
        "required": [
          "a"
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
    "/abc": {
      "delete": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/XYZ"
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
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserEntityOriginal"
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
                  "$ref": "#/components/schemas/Abc123"
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
      "put": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Def"
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
    "/def": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserEntityOriginal"
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
                  "$ref": "#/components/schemas/AAAAA"
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