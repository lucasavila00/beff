
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

// runtime/runtime.ts
var template = `
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
var printKind = (kind) => {
  switch (kind[0]) {
    case "NotTypeof": {
      return `expected ${kind[1]}`;
    }
    default: {
      return "unknown";
    }
  }
};
var printValidationErrors = (errors) => {
  return errors.map((e) => {
    return `Decoder error at ${e.path.join(".")}: ${printKind(e.kind)}.`;
  }).join("\n");
};
var BffHTTPException = class {
  status;
  message;
  constructor(status, message) {
    this.status = status;
    this.message = message;
  }
};
var decodeWithMessage = (validator, value) => {
  const errs = validator(value);
  if (errs.length > 0) {
    throw new BffHTTPException(422, printValidationErrors(errs));
  }
  return value;
};
var decodeNoMessage = (validator, value) => {
  const errs = validator(value);
  if (errs.length > 0) {
    throw new BffHTTPException(422, "Internal validation error");
  }
  return value;
};
var coerce = (coercer, value) => {
  return coercer(value);
};

// runtime/hono-runtime.ts
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

// runtime/client-impl.ts
var BffRequest = class {
  method;
  url;
  headers;
  cookies;
  requestBodyStringified;
  constructor(method, url, headers, cookies, requestBodyStringified) {
    this.method = method.toUpperCase();
    this.url = url;
    this.headers = headers;
    this.cookies = cookies;
    this.requestBodyStringified = requestBodyStringified;
  }
};
function buildStableClient(fetcher) {
  const client = {};
  const handlersMeta = meta["handlersMeta"];
  for (const meta2 of handlersMeta) {
    if (client[meta2.pattern] == null) {
      client[meta2.pattern] = {};
    }
    client[meta2.pattern][meta2.method_kind] = async (...params) => {
      let url = meta2.pattern;
      const method = meta2.method_kind.toUpperCase();
      const init = {};
      init.headers = {};
      init.headers["content-type"] = "application/json";
      let hasAddedQueryParams = false;
      const clientParams = meta2.params.filter((it) => it.type != "context");
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
            break;
          }
          default: {
            throw new Error("not implemented: " + metadata.type);
          }
        }
      }
      return await fetcher(
        new BffRequest(
          method,
          url,
          init.headers ?? {},
          init.cookies ?? [],
          init.requestBodyStringified
        )
      );
    };
  }
  return client;
}

// runtime/hono-runtime.ts
var toHonoPattern = (pattern) => {
  return pattern.replace(/\{(\w+)\}/g, ":$1");
};
var handleMethod = async (c, meta2, handler) => {
  const resolverParamsPromise = meta2.params.map(async (p) => {
    switch (p.type) {
      case "path": {
        const value = c.hono.req.param(p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "query": {
        const value = c.hono.req.query(p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "cookie": {
        const value = getCookie(c.hono, p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "header": {
        const value = c.hono.req.header(p.name);
        const coerced = coerce(p.coercer, value);
        return decodeWithMessage(p.validator, coerced);
      }
      case "body": {
        const value = await c.hono.req.json();
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
  return c.hono.json(decodeNoMessage(meta2.return_validator, result));
};
var registerDocs = (app, metadata, servers) => {
  app.get(
    "/v3/openapi.json",
    (req) => req.json({
      ...metadata["schema"],
      servers
    })
  );
  app.get("/docs", (c) => c.html(template));
};
function registerRouter(options) {
  registerDocs(options.app, meta, options.openApi?.servers ?? []);
  const handlersMeta = meta["handlersMeta"];
  for (const meta2 of handlersMeta) {
    const handlerData = options.router[meta2.pattern][meta2.method_kind];
    if (handlerData == null) {
      throw new Error(
        "handler not found: " + meta2.method_kind + "  " + meta2.pattern
      );
    }
    const app = options.app;
    switch (meta2.method_kind) {
      case "use": {
        if (Array.isArray(handlerData)) {
          for (const h of handlerData) {
            app.use(meta2.pattern, h);
          }
        } else {
          app.use(meta2.pattern, handlerData);
        }
        break;
      }
      case "get":
      case "post":
      case "put":
      case "delete":
      case "patch":
      case "options": {
        app[meta2.method_kind](toHonoPattern(meta2.pattern), async (c) => {
          try {
            return await handleMethod({ hono: c }, meta2, handlerData);
          } catch (e) {
            if (e instanceof BffHTTPException) {
              throw new HTTPException(e.status, {
                message: e.message
              });
            }
            throw e;
          }
        });
        break;
      }
      default: {
        throw new Error("Method not recognized: " + meta2.method_kind);
      }
    }
  }
}
var buildHonoTestClient = (app, env, executionContext) => buildStableClient(async (req) => {
  const r = await app.fetch(
    //@ts-ignore
    new Request("http://localhost" + req.url, {
      method: req.method,
      headers: {
        ...req.headers,
        "content-type": "application/json",
        cookie: req.cookies.join(";")
      },
      body: req.requestBodyStringified
    }),
    env,
    executionContext
  );
  if (r.ok) {
    return r.json();
  }
  throw await r.text();
});
export {
  buildHonoTestClient,
  registerRouter
};
