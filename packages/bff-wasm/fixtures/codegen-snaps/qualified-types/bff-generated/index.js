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
const meta = {
    "handlersMeta": [
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
                                        "$ref": "#/components/schemas/UserEntityOriginal"
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
                                        "$ref": "#/components/schemas/Abc123"
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
                },
                "delete": {
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/XYZ"
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
                "UserEntityOriginal": {
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
                "Abc123": {
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
                },
                "XYZ": {
                    "type": "object",
                    "required": [
                        "a"
                    ],
                    "properties": {
                        "a": {
                            "type": "number"
                        }
                    }
                }
            }
        }
    }
};
