const jsonSchema = {
  "A": {
    "enum": [
      1,
      2
    ]
  },
  "B": {
    "enum": [
      2,
      3
    ]
  },
  "D": {
    "enum": [
      4,
      5
    ]
  },
  "E": {
    "enum": [
      5,
      6
    ]
  },
  "NotPublic": {
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
  "UnionNested": {
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
  },
  "User": {
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
  }
};
export default jsonSchema;