
import vals from "./validators.js"; const { validators, add_path_to_errors, registerStringFormat, isCustomFormatInvalid, isCodecInvalid } = vals;
const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "name",
                "required": true,
                "type": "path",
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "string",
                            "path": [
                                "name"
                            ],
                            "received": input
                        });
                    }
                    return error_acc_0;
                }
            }
        ],
        "pattern": "/{name}",
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
                "name": "uuid",
                "required": true,
                "type": "path",
                "validator": function(input) {
                    let error_acc_0 = [];
                    if (typeof input != "string") {
                        error_acc_0.push({
                            "error_kind": "NotTypeof",
                            "expected_type": "string",
                            "path": [
                                "uuid"
                            ],
                            "received": input
                        });
                    }
                    return error_acc_0;
                }
            },
            {
                "name": "p",
                "required": true,
                "type": "query",
                "validator": function(input) {
                    let error_acc_0 = [];
                    error_acc_0.push(...add_path_to_errors(validators.Password(input), [
                        "p"
                    ]));
                    return error_acc_0;
                }
            }
        ],
        "pattern": "/check-uuid/{uuid}",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validators.StartsWithA(input), [
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
            }
        ],
        "pattern": "/UnionNested",
        "return_validator": function(input) {
            let error_acc_0 = [];
            error_acc_0.push(...add_path_to_errors(validators.UnionNestedNamed(input), [
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
            }
        ],
        "pattern": "/UnionNestedInline",
        "return_validator": function(input) {
            let error_acc_0 = [];
            let is_ok_1 = false;
            let error_acc_2 = [];
            if (input != 1) {
                error_acc_2.push({
                    "error_kind": "NotEq",
                    "expected_value": 1,
                    "path": [
                        "responseBody"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_2.length === 0;
            let error_acc_3 = [];
            if (input != 2) {
                error_acc_3.push({
                    "error_kind": "NotEq",
                    "expected_value": 2,
                    "path": [
                        "responseBody"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_3.length === 0;
            let error_acc_4 = [];
            if (input != 3) {
                error_acc_4.push({
                    "error_kind": "NotEq",
                    "expected_value": 3,
                    "path": [
                        "responseBody"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_4.length === 0;
            let error_acc_5 = [];
            if (input != 4) {
                error_acc_5.push({
                    "error_kind": "NotEq",
                    "expected_value": 4,
                    "path": [
                        "responseBody"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_5.length === 0;
            let error_acc_6 = [];
            if (input != 5) {
                error_acc_6.push({
                    "error_kind": "NotEq",
                    "expected_value": 5,
                    "path": [
                        "responseBody"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_6.length === 0;
            let error_acc_7 = [];
            if (input != 6) {
                error_acc_7.push({
                    "error_kind": "NotEq",
                    "expected_value": 6,
                    "path": [
                        "responseBody"
                    ],
                    "received": input
                });
            }
            is_ok_1 = is_ok_1 || error_acc_7.length === 0;
            if (!(is_ok_1)) {
                error_acc_0.push({
                    "error_kind": "InvalidUnion",
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