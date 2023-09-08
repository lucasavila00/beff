## BFF Core

- [ ] watch mode
- [ ] resolver tsconfig

- [ ] todo!, unwrap

<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->

## BFF EXT

- [ ] big parent error message

## BFF Core

- [ ] error messages

remove the need for this hack

```
const prettyPrintValue = (it: unknown): string => {
  if (isCoercionFailure(it)) {
    return prettyPrintValue(it.original);
  }

```

## BFF Lib

- [ ] logger plugin, integrated into app

<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->
<!--  -->

FastMJPG is currently in a public alpha state. It is feature complete, and all known bugs have been fixed, though more issues are expected to be discovered as it is used by more people. It is not recommended for use in critical production environments at this time.

## next

forms, html apps

form urlencoded
form data

- [ ] openapi auth

## BFF Core

- [ ] future tuple args

- [ ] typeof

```
const x = ["a", "b", "c"] as const;
type X = (typeof x)[number]
```

- [ ] eslint to catch skipped tests
- [ ] assert header etc is imported from lib
