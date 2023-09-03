
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
                "type": "body",
                "name": "param",
                "required": true
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
                "type": "path",
                "name": "id",
                "required": true
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
                "type": "path",
                "name": "id",
                "required": true
            },
            {
                "type": "body",
                "name": "param",
                "required": true
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
                "type": "path",
                "name": "id",
                "required": true
            }
        ],
        "pattern": "/posts/{id}"
    }
];

exports.default = { meta };