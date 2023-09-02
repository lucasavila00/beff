import { DecodeError, DecodeErrorKind } from "bff-types";

export const template = `
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

const printKind = (kind: DecodeErrorKind): string => {
  switch (kind[0]) {
    case "NotTypeof": {
      return `expected ${kind[1]}`;
    }
    default: {
      return "unknown";
    }
  }
};
const printValidationErrors = (errors: DecodeError[]): string => {
  return errors
    .map((e) => {
      return `Decoder error at ${e.path.join(".")}: ${printKind(e.kind)}.`;
    })
    .join("\n");
};

export class BffHTTPException {
  public status: number;
  public message: string;
  public __isBffHTTPException = true;
  constructor(status: number, message: string) {
    this.status = status;
    this.message = message;
  }
}

export const decodeWithMessage = (validator: any, value: any): any => {
  const errs = validator(value);
  if (errs.length > 0) {
    throw new BffHTTPException(422, printValidationErrors(errs));
  }
  return value;
};
export const decodeNoMessage = (validator: any, value: any): any => {
  const errs = validator(value);
  if (errs.length > 0) {
    throw new BffHTTPException(422, "Internal validation error");
  }
  return value;
};
