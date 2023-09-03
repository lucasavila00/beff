
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
const stringPredicates = {}
function registerStringFormat(name, predicate) {
  stringPredicates[name] = predicate;
}

// a hint to UIs to mask the input
registerStringFormat("password", () => true);

function isCustomFormatInvalid(key, value) {
  const predicate = stringPredicates[key];
  if (predicate == null) {
    throw new Error("unknown string format: " + key);
  }
  return !predicate(value);
}

function validate_Post(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Post",
                    "id"
                ],
                "received": input["id"],
                "expected_type": "string"
            });
        }
        if (typeof input["title"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Post",
                    "title"
                ],
                "received": input["title"],
                "expected_type": "string"
            });
        }
        if (typeof input["body"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Post",
                    "body"
                ],
                "received": input["body"],
                "expected_type": "string"
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "Post"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function validate_Param(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["title"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Param",
                    "title"
                ],
                "received": input["title"],
                "expected_type": "string"
            });
        }
        if (typeof input["body"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "path": [
                    "Param",
                    "body"
                ],
                "received": input["body"],
                "expected_type": "string"
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "Param"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
const meta = [
    {
        "method_kind": "use",
        "params": [],
        "pattern": "*",
        "return_validator": function(input) {
            let error_acc_0 = [];
            return error_acc_0;
        }
    },
    {
        "method_kind": "use",
        "params": [],
        "pattern": "/posts/*",
        "return_validator": function(input) {
            let error_acc_0 = [];
            return error_acc_0;
        }
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input == "object" && input != null) {
                if (typeof input["message"] != "string") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "[GET] /.response_body",
                            "message"
                        ],
                        "received": input["message"],
                        "expected_type": "string"
                    });
                }
            } else {
                error_acc_0.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "[GET] /.response_body"
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
            }
        ],
        "pattern": "/posts",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input == "object" && input != null) {
                if (Array.isArray(input["posts"])) {
                    for(let index = 0; index < input["posts"].length; index++){
                        const array_item_1 = input["posts"][index];
                        error_acc_0.push(...add_path_to_errors(validate_Post(array_item_1), [
                            "[GET] /posts.response_body",
                            "posts",
                            "[" + index + "]"
                        ]));
                    }
                } else {
                    error_acc_0.push({
                        "error_kind": "NotAnArray",
                        "path": [
                            "[GET] /posts.response_body",
                            "posts"
                        ],
                        "received": input["posts"]
                    });
                }
                if (typeof input["ok"] != "boolean") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "[GET] /posts.response_body",
                            "ok"
                        ],
                        "received": input["ok"],
                        "expected_type": "boolean"
                    });
                }
            } else {
                error_acc_0.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "[GET] /posts.response_body"
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
                "type": "body",
                "name": "param",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    error_acc_0.push(...add_path_to_errors(validate_Param(input), [
                        "requestBody"
                    ]));
                    return error_acc_0;
                }
            }
        ],
        "pattern": "/posts",
        "return_validator": function(input) {
            let error_acc_0 = [];
            let is_ok_1 = false;
            let error_acc_2 = [];
            if (typeof input == "object" && input != null) {
                if (input["ok"] != true) {
                    error_acc_2.push({
                        "error_kind": "NotEq",
                        "path": [
                            "[POST] /posts.response_body",
                            "ok"
                        ],
                        "received": input["ok"],
                        "expected_value": true
                    });
                }
                error_acc_2.push(...add_path_to_errors(validate_Post(input["post"]), [
                    "[POST] /posts.response_body",
                    "post"
                ]));
            } else {
                error_acc_2.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "[POST] /posts.response_body"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_2.length === 0;
            let error_acc_3 = [];
            if (typeof input == "object" && input != null) {
                if (input["ok"] != false) {
                    error_acc_3.push({
                        "error_kind": "NotEq",
                        "path": [
                            "[POST] /posts.response_body",
                            "ok"
                        ],
                        "received": input["ok"],
                        "expected_value": false
                    });
                }
                if (typeof input["error"] != "string") {
                    error_acc_3.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "[POST] /posts.response_body",
                            "error"
                        ],
                        "received": input["error"],
                        "expected_type": "string"
                    });
                }
            } else {
                error_acc_3.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "[POST] /posts.response_body"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_3.length === 0;
            if (!(is_ok_1)) {
                error_acc_0.push({
                    "error_kind": "InvalidUnion",
                    "path": [
                        "[POST] /posts.response_body"
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
        "pattern": "/posts/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            let is_ok_1 = false;
            let error_acc_2 = [];
            if (typeof input == "object" && input != null) {
                if (input["ok"] != true) {
                    error_acc_2.push({
                        "error_kind": "NotEq",
                        "path": [
                            "[GET] /posts/{id}.response_body",
                            "ok"
                        ],
                        "received": input["ok"],
                        "expected_value": true
                    });
                }
                error_acc_2.push(...add_path_to_errors(validate_Post(input["post"]), [
                    "[GET] /posts/{id}.response_body",
                    "post"
                ]));
            } else {
                error_acc_2.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "[GET] /posts/{id}.response_body"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_2.length === 0;
            let error_acc_3 = [];
            if (typeof input == "object" && input != null) {
                if (input["ok"] != false) {
                    error_acc_3.push({
                        "error_kind": "NotEq",
                        "path": [
                            "[GET] /posts/{id}.response_body",
                            "ok"
                        ],
                        "received": input["ok"],
                        "expected_value": false
                    });
                }
                if (typeof input["error"] != "string") {
                    error_acc_3.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "[GET] /posts/{id}.response_body",
                            "error"
                        ],
                        "received": input["error"],
                        "expected_type": "string"
                    });
                }
            } else {
                error_acc_3.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "[GET] /posts/{id}.response_body"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_3.length === 0;
            if (!(is_ok_1)) {
                error_acc_0.push({
                    "error_kind": "InvalidUnion",
                    "path": [
                        "[GET] /posts/{id}.response_body"
                    ],
                    "received": input
                });
            }
            return error_acc_0;
        }
    },
    {
        "method_kind": "put",
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
            },
            {
                "type": "body",
                "name": "param",
                "required": true,
                "validator": function(input) {
                    let error_acc_0 = [];
                    error_acc_0.push(...add_path_to_errors(validate_Param(input), [
                        "requestBody"
                    ]));
                    return error_acc_0;
                }
            }
        ],
        "pattern": "/posts/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input == "object" && input != null) {
                if (typeof input["ok"] != "boolean") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "[PUT] /posts/{id}.response_body",
                            "ok"
                        ],
                        "received": input["ok"],
                        "expected_type": "boolean"
                    });
                }
            } else {
                error_acc_0.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "[PUT] /posts/{id}.response_body"
                    ],
                    "received": input
                });
            }
            return error_acc_0;
        }
    },
    {
        "method_kind": "delete",
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
        "pattern": "/posts/{id}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            if (typeof input == "object" && input != null) {
                if (typeof input["ok"] != "boolean") {
                    error_acc_0.push({
                        "error_kind": "NotTypeof",
                        "path": [
                            "[DELETE] /posts/{id}.response_body",
                            "ok"
                        ],
                        "received": input["ok"],
                        "expected_type": "boolean"
                    });
                }
            } else {
                error_acc_0.push({
                    "error_kind": "NotAnObject",
                    "path": [
                        "[DELETE] /posts/{id}.response_body"
                    ],
                    "received": input
                });
            }
            return error_acc_0;
        }
    }
];
const buildParsersInput = {};


