
const meta = [
    {
        "method_kind": "use",
        "params": [],
        "pattern": "/*"
    },
    {
        "method_kind": "post",
        "params": [
            {
                "type": "context"
            },
            {
                "name": "data",
                "required": true,
                "type": "body"
            }
        ],
        "pattern": "/compare_schemas"
    }
];

export default { meta };