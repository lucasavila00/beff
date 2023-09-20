import { FC, ReactNode } from "react";
import { beff } from "./utils/beff";

const Heading: FC<{ data: string }> = ({ data }) => {
  return <h1>{data}</h1>;
};
const Json: FC<{ data: string }> = ({ data }) => {
  return <pre>{data}</pre>;
};
const TsTypes: FC<{ data: string }> = ({ data }) => {
  return <pre>{data}</pre>;
};
const Text: FC<{ data: string }> = ({ data }) => {
  return <p>{data}</p>;
};

const a = JSON.stringify({
  components: {
    responses: {
      DecodeError: {
        content: {
          "application/json": {
            schema: {
              properties: {
                message: {
                  type: "string",
                },
              },
              required: ["message"],
              type: "object",
            },
          },
        },
        description: "Invalid parameters or request body",
      },
      UnexpectedError: {
        content: {
          "application/json": {
            schema: {
              properties: {
                message: {
                  type: "string",
                },
              },
              required: ["message"],
              type: "object",
            },
          },
        },
        description: "Unexpected Error",
      },
    },
    schemas: {},
  },
  info: {
    description:
      "This is an example API router. Adding a comment here adds it to its description.\n\nTitle and version are mandatory on the OpenAPI specification!\n\n\nComments here are added to the description of the API, too.\n",
    title: "Example API",
    version: "1.0.0",
  },
  openapi: "3.1.0",
  paths: {
    "/": {
      get: {
        description:
          "This is an example route. Adding a comment here adds it to its description.\nWe can also add a summary.\n",
        parameters: [],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  type: "string",
                },
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
        summary: "Example route",
      },
    },
    "/hello/{name}": {
      get: {
        description:
          "This is an example route. Adding a comment here adds it to its description.\nSummaries ate not mandatory.",
        parameters: [
          {
            description:
              "This is an example path parameter. Adding a comment here adds it to its description.",
            in: "path",
            name: "name",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {},
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
      },
      post: {
        parameters: [
          {
            in: "path",
            name: "name",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            description:
              "This is an example query parameter. Adding a comment here adds it to its description.",
            in: "query",
            name: "limit",
            required: true,
            schema: {
              type: "number",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  message: {
                    type: "string",
                  },
                },
                required: ["message"],
                type: "object",
              },
            },
          },
          description:
            "This is an example request body parameter. Adding a comment here adds it to its description.",
          required: true,
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {},
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
      },
    },
  },
});

const b = JSON.stringify({
  components: {
    responses: {
      DecodeError: {
        content: {
          "application/json": {
            schema: {
              properties: {
                message: {
                  type: "string",
                },
              },
              required: ["message"],
              type: "object",
            },
          },
        },
        description: "Invalid parameters or request body",
      },
      UnexpectedError: {
        content: {
          "application/json": {
            schema: {
              properties: {
                message: {
                  type: "string",
                },
              },
              required: ["message"],
              type: "object",
            },
          },
        },
        description: "Unexpected Error",
      },
    },
    schemas: {},
  },
  info: {
    description:
      "This is an example API router. Adding a comment here adds it to its description.\n\nTitle and version are mandatory on the OpenAPI specification!\n\n\nComments here are added to the description of the API, too.\n",
    title: "Example API",
    version: "1.0.0",
  },
  openapi: "3.1.0",
  paths: {
    "/": {
      get: {
        description:
          "This is an example route. Adding a comment here adds it to its description.\nWe can also add a summary.\n",
        parameters: [],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  type: "string",
                },
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
        summary: "Example route",
      },
    },
    "/hello/{name}": {
      get: {
        description:
          "This is an example route. Adding a comment here adds it to its description.\nSummaries ate not mandatory.",
        parameters: [
          {
            description:
              "This is an example path parameter. Adding a comment here adds it to its description.",
            in: "path",
            name: "name",
            required: true,
            schema: {
              type: "number",
            },
          },
        ],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {},
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
      },
      post: {
        parameters: [
          {
            in: "path",
            name: "name",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            description:
              "This is an example query parameter. Adding a comment here adds it to its description.",
            in: "query",
            name: "limit",
            required: true,
            schema: {
              type: "number",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  message: {
                    type: "string",
                  },
                },
                required: ["message"],
                type: "object",
              },
            },
          },
          description:
            "This is an example request body parameter. Adding a comment here adds it to its description.",
          required: true,
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {},
              },
            },
            description: "Successful Operation",
          },
          "422": {
            $ref: "#/components/responses/DecodeError",
          },
          "500": {
            $ref: "#/components/responses/UnexpectedError",
          },
        },
      },
    },
  },
});
function MdReport() {
  const response = beff["/compare_schemas"]
    .post({
      from: a,
      to: b,
    })
    .useQuery();

  return (
    <>
      {response.data?.map((it, idx): ReactNode => {
        switch (it._tag) {
          case "Heading": {
            return <Heading key={idx} data={it.data} />;
          }
          case "Json": {
            return <Json key={idx} data={it.data} />;
          }
          case "Text": {
            return <Text key={idx} data={it.data} />;
          }
          case "TsTypes": {
            return <TsTypes key={idx} data={it.data} />;
          }
        }
      })}
    </>
  );
}
export default MdReport;
