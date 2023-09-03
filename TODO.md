## BFF Lib

## BFF Core

## BFF EXT

- [ ] big parent error message

## BFF Core

- [ ] if it uses `*`, then it can just use use
- [ ] only allow simple openapi patterns, no explode
- [ ] disallow `/{param}asd/`
- [ ] check string format was registered
- [ ] add many lazy string formats
- [ ] assert header etc is imported from lib
- [ ] todo!, unwrap, panic

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

## BFF Core

nested namespaces

```
// export namespace SomeNamespace2 {
//   export namespace Nested {
//     export type SomeType3 = {
//       id: string;
//     };
//   }
//   export type SomeType2 = Nested.SomeType3;
// }

```

## BFF CLI

- [ ] watch mode

## next

- [ ] future tuple args

- [ ] typeof

```
const x = ["a", "b", "c"] as const;
type X = (typeof x)[number]
```

- [ ] eslint to catch skipped tests
