const jsonSchema = {
  "AccessLevel": {
    "enum": [
      "ADMIN",
      "USER"
    ]
  },
  "AllTypes": {
    "enum": [
      "LevelAndDSettings",
      "OmitSettings",
      "PartialSettings",
      "RequiredPartialObject"
    ]
  },
  "Arr2": {
    "enum": [
      "A",
      "B",
      "C"
    ]
  },
  "Arr3": {
    "enum": [
      "X",
      "Y"
    ]
  },
  "AvatarSize": {
    "type": "string"
  },
  "DiscriminatedUnion": {
    "anyOf": [
      {
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
        "properties": {
          "a1": {
            "type": "string"
          },
          "type": {
            "enum": [
              "a",
              "c"
            ]
          }
        },
        "required": [
          "a1",
          "type"
        ],
        "type": "object"
      },
      {
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
        "properties": {
          "a": {
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
        "properties": {
          "a": {
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
    "properties": {
      "d": {
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
        ]
      }
    },
    "required": [
      "d",
      "level"
    ],
    "type": "object"
  },
  "Mapped": {
    "properties": {
      "a": {
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
    "properties": {
      "a": {
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
    "properties": {
      "d": {
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
        ]
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
    ]
  },
  "PartialObject": {
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
    "properties": {
      "a": {
        "type": "string"
      },
      "d": {
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
        ]
      }
    },
    "required": [],
    "type": "object"
  },
  "PublicUser": {
    "properties": {
      "accessLevel": {
        "enum": [
          "ADMIN",
          "USER"
        ]
      },
      "avatarSize": {
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
    "properties": {
      "sizes": {
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
  "Repro2": {
    "properties": {
      "useSmallerSizes": {
        "type": "boolean"
      }
    },
    "required": [
      "useSmallerSizes"
    ],
    "type": "object"
  },
  "Req": {
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
  "Settings": {
    "properties": {
      "a": {
        "type": "string"
      },
      "d": {
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
        ]
      }
    },
    "required": [
      "a",
      "d",
      "level"
    ],
    "type": "object"
  },
  "SettingsUpdate": {
    "anyOf": [
      {
        "type": "string"
      },
      {
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
  "Shape": {
    "anyOf": [
      {
        "properties": {
          "kind": {
            "const": "circle"
          },
          "radius": {
            "type": "number"
          }
        },
        "required": [
          "kind",
          "radius"
        ],
        "type": "object"
      },
      {
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
  "T3": {
    "anyOf": [
      {
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
    "properties": {
      "accessLevel": {
        "enum": [
          "ADMIN",
          "USER"
        ]
      },
      "avatarSize": {
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
        "items": {
          "properties": {
            "accessLevel": {
              "enum": [
                "ADMIN",
                "USER"
              ]
            },
            "avatarSize": {
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
  "WithOptionals": {
    "properties": {
      "optional": {
        "type": "string"
      }
    },
    "required": [],
    "type": "object"
  }
};