
const meta = [
    {
        "method_kind": "use",
        "params": [],
        "pattern": "/*"
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "name",
                "required": false,
                "type": "query"
            }
        ],
        "pattern": "/greeting"
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "a",
                "required": true,
                "type": "query"
            },
            {
                "name": "b",
                "required": true,
                "type": "query"
            }
        ],
        "pattern": "/sum"
    }
];

export default { meta };