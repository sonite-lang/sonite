# Type System

## Primitive types

| Type | Description |
|------|-------------|
| `i8`, `i16`, `i32`, `i64` | Signed integers |
| `u8`, `u16`, `u32`, `u64` | Unsigned integers |
| `isize`, `usize` | Platform-sized integers |
| `f32`, `f64` | Floating point |
| `bool` | Boolean |
| `char` | Unicode scalar (UTF-32 code unit) |
| `string` | Immutable UTF-8 string (reference type) |
| `void` | Absence of value (functions only) |
| `null` | Null type literal |

## Composite types

| Syntax | Description |
|--------|-------------|
| `T[]` | Dynamic array |
| `[T, U, ...]` | Fixed-length tuple |
| `struct Name { ... }` | Value type product |
| `class Name { ... }` | Heap reference type |
| `interface Name { ... }` | Method contract |
| `enum Name { ... }` | Enumeration |
| `(T, U) => R` | Function type |
| `Future<T>` | Async result handle |
| `Ptr<T>`, `FnPtr<(...) => R>`, `T[N]` | FFI types |

## Value vs reference types

- **Value types:** primitives, structs, enums — copied on assignment/pass
- **Reference types:** classes, strings, arrays, interfaces — heap-allocated, GC-managed

See [runtime.md](runtime.md) and [MEMORY_MODEL.md](../../MEMORY_MODEL.md).

## Nullability

Types may include `| null`:

```sn
let x: string | null = null;
```

Control-flow narrowing:

- `== null` / `!= null`
- `value is Type` (including `is null`)
- `typeof value == "string"` (and other type tags)
- Early `return`, `break`, `continue` refines types in subsequent code

## Type aliases

```sn
type Id = i64;
type Result = string | null;
type Handler = (string) => void;
```

Generic aliases, unions (`|`), intersections (`&`), literal types, `keyof`, `typeof`, conditional and mapped types are supported.

## Unions and intersections

```sn
type StringOrNumber = string | i32;
type Named = { name: string } & { age: i32 };
```

## Index signatures

String-keyed maps:

```sn
type StringMap = { [key: string]: i32 };
```

Use `createMap()` builtin to allocate an empty map.

## Type inference

- Integer literals → `i32`
- Float literals → `f64`
- Array literals → common element type
- Function return types may be inferred when body is present
- Lambdas use contextual typing from expected function type

## Type compatibility

Assignment and argument passing require compatible types:

- Identical types assign directly
- Subtyping applies for classes (`Derived` → `Base`) and interfaces
- `null` assigns to `T | null`
- Numeric types do not implicitly widen/narrow without explicit annotation
- Function types are compatible when parameter and return types match (contravariant parameters in structural checks)

## Explicit conversions

- `as` casts in `unsafe` blocks for pointer/integer conversions
- No implicit string-to-number conversion

## Unsupported

- Function overloads (duplicate names rejected)
- Implicit boolean-to-number conversion
