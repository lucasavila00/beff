
import vals from "./validators.js"; const { validators, add_path_to_errors, registerStringFormat, isCustomFormatInvalid } = vals;


function CoercionOk(data) {
  return {
    ok: true,
    data,
  }
}

function CoercionNoop(data) {
  return {
    ok: false,
    data,
  }
}
  

function coerce_string(input) {
  if (typeof input === "string") {
    return CoercionOk(input)
  }
  return CoercionNoop(input);
}
const isNumeric = (num) =>
  (typeof num === "number" || (typeof num === "string" && num.trim() !== "")) &&
  !isNaN(num );
function coerce_number(input) {
  if (input == null) {
    return CoercionNoop(input);
  }
  if (isNumeric(input)) {
    return CoercionOk(Number(input));
  }
  return CoercionNoop(input);
}
function coerce_boolean(input) {
  if (input == null) {
    return CoercionNoop(input);
  }
  if (input === "true" || input === "false") {
    return CoercionOk(input === "true");
  }
  if (input === "1" || input === "0") {
    return CoercionOk(input === "1");
  }
  return CoercionNoop(input);
}
function coerce_union(input, ...cases) {
  if (input == null) {
    return CoercionNoop(input);
  }
  for (const c of cases) {
    const r = c(input);
    if (r.ok) {
      return r;
    }
  }
  return CoercionNoop(input);
}

const meta = [
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
        "params": [
            {
                "type": "context"
            }
        ],
        "pattern": "/hello",
        "return_validator": function(input) {
            let error_acc_0 = [];
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
    "schemas": {}
  },
  "info": {
    "title": "No title",
    "version": "0.0.0"
  },
  "openapi": "3.1.0",
  "paths": {
    "/hello": {
      "get": {
        "parameters": [],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {}
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