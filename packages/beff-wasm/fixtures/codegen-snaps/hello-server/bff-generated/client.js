
const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "limit",
                "required": false,
                "type": "query"
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
                "name": "user_agent",
                "required": true,
                "type": "header"
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
                "name": "id",
                "required": true,
                "type": "path"
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
                "name": "id",
                "required": true,
                "type": "path"
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
                "name": "id",
                "required": true,
                "type": "path"
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