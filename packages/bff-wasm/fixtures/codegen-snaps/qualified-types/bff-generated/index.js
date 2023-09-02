
class CoercionFailure {}
function add_path_to_errors(errors, path) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
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

function validate_UserEntityOriginal(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "UserEntityOriginal",
                    "id"
                ]
            });
        }
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "UserEntityOriginal"
            ]
        });
    }
    return error_acc_0;
}
function validate_Abc123(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "Abc123",
                    "a"
                ]
            });
        }
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "Abc123"
            ]
        });
    }
    return error_acc_0;
}
function validate_Def(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "Def",
                    "a"
                ]
            });
        }
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "Def"
            ]
        });
    }
    return error_acc_0;
}
function validate_XYZ(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "number") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "number"
                ],
                "path": [
                    "XYZ",
                    "a"
                ]
            });
        }
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "XYZ"
            ]
        });
    }
    return error_acc_0;
}
const meta = [
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/abc",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_UserEntityOriginal(input), [
                "[GET] /abc.response_body"
            ]));
            return error_acc_0;
        }
    },
    {
        "method_kind": "post",
        "params": [],
        "pattern": "/abc",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_Abc123(input), [
                "[POST] /abc.response_body"
            ]));
            return error_acc_0;
        }
    },
    {
        "method_kind": "put",
        "params": [],
        "pattern": "/abc",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_Def(input), [
                "[PUT] /abc.response_body"
            ]));
            return error_acc_0;
        }
    },
    {
        "method_kind": "delete",
        "params": [],
        "pattern": "/abc",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_XYZ(input), [
                "[DELETE] /abc.response_body"
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
          "default": {
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
          "default": {
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
          "default": {
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
          "default": {
            "$ref": "#/components/responses/UnexpectedError"
          }
        }
      }
    }
  }
} ;
export  { meta, schema };