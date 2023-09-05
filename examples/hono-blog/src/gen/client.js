
Object.defineProperty(exports, "__esModule", {
  value: true
});
    
const meta = [
    {
        "method_kind": "use",
        "params": [],
        "pattern": "*"
    },
    {
        "method_kind": "use",
        "params": [],
        "pattern": "/posts/*"
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/"
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            }
        ],
        "pattern": "/posts"
    },
    {
        "method_kind": "post",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "param",
                "required": true,
                "type": "body"
            }
        ],
        "pattern": "/posts"
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "id",
                "required": true,
                "type": "path"
            }
        ],
        "pattern": "/posts/{id}"
    },
    {
        "method_kind": "put",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "id",
                "required": true,
                "type": "path"
            },
            {
                "name": "param",
                "required": true,
                "type": "body"
            }
        ],
        "pattern": "/posts/{id}"
    },
    {
        "method_kind": "delete",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "id",
                "required": true,
                "type": "path"
            }
        ],
        "pattern": "/posts/{id}"
    }
];

exports.default = { meta };