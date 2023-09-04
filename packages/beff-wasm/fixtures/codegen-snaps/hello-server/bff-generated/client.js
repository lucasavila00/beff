
const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "query",
                "name": "limit",
                "required": false
            }
        ],
        "pattern": "/optional-query-param"
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/data-types-kitchen-sink"
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/anon-func"
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "header",
                "name": "user_agent",
                "required": true
            }
        ],
        "pattern": "/users"
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
        "pattern": "/users/{id}"
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
        "pattern": "/users2/{id}"
    },
    {
        "method_kind": "post",
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
        "pattern": "/users2/{id}"
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/users3"
    },
    {
        "method_kind": "get",
        "params": [],
        "pattern": "/users4"
    },
    {
        "method_kind": "post",
        "params": [],
        "pattern": "/users4"
    }
];

export default { meta };