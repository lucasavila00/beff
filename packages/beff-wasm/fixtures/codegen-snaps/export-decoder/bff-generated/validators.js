

function add_path_to_errors(errors, path) {
  return errors.map((e) => ({ ...e, path: [...path, ...e.path] }));
}
    

const stringPredicates = {}
function registerStringFormat(name, predicate) {
  stringPredicates[name] = predicate;
}
function isCodecInvalid(key, value) {
  if (key === 'Codec::ISO8061') {
    return isNaN(Date.parse(value));
  }
  throw new Error("unknown codec: " + key);
}
function isCustomFormatInvalid(key, value) {
  const predicate = stringPredicates[key];
  if (predicate == null) {
    throw new Error("unknown string format: " + key);
  }
  return !predicate(value);
}

function User(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["age"] != "number") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "number",
                "path": [
                    "User",
                    "age"
                ],
                "received": input["age"]
            });
        }
        if (typeof input["name"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "User",
                    "name"
                ],
                "received": input["name"]
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "User"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function Password(input) {
    let error_acc_0 = [];
    if (isCustomFormatInvalid("password", input)) {
        error_acc_0.push({
            "error_kind": "StringFormatCheckFailed",
            "expected_type": "password",
            "path": [
                "Password"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function StartsWithA(input) {
    let error_acc_0 = [];
    if (isCustomFormatInvalid("StartsWithA", input)) {
        error_acc_0.push({
            "error_kind": "StringFormatCheckFailed",
            "expected_type": "StartsWithA",
            "path": [
                "StartsWithA"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function A(input) {
    let error_acc_0 = [];
    let is_ok_1 = false;
    let error_acc_2 = [];
    if (input != 1) {
        error_acc_2.push({
            "error_kind": "NotEq",
            "expected_value": 1,
            "path": [
                "A"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_2.length === 0;
    let error_acc_3 = [];
    if (input != 2) {
        error_acc_3.push({
            "error_kind": "NotEq",
            "expected_value": 2,
            "path": [
                "A"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_3.length === 0;
    if (!(is_ok_1)) {
        error_acc_0.push({
            "error_kind": "InvalidUnion",
            "path": [
                "A"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function B(input) {
    let error_acc_0 = [];
    let is_ok_1 = false;
    let error_acc_2 = [];
    if (input != 2) {
        error_acc_2.push({
            "error_kind": "NotEq",
            "expected_value": 2,
            "path": [
                "B"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_2.length === 0;
    let error_acc_3 = [];
    if (input != 3) {
        error_acc_3.push({
            "error_kind": "NotEq",
            "expected_value": 3,
            "path": [
                "B"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_3.length === 0;
    if (!(is_ok_1)) {
        error_acc_0.push({
            "error_kind": "InvalidUnion",
            "path": [
                "B"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function D(input) {
    let error_acc_0 = [];
    let is_ok_1 = false;
    let error_acc_2 = [];
    if (input != 4) {
        error_acc_2.push({
            "error_kind": "NotEq",
            "expected_value": 4,
            "path": [
                "D"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_2.length === 0;
    let error_acc_3 = [];
    if (input != 5) {
        error_acc_3.push({
            "error_kind": "NotEq",
            "expected_value": 5,
            "path": [
                "D"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_3.length === 0;
    if (!(is_ok_1)) {
        error_acc_0.push({
            "error_kind": "InvalidUnion",
            "path": [
                "D"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function E(input) {
    let error_acc_0 = [];
    let is_ok_1 = false;
    let error_acc_2 = [];
    if (input != 5) {
        error_acc_2.push({
            "error_kind": "NotEq",
            "expected_value": 5,
            "path": [
                "E"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_2.length === 0;
    let error_acc_3 = [];
    if (input != 6) {
        error_acc_3.push({
            "error_kind": "NotEq",
            "expected_value": 6,
            "path": [
                "E"
            ],
            "received": input
        });
    }
    is_ok_1 = is_ok_1 || error_acc_3.length === 0;
    if (!(is_ok_1)) {
        error_acc_0.push({
            "error_kind": "InvalidUnion",
            "path": [
                "E"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function UnionNestedNamed(input) {
    let error_acc_0 = [];
    let is_ok_1 = false;
    let error_acc_2 = [];
    error_acc_2.push(...add_path_to_errors(validators.A(input), [
        "UnionNestedNamed"
    ]));
    is_ok_1 = is_ok_1 || error_acc_2.length === 0;
    let error_acc_3 = [];
    error_acc_3.push(...add_path_to_errors(validators.B(input), [
        "UnionNestedNamed"
    ]));
    is_ok_1 = is_ok_1 || error_acc_3.length === 0;
    let error_acc_4 = [];
    error_acc_4.push(...add_path_to_errors(validators.D(input), [
        "UnionNestedNamed"
    ]));
    is_ok_1 = is_ok_1 || error_acc_4.length === 0;
    let error_acc_5 = [];
    error_acc_5.push(...add_path_to_errors(validators.E(input), [
        "UnionNestedNamed"
    ]));
    is_ok_1 = is_ok_1 || error_acc_5.length === 0;
    if (!(is_ok_1)) {
        error_acc_0.push({
            "error_kind": "InvalidUnion",
            "path": [
                "UnionNestedNamed"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function NotPublic(input) {
    let error_acc_0 = [];
    if (typeof input == "object" && input != null) {
        if (typeof input["a"] != "string") {
            error_acc_0.push({
                "error_kind": "NotTypeof",
                "expected_type": "string",
                "path": [
                    "NotPublic",
                    "a"
                ],
                "received": input["a"]
            });
        }
    } else {
        error_acc_0.push({
            "error_kind": "NotAnObject",
            "path": [
                "NotPublic"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
function UnionNested(input) {
    let error_acc_0 = [];
    let is_ok_1 = false;
    let error_acc_2 = [];
    error_acc_2.push(...add_path_to_errors(validators.A(input), [
        "UnionNested"
    ]));
    is_ok_1 = is_ok_1 || error_acc_2.length === 0;
    let error_acc_3 = [];
    error_acc_3.push(...add_path_to_errors(validators.B(input), [
        "UnionNested"
    ]));
    is_ok_1 = is_ok_1 || error_acc_3.length === 0;
    let error_acc_4 = [];
    error_acc_4.push(...add_path_to_errors(validators.D(input), [
        "UnionNested"
    ]));
    is_ok_1 = is_ok_1 || error_acc_4.length === 0;
    let error_acc_5 = [];
    error_acc_5.push(...add_path_to_errors(validators.E(input), [
        "UnionNested"
    ]));
    is_ok_1 = is_ok_1 || error_acc_5.length === 0;
    if (!(is_ok_1)) {
        error_acc_0.push({
            "error_kind": "InvalidUnion",
            "path": [
                "UnionNested"
            ],
            "received": input
        });
    }
    return error_acc_0;
}
const validators = {
    User: User,
    Password: Password,
    StartsWithA: StartsWithA,
    A: A,
    B: B,
    D: D,
    E: E,
    UnionNestedNamed: UnionNestedNamed,
    NotPublic: NotPublic,
    UnionNested: UnionNested
};

export default { validators, isCustomFormatInvalid, isCodecInvalid, registerStringFormat, add_path_to_errors };