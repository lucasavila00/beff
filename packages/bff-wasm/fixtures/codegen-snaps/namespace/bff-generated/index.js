function validate_A(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {} else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "A"
            ]
        });
    }
    return error_acc_0;
}
function validate_B(input) {
    let error_acc_0 = [];
    if (typeof input != "number") {
        error_acc_0.push({
            "kind": [
                "NotTypeof",
                "number"
            ],
            "path": [
                "B"
            ]
        });
    }
    return error_acc_0;
}
const meta = {
    "handlersMeta": [
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
                                "kind": [
                                    "NotTypeof",
                                    "string"
                                ],
                                "path": [
                                    'Path Parameter "id"'
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
            "pattern": "/hello/{id}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                error_acc_0.push(...add_path_to_errors(validate_A(input), [
                    "[GET] /hello/{id}.response_body"
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
            "pattern": "/hello2",
            "return_validator": function(input) {
                let error_acc_0 = [];
                error_acc_0.push(...add_path_to_errors(validate_B(input), [
                    "[GET] /hello2.response_body"
                ]));
                return error_acc_0;
            }
        }
    ],
    "schema": {
        "openapi": "3.1.0",
        "info": {
            "title": "No title",
            "version": "0.0.0"
        },
        "paths": {
            "/hello/{id}": {
                "get": {
                    "parameters": [
                        {
                            "name": "id",
                            "in": "path",
                            "required": true,
                            "schema": {
                                "type": "string"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Successful Operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/A"
                                    }
                                }
                            }
                        },
                        "422": {
                            "description": "There was an error in the passed parameters",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": [
                                            "message"
                                        ],
                                        "properties": {
                                            "message": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "default": {
                            "description": "Unexpected Error",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": [
                                            "message"
                                        ],
                                        "properties": {
                                            "message": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/hello2": {
                "get": {
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "Successful Operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/B"
                                    }
                                }
                            }
                        },
                        "422": {
                            "description": "There was an error in the passed parameters",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": [
                                            "message"
                                        ],
                                        "properties": {
                                            "message": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "default": {
                            "description": "Unexpected Error",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": [
                                            "message"
                                        ],
                                        "properties": {
                                            "message": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "components": {
            "schemas": {
                "A": {
                    "type": "object",
                    "required": [],
                    "properties": {}
                },
                "B": {
                    "type": "number"
                }
            }
        }
    }
};
