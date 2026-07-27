# Generics

## Generic declarations

Type parameters appear in angle brackets:

```sn
struct Box<T> {
    value: T;
}

function identity<T>(value: T): T {
    return value;
}

class Container<T> {
    items: T[];
}

interface Comparable<T> {
    compare(other: T): i32;
}
```

## Constraints

```sn
function max<T extends Comparable<T>>(a: T, b: T): T { ... }
```

`T extends I` requires `T` to satisfy interface `I`. Multiple constraints use intersection syntax where supported.

## Type inference

At call sites, type arguments may be inferred:

```sn
let b = Box<i32> { value: 42 };
let id = identity(42); // T = i32
```

Nested type arguments and method calls participate in inference.

## Monomorphisation

Generics are **compile-time only**. The compiler generates specialized copies for each concrete instantiation. There is no runtime type information for generic parameters.

## Generic methods

Instance and static methods may be generic on classes and structs:

```sn
class List<T> {
    function map<U>(fn: (T) => U): List<U> { ... }
}
```

## Limitations

- Generic lambdas are **not supported** — use named functions with explicit type parameters
- Generic constraints on lambdas are not supported

## Runtime behaviour

Monomorphised code uses the same ABI as manually written specialized types. No boxing of type parameters occurs unless the concrete type is already a reference type.
