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
export const todo = () => {
    throw new Error("TODO: not implemented");
};
export class BffRequest {
    constructor(method, url, headers, cookies, requestBodyStringified) {
        this.method = method.toUpperCase();
        this.url = url;
        this.headers = headers;
        this.cookies = cookies;
        this.requestBodyStringified = requestBodyStringified;
    }
}
export function buildStableClient(fetcher) {
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
            let hasAddedQueryParams = false;
            for (let index = 0; index < meta.params.length; index++) {
                const metadata = meta.params[index];
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
                        if (init.headers == null) {
                            init.headers = {};
                        }
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
export const buildHonoTestClient = (app) => buildStableClient(async (req) => {
    const r = await app.fetch(new Request("http://localhost" + req.url, {
        method: req.method,
        headers: {
            ...req.headers,
            "content-type": "application/json",
            cookie: req.cookies.join(";"),
        },
        body: req.requestBodyStringified,
    }));
    if (r.ok) {
        return r.json();
    }
    throw await r.text();
});

function validate_ValidIds(input) {
    let error_acc_0 = [];
    let is_ok_1 = false;
    let error_acc_2 = [];
    if (input != 123) {
        error_acc_2.push({
            "kind": [
                "NotEq",
                123
            ],
            "path": [
                "ValidIds"
            ]
        });
    }
    is_ok_1 = is_ok_1 || error_acc_2.length === 0;
    let error_acc_3 = [];
    if (input != 456) {
        error_acc_3.push({
            "kind": [
                "NotEq",
                456
            ],
            "path": [
                "ValidIds"
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
                "ValidIds"
            ]
        });
    }
    return error_acc_0;
}
export const meta = {
    "handlersMeta": [
        {
            "method_kind": "use",
            "params": [],
            "pattern": "/*",
            "return_validator": function(input) {
                let error_acc_0 = [];
                return error_acc_0;
            }
        },
        {
            "method_kind": "get",
            "params": [],
            "pattern": "/hello",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "[GET] /hello.response_body"
                        ]
                    });
                }
                return error_acc_0;
            }
        },
        {
            "method_kind": "post",
            "params": [],
            "pattern": "/hello",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "[POST] /hello.response_body"
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
            "pattern": "/path-param/{name}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "[GET] /path-param/{name}.response_body"
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
            "pattern": "/path-param/{name}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "[POST] /path-param/{name}.response_body"
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
                    "type": "query",
                    "name": "limit",
                    "required": true,
                    "validator": function(input) {
                        let error_acc_0 = [];
                        if (typeof input != "number") {
                            error_acc_0.push({
                                "kind": [
                                    "NotTypeof",
                                    "number"
                                ],
                                "path": [
                                    'Query Parameter "limit"'
                                ]
                            });
                        }
                        return error_acc_0;
                    },
                    "coercer": function(input) {
                        return coerce_number(input);
                    }
                }
            ],
            "pattern": "/query-param",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "number") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "number"
                        ],
                        "path": [
                            "[GET] /query-param.response_body"
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
                    "type": "header",
                    "name": "user_agent",
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
                                    'Header Argument "user_agent"'
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
            "pattern": "/header-param",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "[GET] /header-param.response_body"
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
                    "type": "cookie",
                    "name": "ads_ids",
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
                                    'Cookie Argument "ads_ids"'
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
            "pattern": "/cookie-param",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "[GET] /cookie-param.response_body"
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
                    "type": "body",
                    "name": "data",
                    "required": true,
                    "validator": function(input) {
                        let error_acc_0 = [];
                        if (typeof input == "object" && input != null) {
                            if (typeof input["a"] != "string") {
                                error_acc_0.push({
                                    "kind": [
                                        "NotTypeof",
                                        "string"
                                    ],
                                    "path": [
                                        "Request Body",
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
                                    "Request Body"
                                ]
                            });
                        }
                        return error_acc_0;
                    }
                }
            ],
            "pattern": "/req-body",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "[POST] /req-body.response_body"
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
            "pattern": "/path-param-string/{name}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "string") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "string"
                        ],
                        "path": [
                            "[GET] /path-param-string/{name}.response_body"
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
                    "type": "path",
                    "name": "id",
                    "required": true,
                    "validator": function(input) {
                        let error_acc_0 = [];
                        if (typeof input != "number") {
                            error_acc_0.push({
                                "kind": [
                                    "NotTypeof",
                                    "number"
                                ],
                                "path": [
                                    'Path Parameter "id"'
                                ]
                            });
                        }
                        return error_acc_0;
                    },
                    "coercer": function(input) {
                        return coerce_number(input);
                    }
                }
            ],
            "pattern": "/path-param-number/{id}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "number") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "number"
                        ],
                        "path": [
                            "[GET] /path-param-number/{id}.response_body"
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
                    "type": "path",
                    "name": "flag",
                    "required": true,
                    "validator": function(input) {
                        let error_acc_0 = [];
                        if (typeof input != "boolean") {
                            error_acc_0.push({
                                "kind": [
                                    "NotTypeof",
                                    "boolean"
                                ],
                                "path": [
                                    'Path Parameter "flag"'
                                ]
                            });
                        }
                        return error_acc_0;
                    },
                    "coercer": function(input) {
                        return coerce_boolean(input);
                    }
                }
            ],
            "pattern": "/path-param-boolean/{flag}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                if (typeof input != "boolean") {
                    error_acc_0.push({
                        "kind": [
                            "NotTypeof",
                            "boolean"
                        ],
                        "path": [
                            "[GET] /path-param-boolean/{flag}.response_body"
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
                    "type": "path",
                    "name": "id",
                    "required": true,
                    "validator": function(input) {
                        let error_acc_0 = [];
                        error_acc_0.push(...add_path_to_errors(validate_ValidIds(input), [
                            'Path Parameter "id"'
                        ]));
                        return error_acc_0;
                    },
                    "coercer": function(input) {
                        return coerce_union(input, function(input) {
                            return input;
                        }, function(input) {
                            return input;
                        });
                    }
                }
            ],
            "pattern": "/path-param-union/{id}",
            "return_validator": function(input) {
                let error_acc_0 = [];
                error_acc_0.push(...add_path_to_errors(validate_ValidIds(input), [
                    "[GET] /path-param-union/{id}.response_body"
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
            "/hello": {
                "get": {
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "string"
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
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/path-param/{name}": {
                "get": {
                    "parameters": [
                        {
                            "name": "name",
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
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "post": {
                    "parameters": [
                        {
                            "name": "name",
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
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/query-param": {
                "get": {
                    "parameters": [
                        {
                            "name": "limit",
                            "in": "query",
                            "required": true,
                            "schema": {
                                "type": "number"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "number"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/header-param": {
                "get": {
                    "parameters": [
                        {
                            "name": "user_agent",
                            "in": "header",
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
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/cookie-param": {
                "get": {
                    "parameters": [
                        {
                            "name": "ads_ids",
                            "in": "cookie",
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
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/req-body": {
                "post": {
                    "requestBody": {
                        "required": true,
                        "content": {
                            "application/json": {
                                "schema": {
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
                    },
                    "parameters": [],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/path-param-string/{name}": {
                "get": {
                    "parameters": [
                        {
                            "name": "name",
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
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/path-param-number/{id}": {
                "get": {
                    "parameters": [
                        {
                            "name": "id",
                            "in": "path",
                            "required": true,
                            "schema": {
                                "type": "number"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "number"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/path-param-boolean/{flag}": {
                "get": {
                    "parameters": [
                        {
                            "name": "flag",
                            "in": "path",
                            "required": true,
                            "schema": {
                                "type": "boolean"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "boolean"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/path-param-union/{id}": {
                "get": {
                    "parameters": [
                        {
                            "name": "id",
                            "in": "path",
                            "required": true,
                            "schema": {
                                "$ref": "#/components/schemas/ValidIds"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "successful operation",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/ValidIds"
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
                "ValidIds": {
                    "enum": [
                        123,
                        456
                    ]
                }
            }
        }
    }
};

