const jsonSchema = {
  "T3": {
    "anyOf": [
      {
        "additionalProperties": false,
        "properties": {
          "kind": {
            "const": "square"
          },
          "x": {
            "type": "number"
          }
        },
        "required": [
          "kind",
          "x"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "kind": {
            "const": "triangle"
          },
          "x": {
            "type": "number"
          },
          "y": {
            "type": "number"
          }
        },
        "required": [
          "kind",
          "x",
          "y"
        ],
        "type": "object"
      }
    ]
  }
};


function buildSchemas() {
  
  return jsonSchema;
}
export default {buildSchemas};