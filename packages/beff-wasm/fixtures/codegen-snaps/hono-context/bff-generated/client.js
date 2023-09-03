
const meta = [
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
    }
];

export default { meta };