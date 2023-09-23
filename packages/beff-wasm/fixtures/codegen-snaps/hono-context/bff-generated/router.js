
import vals from "./validators.js"; const { decodeObject, decodeArray, decodeString, decodeNumber, decodeCodec, decodeStringWithFormat, validators, registerStringFormat, isCustomFormatInvalid, isCodecInvalid } = vals;
const meta = [
    {
        "method_kind": "use",
        "params": [],
        "pattern": "/posts/*",
        "return_validator": function(ctx, input) {
            return decodeAny(ctx, input, true);
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/",
        "return_validator": function(ctx, input) {
            return decodeObject(ctx, input, true, {
                "message": (ctx, input)=>(decodeString(ctx, input, true))
            });
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
        "return_validator": function(ctx, input) {
            return decodeObject(ctx, input, true, {
                "ok": (ctx, input)=>(decodeBoolean(ctx, input, true)),
                "posts": (ctx, input)=>(decodeArray(ctx, input, true, (ctx, input)=>(decodeAny(ctx, input, true))))
            });
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