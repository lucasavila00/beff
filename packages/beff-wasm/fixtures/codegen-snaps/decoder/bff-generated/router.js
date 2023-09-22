
import vals from "./validators.js"; const { validators, add_path_to_errors, registerStringFormat, isCustomFormatInvalid, isCodecInvalid } = vals;


function CoercionOk(data) {
  return {
    ok: true,
    data,
  }
}

function CoercionNoop(data) {
  return {
    ok: false,
    data,
  }
}
  

function coerce_string(input) {
  if (typeof input === "string") {
    return CoercionOk(input)
  }
  return CoercionNoop(input);
}
const isNumeric = (num) =>
  (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
  !isNaN(num );
function coerce_number(input) {
  if (input == null) {
    return CoercionNoop(input);
  }
  if (isNumeric(input)) {
    return CoercionOk(Number(input));
  }
  return CoercionNoop(input);
}
function coerce_boolean(input) {
  if (input == null) {
    return CoercionNoop(input);
  }
  if (input === "true" || input === "false") {
    return CoercionOk(input === "true");
  }
  if (input === "1" || input === "0") {
    return CoercionOk(input === "1");
  }
  return CoercionNoop(input);
}
function coerce_union(input, ...cases) {
  if (input == null) {
    return CoercionNoop(input);
  }
  for (const c of cases) {
    const r = c(input);
    if (r.ok) {
      return r;
    }
  }
  return CoercionNoop(input);
}

const meta = [
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/all-types",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validators.AllTypes(input), [
                "responseBody"
            ]));
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