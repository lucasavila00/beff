import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
function add_path_to_errors(errors, path) {
    return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
function coerce_string(input) {
    return input;
}
class CoercionFailure {
}
const isNumeric = (num) => (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
    !isNaN(num);
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
function coerce_bigint(_input) {
    throw new Error("not implemented");
    // return Object(input);
}
function coerce_union(_input, ..._cases) {
    throw new Error("not implemented");
    // return Object(input);
}
function coerce_intersection(_input, ..._cases) {
    throw new Error("not implemented");
    // return Object(input);
}
const template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="SwaggerUI"
    />
    <title>SwaggerUI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css" />

  </head>
  <body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v3/openapi.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
      });
    };
  </script>
  </body>
</html>
`;
const registerDocs = (app, metadata, servers) => {
    app.get("/v3/openapi.json", (req) => req.json({
        ...metadata["schema"],
        servers,
    }));
    app.get("/docs", (c) => c.html(template));
};
const printKind = (kind) => {
    switch (kind[0]) {
        case "NotTypeof": {
            return `expected ${kind[1]}`;
        }
        default: {
            return "unknown";
        }
    }
};
const printValidationErrors = (errors) => {
    return errors
        .map((e) => {
        return `Decoder error at ${e.path.join(".")}: ${printKind(e.kind)}.`;
    })
        .join("\n");
};
const decodeWithMessage = (validator, value) => {
    const errs = validator(value);
    if (errs.length > 0) {
        throw new HTTPException(422, { message: printValidationErrors(errs) });
    }
    return value;
};
const decodeNoMessage = (validator, value) => {
    const errs = validator(value);
    if (errs.length > 0) {
        throw new HTTPException(422, { message: "Internal validation error" });
    }
    return value;
};
const coerce = (coercer, value) => {
    return coercer(value);
};
const handleMethod = async (c, meta, handler) => {
    const resolverParamsPromise = meta.params.map(async (p) => {
        switch (p.type) {
            case "path": {
                const value = c.req.param(p.name);
                const coerced = coerce(p.coercer, value);
                return decodeWithMessage(p.validator, coerced);
            }
            case "query": {
                const value = c.req.query(p.name);
                const coerced = coerce(p.coercer, value);
                return decodeWithMessage(p.validator, coerced);
            }
            case "cookie": {
                const value = getCookie(c, p.name);
                const coerced = coerce(p.coercer, value);
                return decodeWithMessage(p.validator, coerced);
            }
            case "header": {
                const value = c.req.header(p.name);
                const coerced = coerce(p.coercer, value);
                return decodeWithMessage(p.validator, coerced);
            }
            case "body": {
                const value = await c.req.json();
                return decodeWithMessage(p.validator, value);
            }
        }
        throw new Error("not implemented: " + p.type);
    });
    const resolverParams = await Promise.all(resolverParamsPromise);
    const result = await handler(...resolverParams);
    return c.json(decodeNoMessage(meta.return_validator, result));
};
const toHonoPattern = (pattern) => {
    // replace {id} with :id
    return pattern.replace(/\{(\w+)\}/g, ":$1");
};
export function registerRouter(options) {
    registerDocs(options.app, meta, options.openApi?.servers ?? []);
    const handlersMeta = meta["handlersMeta"];
    for (const meta of handlersMeta) {
        const key = `${meta.method_kind.toUpperCase()}(${meta.pattern})`;
        const handlerFunction = options.router[key];
        if (handlerFunction == null) {
            throw new Error("handler not found: " + key);
        }
        const app = options.app;
        switch (meta.method_kind) {
            case "post":
            case "get": {
                app[meta.method_kind](toHonoPattern(meta.pattern), async (c) => handleMethod(c, meta, handlerFunction));
                break;
            }
            default: {
                throw new Error("not implemented: " + meta.method_kind);
            }
        }
    }
}
export const GET = (template) => `GET(${template.join(",")})`;
export const POST = (template) => `POST(${template.join(",")})`;
export const PUT = (template) => `PUT(${template.join(",")})`;
export const DELETE = (template) => `DELETE(${template.join(",")})`;
export const PATCH = (template) => `PATCH(${template.join(",")})`;
export const HEAD = (template) => `HEAD(${template.join(",")})`;
export const OPTIONS = (template) => `OPTIONS(${template.join(",")})`;
export const USE = (template) => `USE(${template.join(",")})`;
export const todo = () => null;

function validate_ChildUser(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "ChildUser",
                    "id"
                ]
            });
        }
        error_acc_0.push(...add_path_to_errors(validate_User(input["user"]), [
            "ChildUser",
            "user"
        ]));
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "ChildUser"
            ]
        });
    }
    return error_acc_0;
}
function validate_User(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "User",
                    "a"
                ]
            });
        }
        if (typeof input["b"] != "number") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "number"
                ],
                "path": [
                    "User",
                    "b"
                ]
            });
        }
        if (typeof input["c"] != "boolean") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "boolean"
                ],
                "path": [
                    "User",
                    "c"
                ]
            });
        }
        if (Array.isArray(input["c2"])) {
            for (const array_item_1 of input["c2"]){
                if (typeof array_item_1 != "boolean") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "boolean"
                        ],
                        "path": [
                            "User",
                            "c2",
                            "[]"
                        ]
                    });
                }
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "User",
                    "c2"
                ]
            });
        }
        if (Array.isArray(input["d"])) {
            for (const array_item_2 of input["d"]){
                error_acc_0.push(...add_path_to_errors(validate_User(array_item_2), [
                    "User",
                    "d",
                    "[]"
                ]));
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "User",
                    "d"
                ]
            });
        }
        if (input["childUser"] != null) {
            error_acc_0.push(...add_path_to_errors(validate_ChildUser(input["childUser"]), [
                "User",
                "childUser"
            ]));
        }
        if (input["thisUser"] != null) {
            error_acc_0.push(...add_path_to_errors(validate_User(input["thisUser"]), [
                "User",
                "thisUser"
            ]));
        }
        if (input["thisUser2"] != null) {
            if (typeof input["thisUser2"] == "object" && input["thisUser2"] != null) {
                error_acc_0.push(...add_path_to_errors(validate_User(input["thisUser2"]["user"]), [
                    "User",
                    "thisUser2",
                    "user"
                ]));
            } else {
                error_acc_0.push({
                    "kind": [
                        "NotAnObject"
                    ],
                    "path": [
                        "User",
                        "thisUser2"
                    ]
                });
            }
        }
        let is_ok_3 = false;
        let error_acc_4 = [];
        if (typeof input["union"] != "string") {
            error_acc_4.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "User",
                    "union"
                ]
            });
        }
        is_ok_3 = is_ok_3 || error_acc_4.length === 0;
        let error_acc_5 = [];
        if (typeof input["union"] != "number") {
            error_acc_5.push({
                "kind": [
                    "NotTypeof",
                    "number"
                ],
                "path": [
                    "User",
                    "union"
                ]
            });
        }
        is_ok_3 = is_ok_3 || error_acc_5.length === 0;
        if (!(is_ok_3)) {
            error_acc_0.push({
                "kind": [
                    "InvalidUnion"
                ],
                "path": [
                    "User",
                    "union"
                ]
            });
        }
        let is_ok_6 = false;
        let error_acc_7 = [];
        if (Array.isArray(input["unionWithNull"])) {
            for (const array_item_8 of input["unionWithNull"]){
                error_acc_7.push(...add_path_to_errors(validate_ChildUser(array_item_8), [
                    "User",
                    "unionWithNull",
                    "[]"
                ]));
            }
        } else {
            error_acc_7.push({
                "kind": [
                    "NotAnArray"
                ],
                "path": [
                    "User",
                    "unionWithNull"
                ]
            });
        }
        is_ok_6 = is_ok_6 || error_acc_7.length === 0;
        let error_acc_9 = [];
        if (typeof input["unionWithNull"] != "number") {
            error_acc_9.push({
                "kind": [
                    "NotTypeof",
                    "number"
                ],
                "path": [
                    "User",
                    "unionWithNull"
                ]
            });
        }
        is_ok_6 = is_ok_6 || error_acc_9.length === 0;
        let error_acc_10 = [];
        if (input["unionWithNull"] != null) {
            error_acc_10.push({
                "kind": [
                    "NotEq",
                    null
                ],
                "path": [
                    "User",
                    "unionWithNull"
                ]
            });
        }
        is_ok_6 = is_ok_6 || error_acc_10.length === 0;
        if (!(is_ok_6)) {
            error_acc_0.push({
                "kind": [
                    "InvalidUnion"
                ],
                "path": [
                    "User",
                    "unionWithNull"
                ]
            });
        }
        if (input["f"] != null) {}
        if (input["g"] != "a") {
            error_acc_0.push({
                "kind": [
                    "NotEq",
                    "a"
                ],
                "path": [
                    "User",
                    "g"
                ]
            });
        }
        let is_ok_11 = false;
        let error_acc_12 = [];
        if (input["h"] != "a") {
            error_acc_12.push({
                "kind": [
                    "NotEq",
                    "a"
                ],
                "path": [
                    "User",
                    "h"
                ]
            });
        }
        is_ok_11 = is_ok_11 || error_acc_12.length === 0;
        let error_acc_13 = [];
        if (input["h"] != "b") {
            error_acc_13.push({
                "kind": [
                    "NotEq",
                    "b"
                ],
                "path": [
                    "User",
                    "h"
                ]
            });
        }
        is_ok_11 = is_ok_11 || error_acc_13.length === 0;
        let error_acc_14 = [];
        if (input["h"] != "c") {
            error_acc_14.push({
                "kind": [
                    "NotEq",
                    "c"
                ],
                "path": [
                    "User",
                    "h"
                ]
            });
        }
        is_ok_11 = is_ok_11 || error_acc_14.length === 0;
        if (!(is_ok_11)) {
            error_acc_0.push({
                "kind": [
                    "InvalidUnion"
                ],
                "path": [
                    "User",
                    "h"
                ]
            });
        }
        if (typeof input["i"] == "object" && input["i"] != null) {
            if (input["i"]["a"] != 1) {
                error_acc_0.push({
                    "kind": [
                        "NotEq",
                        1
                    ],
                    "path": [
                        "User",
                        "i",
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
                    "User",
                    "i"
                ]
            });
        }
        if (typeof input["i"] == "object" && input["i"] != null) {
            if (input["i"]["b"] != 2) {
                error_acc_0.push({
                    "kind": [
                        "NotEq",
                        2
                    ],
                    "path": [
                        "User",
                        "i",
                        "b"
                    ]
                });
            }
        } else {
            error_acc_0.push({
                "kind": [
                    "NotAnObject"
                ],
                "path": [
                    "User",
                    "i"
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
export const meta = {
    "handlersMeta": [
        {
            "method_kind": "get",
            "params": [
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
            "pattern": "/{id}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                error_acc_0.push(...add_path_to_errors(validate_User(input), [
                    "[GET] /{id}.response_body"
                ]));
                return error_acc_0;
            }
        }
    ],
    "schema": {
        "openapi": "3.1.0",
        "info": {},
        "paths": {
            "/{id}": {
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
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/User"
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
                "ChildUser": {
                    "type": "object",
                    "required": [
                        "id",
                        "user"
                    ],
                    "properties": {
                        "id": {
                            "type": "string"
                        },
                        "user": {
                            "$ref": "#/components/schemas/User"
                        }
                    }
                },
                "User": {
                    "type": "object",
                    "required": [
                        "a",
                        "b",
                        "c",
                        "c2",
                        "d",
                        "union",
                        "unionWithNull",
                        "e",
                        "g",
                        "h",
                        "i"
                    ],
                    "properties": {
                        "a": {
                            "type": "string"
                        },
                        "b": {
                            "type": "number"
                        },
                        "c": {
                            "type": "boolean"
                        },
                        "c2": {
                            "type": "array",
                            "items": {
                                "type": "boolean"
                            }
                        },
                        "d": {
                            "type": "array",
                            "items": {
                                "$ref": "#/components/schemas/User"
                            }
                        },
                        "childUser": {
                            "$ref": "#/components/schemas/ChildUser"
                        },
                        "thisUser": {
                            "$ref": "#/components/schemas/User"
                        },
                        "thisUser2": {
                            "type": "object",
                            "required": [
                                "user"
                            ],
                            "properties": {
                                "user": {
                                    "$ref": "#/components/schemas/User"
                                }
                            }
                        },
                        "union": {
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
                                    "type": "array",
                                    "items": {
                                        "$ref": "#/components/schemas/ChildUser"
                                    }
                                },
                                {
                                    "type": "number"
                                },
                                {
                                    "type": "null"
                                }
                            ]
                        },
                        "e": {},
                        "f": {},
                        "g": {
                            "const": "a"
                        },
                        "h": {
                            "enum": [
                                "a",
                                "b",
                                "c"
                            ]
                        },
                        "i": {
                            "allOf": [
                                {
                                    "type": "object",
                                    "required": [
                                        "a"
                                    ],
                                    "properties": {
                                        "a": {
                                            "const": 1
                                        }
                                    }
                                },
                                {
                                    "type": "object",
                                    "required": [
                                        "b"
                                    ],
                                    "properties": {
                                        "b": {
                                            "const": 2
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }
    }
};

