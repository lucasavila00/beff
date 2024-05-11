const jsonSchema = {
  "NotPublicRenamed": {
    "additionalProperties": false,
    "properties": {
      "a": {
        "type": "string"
      }
    },
    "required": [
      "a"
    ],
    "type": "object"
  },
  "Password": {
    "format": "password",
    "type": "string"
  },
  "StartsWithA": {
    "format": "StartsWithA",
    "type": "string"
  },
  "User": {
    "additionalProperties": false,
    "properties": {
      "age": {
        "type": "number"
      },
      "name": {
        "type": "string"
      }
    },
    "required": [
      "age",
      "name"
    ],
    "type": "object"
  },
  "Users": {
    "items": {
      "additionalProperties": false,
      "properties": {
        "age": {
          "type": "number"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "age",
        "name"
      ],
      "type": "object"
    },
    "type": "array"
  },
  "float": {
    "const": 123.456
  },
  "int": {
    "const": 123
  },
  "union": {
    "anyOf": [
      {
        "enum": [
          1,
          2
        ]
      },
      {
        "enum": [
          2,
          3
        ]
      },
      {
        "enum": [
          4,
          5
        ]
      },
      {
        "enum": [
          5,
          6
        ]
      }
    ]
  }
};
export default jsonSchema;