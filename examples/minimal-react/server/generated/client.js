
const meta = [
    {
        "method_kind": "use",
        "params": [],
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
                "name": "name",
                "required": false
            }
        ],
        "pattern": "/greeting"
    }
];

export default { meta };