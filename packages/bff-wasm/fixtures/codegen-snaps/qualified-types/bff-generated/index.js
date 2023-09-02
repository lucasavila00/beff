function validate_UserEntity(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "UserEntity",
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
                "UserEntity"
            ]
        });
    }
    return error_acc_0;
}
function validate_Abc(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "Abc",
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
                "Abc"
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
const meta = {
    "handlersMeta": [
        {
            "method_kind": "get",
            "params": [],
            "pattern": "/abc",
            "return_validator": function(input) {
                let error_acc_0 = [];
                error_acc_0.push(...add_path_to_errors(validate_UserEntity(input), [
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
                error_acc_0.push(...add_path_to_errors(validate_Abc(input), [
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
        }
    ],
    "schema": {
        "openapi": "3.1.0",
        "info": {
            "title": "No title",
            "version": "0.0.0"
        },
        "paths": {
            "/abc": {
                "get": {
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/UserEntity"
                                    }
                                }
                            }
                        }
                    }
                },
                "post": {
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/Abc"
                                    }
                                }
                            }
                        }
                    }
                },
                "put": {
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/Def"
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
                "UserEntity": {
                    "type": "object",
                    "required": [
                        "id"
                    ],
                    "properties": {
                        "id": {
                            "type": "string"
                        }
                    }
                },
                "Abc": {
                    "type": "object",
                    "required": [
                        "a"
                    ],
                    "properties": {
                        "a": {
                            "type": "string"
                        }
                    }
                },
                "Def": {
                    "type": "object",
                    "required": [
                        "a"
                    ],
                    "properties": {
                        "a": {
                            "type": "string"
                        }
                    }
                }
            }
        }
    }
};
