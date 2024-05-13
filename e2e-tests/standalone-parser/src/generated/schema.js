const jsonSchema = {
  "AObject": {
    "additionalProperties": false,
    "properties": {
      "tag": {
        "const": "a"
      }
    },
    "required": [
      "tag"
    ],
    "type": "object"
  },
  "AccessLevel": {
    "enum": [
      "ADMIN",
      "USER"
    ],
    "type": "string"
  },
  "AccessLevelCodec": {
    "enum": [
      "ADMIN",
      "USER"
    ],
    "type": "string"
  },
  "AccessLevelTpl": {
    "format": "(\"ADMIN\" | \"USER\")",
    "type": "string"
  },
  "AccessLevelTpl2": {
    "format": "(\"ADMIN Admin\" | \"USER User\")",
    "type": "string"
  },
  "AllTs": {
    "enum": [
      "a",
      "b"
    ],
    "type": "string"
  },
  "AllTypes": {
    "enum": [
      "LevelAndDSettings",
      "OmitSettings",
      "PartialSettings",
      "RequiredPartialObject"
    ],
    "type": "string"
  },
  "Arr2C": {
    "enum": [
      "A",
      "B",
      "C"
    ],
    "type": "string"
  },
  "Arr3": {
    "enum": [
      "X",
      "Y"
    ],
    "type": "string"
  },
  "AvatarSize": {
    "format": "${number}x${number}",
    "type": "string"
  },
  "BObject": {
    "additionalProperties": false,
    "properties": {
      "tag": {
        "const": "b"
      }
    },
    "required": [
      "tag"
    ],
    "type": "object"
  },
  "DiscriminatedUnion": {
    "anyOf": [
      {
        "additionalProperties": false,
        "properties": {
          "a1": {
            "type": "string"
          },
          "a11": {
            "type": "string"
          },
          "subType": {
            "const": "a1"
          },
          "type": {
            "const": "a"
          }
        },
        "required": [
          "a1",
          "subType",
          "type"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "a2": {
            "type": "string"
          },
          "subType": {
            "const": "a2"
          },
          "type": {
            "const": "a"
          }
        },
        "required": [
          "a2",
          "subType",
          "type"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "type": {
            "const": "b"
          },
          "value": {
            "type": "number"
          }
        },
        "required": [
          "type",
          "value"
        ],
        "type": "object"
      }
    ]
  },
  "DiscriminatedUnion2": {
    "anyOf": [
      {
        "additionalProperties": false,
        "properties": {
          "a1": {
            "type": "string"
          },
          "a11": {
            "type": "string"
          },
          "subType": {
            "const": "a1"
          },
          "type": {
            "const": "a"
          }
        },
        "required": [
          "a1",
          "subType",
          "type"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "a2": {
            "type": "string"
          },
          "subType": {
            "const": "a2"
          },
          "type": {
            "const": "a"
          }
        },
        "required": [
          "a2",
          "subType",
          "type"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "type": {
            "const": "d"
          },
          "valueD": {
            "type": "number"
          }
        },
        "required": [
          "valueD"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "type": {
            "const": "b"
          },
          "value": {
            "type": "number"
          }
        },
        "required": [
          "type",
          "value"
        ],
        "type": "object"
      }
    ]
  },
  "DiscriminatedUnion3": {
    "anyOf": [
      {
        "additionalProperties": false,
        "properties": {
          "a1": {
            "type": "string"
          },
          "type": {
            "enum": [
              "a",
              "c"
            ],
            "type": "string"
          }
        },
        "required": [
          "a1",
          "type"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "type": {
            "const": "b"
          },
          "value": {
            "type": "number"
          }
        },
        "required": [
          "type",
          "value"
        ],
        "type": "object"
      }
    ]
  },
  "DiscriminatedUnion4": {
    "anyOf": [
      {
        "additionalProperties": false,
        "properties": {
          "a": {
            "additionalProperties": false,
            "properties": {
              "a1": {
                "type": "string"
              },
              "subType": {
                "const": "a1"
              }
            },
            "required": [
              "a1",
              "subType"
            ],
            "type": "object"
          },
          "type": {
            "const": "a"
          }
        },
        "required": [
          "a",
          "type"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "a": {
            "additionalProperties": false,
            "properties": {
              "a2": {
                "type": "string"
              },
              "subType": {
                "const": "a2"
              }
            },
            "required": [
              "a2",
              "subType"
            ],
            "type": "object"
          },
          "type": {
            "const": "a"
          }
        },
        "required": [
          "a",
          "type"
        ],
        "type": "object"
      }
    ]
  },
  "Extra": {
    "additionalProperties": {
      "type": "string"
    },
    "properties": {},
    "required": [],
    "type": "object"
  },
  "LevelAndDSettings": {
    "additionalProperties": false,
    "properties": {
      "d": {
        "additionalProperties": false,
        "properties": {
          "tag": {
            "const": "d"
          }
        },
        "required": [
          "tag"
        ],
        "type": "object"
      },
      "level": {
        "enum": [
          "a",
          "b"
        ],
        "type": "string"
      }
    },
    "required": [
      "d",
      "level"
    ],
    "type": "object"
  },
  "Mapped": {
    "additionalProperties": false,
    "properties": {
      "a": {
        "additionalProperties": false,
        "properties": {
          "value": {
            "const": "a"
          }
        },
        "required": [
          "value"
        ],
        "type": "object"
      },
      "b": {
        "additionalProperties": false,
        "properties": {
          "value": {
            "const": "b"
          }
        },
        "required": [
          "value"
        ],
        "type": "object"
      }
    },
    "required": [
      "a",
      "b"
    ],
    "type": "object"
  },
  "MappedOptional": {
    "additionalProperties": false,
    "properties": {
      "a": {
        "additionalProperties": false,
        "properties": {
          "value": {
            "const": "a"
          }
        },
        "required": [
          "value"
        ],
        "type": "object"
      },
      "b": {
        "additionalProperties": false,
        "properties": {
          "value": {
            "const": "b"
          }
        },
        "required": [
          "value"
        ],
        "type": "object"
      }
    },
    "required": [],
    "type": "object"
  },
  "OmitSettings": {
    "additionalProperties": false,
    "properties": {
      "d": {
        "additionalProperties": false,
        "properties": {
          "tag": {
            "const": "d"
          }
        },
        "required": [
          "tag"
        ],
        "type": "object"
      },
      "level": {
        "enum": [
          "a",
          "b"
        ],
        "type": "string"
      }
    },
    "required": [
      "d",
      "level"
    ],
    "type": "object"
  },
  "OtherEnum": {
    "enum": [
      "a",
      "b"
    ],
    "type": "string"
  },
  "PartialObject": {
    "additionalProperties": false,
    "properties": {
      "a": {
        "type": "string"
      },
      "b": {
        "type": "number"
      }
    },
    "required": [],
    "type": "object"
  },
  "PartialSettings": {
    "additionalProperties": false,
    "properties": {
      "a": {
        "type": "string"
      },
      "d": {
        "additionalProperties": false,
        "properties": {
          "tag": {
            "const": "d"
          }
        },
        "required": [
          "tag"
        ],
        "type": "object"
      },
      "level": {
        "enum": [
          "a",
          "b"
        ],
        "type": "string"
      }
    },
    "required": [],
    "type": "object"
  },
  "PublicUser": {
    "additionalProperties": false,
    "properties": {
      "accessLevel": {
        "enum": [
          "ADMIN",
          "USER"
        ],
        "type": "string"
      },
      "avatarSize": {
        "format": "${number}x${number}",
        "type": "string"
      },
      "extra": {
        "additionalProperties": {
          "type": "string"
        },
        "properties": {},
        "required": [],
        "type": "object"
      },
      "name": {
        "type": "string"
      }
    },
    "required": [
      "accessLevel",
      "avatarSize",
      "extra",
      "name"
    ],
    "type": "object"
  },
  "Repro1": {
    "additionalProperties": false,
    "properties": {
      "sizes": {
        "additionalProperties": false,
        "properties": {
          "useSmallerSizes": {
            "type": "boolean"
          }
        },
        "required": [
          "useSmallerSizes"
        ],
        "type": "object"
      }
    },
    "required": [],
    "type": "object"
  },
  "Req": {
    "additionalProperties": false,
    "properties": {
      "optional": {
        "type": "string"
      }
    },
    "required": [
      "optional"
    ],
    "type": "object"
  },
  "RequiredPartialObject": {
    "additionalProperties": false,
    "properties": {
      "a": {
        "type": "string"
      },
      "b": {
        "type": "number"
      }
    },
    "required": [
      "a",
      "b"
    ],
    "type": "object"
  },
  "SettingsUpdate": {
    "anyOf": [
      {
        "type": "string"
      },
      {
        "additionalProperties": false,
        "properties": {
          "tag": {
            "const": "d"
          }
        },
        "required": [
          "tag"
        ],
        "type": "object"
      }
    ]
  },
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
  },
  "UnionWithEnumAccess": {
    "anyOf": [
      {
        "additionalProperties": false,
        "properties": {
          "tag": {
            "const": "a"
          },
          "value": {
            "type": "string"
          }
        },
        "required": [
          "tag",
          "value"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "tag": {
            "const": "b"
          },
          "value": {
            "type": "number"
          }
        },
        "required": [
          "tag",
          "value"
        ],
        "type": "object"
      },
      {
        "additionalProperties": false,
        "properties": {
          "tag": {
            "const": "c"
          },
          "value": {
            "type": "boolean"
          }
        },
        "required": [
          "tag",
          "value"
        ],
        "type": "object"
      }
    ]
  },
  "User": {
    "additionalProperties": false,
    "properties": {
      "accessLevel": {
        "enum": [
          "ADMIN",
          "USER"
        ],
        "type": "string"
      },
      "avatarSize": {
        "format": "${number}x${number}",
        "type": "string"
      },
      "extra": {
        "additionalProperties": {
          "type": "string"
        },
        "properties": {},
        "required": [],
        "type": "object"
      },
      "friends": {
        "items": {},
        "type": "array"
      },
      "name": {
        "type": "string"
      }
    },
    "required": [
      "accessLevel",
      "avatarSize",
      "extra",
      "friends",
      "name"
    ],
    "type": "object"
  },
  "ValidCurrency": {
    "format": "ValidCurrency",
    "type": "string"
  },
  "Version": {
    "format": "${number}.${number}.${number}",
    "type": "string"
  },
  "Version2": {
    "format": "v${number}.${number}.${number}",
    "type": "string"
  }
};
export default jsonSchema;