
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
                "type": "query",
                "name": "name",
                "required": false
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
                "type": "query",
                "name": "a",
                "required": true
            },
            {
                "type": "query",
                "name": "b",
                "required": true
            }
        ],
        "pattern": "/sum"
    }
];

export default { meta };