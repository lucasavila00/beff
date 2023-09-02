
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

function validate_User(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["name"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "User",
                    "name"
                ]
            });
        }
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "User"
            ]
        });
    }
    return error_acc_0;
}
const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "path",
                "name": "name",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "string"
                            ],
                            "path": [
                                'Path Parameter "name"'
                            ]
                        });
                    }
                    return error_acc_0;
                },
                "coercer": function(input) {
                    return coerce_string(input);
                }
            }
        ],
        "pattern": "/{name}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validate_User(input), [
                "[GET] /{name}.response_body"
            ]));
            return error_acc_0;
        }
    }
];

const schema =  {
  "components": {
    "schemas": {
      "User": {
        "properties": {
          "name": {
            "type": "string"
          }
        },
        "required": [
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
            "description": "There was an error in the passed parameters"
          },
          "default": {
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
        }
      }
    }
  }
} ;
export  { meta, schema };