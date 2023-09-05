
const meta = [
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "name",
                "required": true,
                "type": "path"
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
                "name": "uuid",
                "required": true,
                "type": "path"
            },
            {
                "name": "p",
                "required": true,
                "type": "query"
            }
        ],
        "pattern": "/check-uuid/{uuid}"
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            }
        ],
        "pattern": "/UnionNested"
    },
    {
        "method_kind": "get",
        "params": [
            {
                "type": "context"
            }
        ],
        "pattern": "/UnionNestedInline"
    }
];

export default { meta };