class BffParseError {
  constructor(errors) {
    this.errors = errors;
  }
}
function buildParsers() {
  let decoders ={};
  Object.keys(buildParsersInput).forEach(k => {
    let v = buildParsersInput[k];
    const safeParse = (input) => {
      const validation_result = v(input);
      if (validation_result.length === 0) {
        return { success: true, data: input };
      }
      return { success: false, errors: validation_result };
    }
    const parse = (input) => {
      const safe = safeParse(input);
      if (safe.success) {
        return safe.data;
      }
      throw new BffParseError(safe.errors)
    };
    decoders[k] = {
      parse, safeParse
    };
  });
  return decoders;
}

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
      "Param": {
        "properties": {
          "body": {
            "type": "string"
          },
          "title": {
            "type": "string"
          }
        },
        "required": [
          "title",
          "body"
        ],
        "type": "object"
      },
      "Post": {
        "properties": {
          "body": {
            "type": "string"
          },
          "id": {
            "type": "string"
          },
          "title": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "title",
          "body"
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
                      "items": {
                        "$ref": "#/components/schemas/Post"
                      },
                      "type": "array"
                    }
                  },
                  "required": [
                    "posts",
                    "ok"
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
      },
      "post": {
        "parameters": [],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Param"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "anyOf": [
                    {
                      "properties": {
                        "ok": {
                          "const": true
                        },
                        "post": {
                          "$ref": "#/components/schemas/Post"
                        }
                      },
                      "required": [
                        "ok",
                        "post"
                      ],
                      "type": "object"
                    },
                    {
                      "properties": {
                        "error": {
                          "type": "string"
                        },
                        "ok": {
                          "const": false
                        }
                      },
                      "required": [
                        "ok",
                        "error"
                      ],
                      "type": "object"
                    }
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
    "/posts/{id}": {
      "delete": {
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
                  "properties": {
                    "ok": {
                      "type": "boolean"
                    }
                  },
                  "required": [
                    "ok"
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
      },
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
                  "anyOf": [
                    {
                      "properties": {
                        "ok": {
                          "const": true
                        },
                        "post": {
                          "$ref": "#/components/schemas/Post"
                        }
                      },
                      "required": [
                        "ok",
                        "post"
                      ],
                      "type": "object"
                    },
                    {
                      "properties": {
                        "error": {
                          "type": "string"
                        },
                        "ok": {
                          "const": false
                        }
                      },
                      "required": [
                        "ok",
                        "error"
                      ],
                      "type": "object"
                    }
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
      },
      "put": {
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
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Param"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "ok": {
                      "type": "boolean"
                    }
                  },
                  "required": [
                    "ok"
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
module.exports =  { meta, schema, buildParsers, registerStringFormat };