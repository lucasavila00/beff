## BFF Core

- [ ] check string format was registered
- [ ] add many lazy string formats
- [ ] assert header etc is imported from lib
- [ ] disallow GET body?
- [ ] error messages

- [ ] watch mode
- [ ] resolver tsconfig

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
