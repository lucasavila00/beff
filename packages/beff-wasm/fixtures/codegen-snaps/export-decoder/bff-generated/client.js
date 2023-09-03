const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "path",
                "name": "name",
                "required": true
            }
        ],
        "pattern": "/{name}"
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "type": "path",
                "name": "uuid",
                "required": true
            },
            {
                "type": "query",
                "name": "p",
                "required": true
            }
        ],
        "pattern": "/check-uuid/{uuid}"
    }
];

export { meta };