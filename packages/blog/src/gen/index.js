"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHonoTestClient = exports.buildStableClient = exports.BffRequest = exports.todo = exports.registerRouter = void 0;
const http_exception_1 = require("hono/http-exception");
const cookie_1 = require("hono/cookie");
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
function coerce_union(input, ...cases) {
    for (const c of cases) {
        const r = coerce(c, input);
        if (!(r instanceof CoercionFailure)) {
            return r;
        }
    }
    return new CoercionFailure();
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
        throw new http_exception_1.HTTPException(422, { message: printValidationErrors(errs) });
    }
    return value;
};
const decodeNoMessage = (validator, value) => {
    const errs = validator(value);
    if (errs.length > 0) {
        throw new http_exception_1.HTTPException(422, { message: "Internal validation error" });
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
                const value = (0, cookie_1.getCookie)(c, p.name);
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
            case "context": {
                return c;
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
function registerRouter(options) {
    registerDocs(options.app, meta, options.openApi?.servers ?? []);
    const handlersMeta = meta["handlersMeta"];
    for (const meta of handlersMeta) {
        const handlerData = options.router[meta.pattern][meta.method_kind];
        if (handlerData == null) {
            throw new Error("handler not found: " + meta.method_kind + "  " + meta.pattern);
        }
        const app = options.app;
        switch (meta.method_kind) {
            case "use": {
                if (Array.isArray(handlerData)) {
                    for (const h of handlerData) {
                        app.use(meta.pattern, h);
                    }
                }
                else {
                    app.use(meta.pattern, handlerData);
                }
                break;
            }
            case "get":
            case "post":
            case "put":
            case "delete":
            case "patch":
            case "options": {
                app[meta.method_kind](toHonoPattern(meta.pattern), async (c) => handleMethod(c, meta, handlerData));
                break;
            }
            default: {
                throw new Error("Method not recognized: " + meta.method_kind);
            }
        }
    }
}
exports.registerRouter = registerRouter;
const todo = () => {
    throw new Error("TODO: not implemented");
};
exports.todo = todo;
class BffRequest {
    constructor(method, url, headers, cookies, requestBodyStringified) {
        this.method = method.toUpperCase();
        this.url = url;
        this.headers = headers;
        this.cookies = cookies;
        this.requestBodyStringified = requestBodyStringified;
    }
}
exports.BffRequest = BffRequest;
function buildStableClient(fetcher) {
    const client = {};
    const handlersMeta = meta["handlersMeta"];
    for (const meta of handlersMeta) {
        if (client[meta.pattern] == null) {
            client[meta.pattern] = {};
        }
        client[meta.pattern][meta.method_kind] = async (...params) => {
            let url = meta.pattern;
            const method = meta.method_kind.toUpperCase();
            const init = {};
            init.headers = {};
            init.headers["content-type"] = "application/json";
            let hasAddedQueryParams = false;
            const clientParams = meta.params.filter((it) => it.type != "context");
            for (let index = 0; index < clientParams.length; index++) {
                const metadata = clientParams[index];
                const param = params[index];
                switch (metadata.type) {
                    case "path": {
                        url = url.replace(`{${metadata.name}}`, param);
                        break;
                    }
                    case "query": {
                        if (!hasAddedQueryParams) {
                            url += "?";
                            hasAddedQueryParams = true;
                        }
                        url += `${metadata.name}=${param}&`;
                        break;
                    }
                    case "header": {
                        init.headers[metadata.name] = param;
                        break;
                    }
                    case "cookie": {
                        if (init.cookies == null) {
                            init.cookies = [];
                        }
                        init.cookies.push(`${metadata.name}=${param}`);
                        break;
                    }
                    case "body": {
                        init.requestBodyStringified = JSON.stringify(param);
                        break;
                    }
                    case "context": {
                        // not a client parameter
                        break;
                    }
                    default: {
                        throw new Error("not implemented: " + metadata.type);
                    }
                }
            }
            return await fetcher(new BffRequest(method, url, init.headers ?? {}, init.cookies ?? [], init.requestBodyStringified));
        };
    }
    return client;
}
exports.buildStableClient = buildStableClient;
const buildHonoTestClient = (app, env, executionContext) => buildStableClient(async (req) => {
    const r = await app.fetch(new Request("http://localhost" + req.url, {
        method: req.method,
        headers: {
            ...req.headers,
            "content-type": "application/json",
            cookie: req.cookies.join(";"),
        },
        body: req.requestBodyStringified,
    }), env, executionContext);
    if (r.ok) {
        return r.json();
    }
    throw await r.text();
});
exports.buildHonoTestClient = buildHonoTestClient;

function validate_Post(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["id"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "Post",
                    "id"
                ]
            });
        }
        if (typeof input["title"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "Post",
                    "title"
                ]
            });
        }
        if (typeof input["body"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "Post",
                    "body"
                ]
            });
        }
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "Post"
            ]
        });
    }
    return error_acc_0;
}
function validate_Param(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["title"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "Param",
                    "title"
                ]
            });
        }
        if (typeof input["body"] != "string") {
            error_acc_0.push({
                "kind": [
                    "NotTypeof",
                    "string"
                ],
                "path": [
                    "Param",
                    "body"
                ]
            });
        }
    } else {
        error_acc_0.push({
            "kind": [
                "NotAnObject"
            ],
            "path": [
                "Param"
            ]
        });
    }
    return error_acc_0;
}
const meta = {
    "handlersMeta": [
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
                            "kind": [
                                "NotTypeof",
                                "string"
                            ],
                            "path": [
                                "[GET] /.response_body",
                                "message"
                            ]
                        });
                    }
                } else {
                    error_acc_0.push({
                        "kind": [
                            "NotAnObject"
                        ],
                        "path": [
                            "[GET] /.response_body"
                        ]
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
                        for (const array_item_1 of input["posts"]){
                            error_acc_0.push(...add_path_to_errors(validate_Post(array_item_1), [
                                "[GET] /posts.response_body",
                                "posts",
                                "[]"
                            ]));
                        }
                    } else {
                        error_acc_0.push({
                            "kind": [
                                "NotAnArray"
                            ],
                            "path": [
                                "[GET] /posts.response_body",
                                "posts"
                            ]
                        });
                    }
                    if (typeof input["ok"] != "boolean") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "boolean"
                            ],
                            "path": [
                                "[GET] /posts.response_body",
                                "ok"
                            ]
                        });
                    }
                } else {
                    error_acc_0.push({
                        "kind": [
                            "NotAnObject"
                        ],
                        "path": [
                            "[GET] /posts.response_body"
                        ]
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
                            "Request Body"
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
                            "kind": [
                                "NotEq",
                                true
                            ],
                            "path": [
                                "[POST] /posts.response_body",
                                "ok"
                            ]
                        });
                    }
                    error_acc_2.push(...add_path_to_errors(validate_Post(input["post"]), [
                        "[POST] /posts.response_body",
                        "post"
                    ]));
                } else {
                    error_acc_2.push({
                        "kind": [
                            "NotAnObject"
                        ],
                        "path": [
                            "[POST] /posts.response_body"
                        ]
                    });
                }
                is_ok_1 = is_ok_1 || error_acc_2.length === 0;
                let error_acc_3 = [];
                if (typeof input == "object" && input != null) {
                    if (input["ok"] != false) {
                        error_acc_3.push({
                            "kind": [
                                "NotEq",
                                false
                            ],
                            "path": [
                                "[POST] /posts.response_body",
                                "ok"
                            ]
                        });
                    }
                    if (typeof input["error"] != "string") {
                        error_acc_3.push({
                            "kind": [
                                "NotTypeof",
                                "string"
                            ],
                            "path": [
                                "[POST] /posts.response_body",
                                "error"
                            ]
                        });
                    }
                } else {
                    error_acc_3.push({
                        "kind": [
                            "NotAnObject"
                        ],
                        "path": [
                            "[POST] /posts.response_body"
                        ]
                    });
                }
                is_ok_1 = is_ok_1 || error_acc_3.length === 0;
                if (!(is_ok_1)) {
                    error_acc_0.push({
                        "kind": [
                            "InvalidUnion"
                        ],
                        "path": [
                            "[POST] /posts.response_body"
                        ]
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
            "pattern": "/posts/{id}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                let is_ok_1 = false;
                let error_acc_2 = [];
                if (typeof input == "object" && input != null) {
                    if (input["ok"] != true) {
                        error_acc_2.push({
                            "kind": [
                                "NotEq",
                                true
                            ],
                            "path": [
                                "[GET] /posts/{id}.response_body",
                                "ok"
                            ]
                        });
                    }
                    error_acc_2.push(...add_path_to_errors(validate_Post(input["post"]), [
                        "[GET] /posts/{id}.response_body",
                        "post"
                    ]));
                } else {
                    error_acc_2.push({
                        "kind": [
                            "NotAnObject"
                        ],
                        "path": [
                            "[GET] /posts/{id}.response_body"
                        ]
                    });
                }
                is_ok_1 = is_ok_1 || error_acc_2.length === 0;
                let error_acc_3 = [];
                if (typeof input == "object" && input != null) {
                    if (input["ok"] != false) {
                        error_acc_3.push({
                            "kind": [
                                "NotEq",
                                false
                            ],
                            "path": [
                                "[GET] /posts/{id}.response_body",
                                "ok"
                            ]
                        });
                    }
                    if (typeof input["error"] != "string") {
                        error_acc_3.push({
                            "kind": [
                                "NotTypeof",
                                "string"
                            ],
                            "path": [
                                "[GET] /posts/{id}.response_body",
                                "error"
                            ]
                        });
                    }
                } else {
                    error_acc_3.push({
                        "kind": [
                            "NotAnObject"
                        ],
                        "path": [
                            "[GET] /posts/{id}.response_body"
                        ]
                    });
                }
                is_ok_1 = is_ok_1 || error_acc_3.length === 0;
                if (!(is_ok_1)) {
                    error_acc_0.push({
                        "kind": [
                            "InvalidUnion"
                        ],
                        "path": [
                            "[GET] /posts/{id}.response_body"
                        ]
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
                },
                {
                    "type": "body",
                    "name": "param",
                    "required": true,
                    "validator": function(input) {
                        let error_acc_0 = [];
                        error_acc_0.push(...add_path_to_errors(validate_Param(input), [
                            "Request Body"
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
                            "kind": [
                                "NotTypeof",
                                "boolean"
                            ],
                            "path": [
                                "[PUT] /posts/{id}.response_body",
                                "ok"
                            ]
                        });
                    }
                } else {
                    error_acc_0.push({
                        "kind": [
                            "NotAnObject"
                        ],
                        "path": [
                            "[PUT] /posts/{id}.response_body"
                        ]
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
            "pattern": "/posts/{id}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input == "object" && input != null) {
                    if (typeof input["ok"] != "boolean") {
                        error_acc_0.push({
                            "kind": [
                                "NotTypeof",
                                "boolean"
                            ],
                            "path": [
                                "[DELETE] /posts/{id}.response_body",
                                "ok"
                            ]
                        });
                    }
                } else {
                    error_acc_0.push({
                        "kind": [
                            "NotAnObject"
                        ],
                        "path": [
                            "[DELETE] /posts/{id}.response_body"
                        ]
                    });
                }
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
            "/": {
                "get": {
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "successful operation",
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
            "/posts": {
                "get": {
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": [
                                            "posts",
                                            "ok"
                                        ],
                                        "properties": {
                                            "posts": {
                                                "type": "array",
                                                "items": {
                                                    "$ref": "#/components/schemas/Post"
                                                }
                                            },
                                            "ok": {
                                                "type": "boolean"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "post": {
                    "requestBody": {
                        "required": true,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/Param"
                                }
                            }
                        }
                    },
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "anyOf": [
                                            {
                                                "type": "object",
                                                "required": [
                                                    "ok",
                                                    "post"
                                                ],
                                                "properties": {
                                                    "ok": {
                                                        "const": true
                                                    },
                                                    "post": {
                                                        "$ref": "#/components/schemas/Post"
                                                    }
                                                }
                                            },
                                            {
                                                "type": "object",
                                                "required": [
                                                    "ok",
                                                    "error"
                                                ],
                                                "properties": {
                                                    "ok": {
                                                        "const": false
                                                    },
                                                    "error": {
                                                        "type": "string"
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
            },
            "/posts/{id}": {
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
                                        "anyOf": [
                                            {
                                                "type": "object",
                                                "required": [
                                                    "ok",
                                                    "post"
                                                ],
                                                "properties": {
                                                    "ok": {
                                                        "const": true
                                                    },
                                                    "post": {
                                                        "$ref": "#/components/schemas/Post"
                                                    }
                                                }
                                            },
                                            {
                                                "type": "object",
                                                "required": [
                                                    "ok",
                                                    "error"
                                                ],
                                                "properties": {
                                                    "ok": {
                                                        "const": false
                                                    },
                                                    "error": {
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                "put": {
                    "requestBody": {
                        "required": true,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/Param"
                                }
                            }
                        }
                    },
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
                                        "type": "object",
                                        "required": [
                                            "ok"
                                        ],
                                        "properties": {
                                            "ok": {
                                                "type": "boolean"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "delete": {
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
                                        "type": "object",
                                        "required": [
                                            "ok"
                                        ],
                                        "properties": {
                                            "ok": {
                                                "type": "boolean"
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
                "Post": {
                    "type": "object",
                    "required": [
                        "id",
                        "title",
                        "body"
                    ],
                    "properties": {
                        "id": {
                            "type": "string"
                        },
                        "title": {
                            "type": "string"
                        },
                        "body": {
                            "type": "string"
                        }
                    }
                },
                "Param": {
                    "type": "object",
                    "required": [
                        "title",
                        "body"
                    ],
                    "properties": {
                        "title": {
                            "type": "string"
                        },
                        "body": {
                            "type": "string"
                        }
                    }
                }
            }
        }
    }
};
exports.meta = meta;
