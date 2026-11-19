---
"@beff/cli": major
"@beff/client": major
---

Each generated parser module now keeps its own custom formats. Before, all modules used one shared table, so two modules with a format of the same name used the implementation from the last `buildParsers` call. `registerStringFormatter` and `registerNumberFormatter` in `@beff/client/codegen-v2` now take the format table as the first argument, and `StringWithFormatRuntype` and `NumberWithFormatRuntype` are now the abstract classes `BaseStringWithFormatRuntype` and `BaseNumberWithFormatRuntype`. Generated files from older versions do not work with this version of `@beff/client`.
