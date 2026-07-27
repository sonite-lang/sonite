# Language Guide

A narrative introduction to Sonite. For normative rules see the [language specification](spec/README.md).

## Types and variables

Sonite is statically typed with inference:

```sn
let count = 42;           // i32
let pi = 3.14;            // f64
let name: string = "Sonite";
let maybe: string | null = null;
```

Use `const` for bindings that never change. Use `let` when you need reassignment.

## Functions

```sn
function greet(name: string = "World"): void {
    print(`Hello, ${name}!`);
}

function add(a: i32, b: i32): i32 {
    return a + b;
}
```

Every program needs `function main(): void` or `async function main(): void`.

## Structs and classes

Structs are value types:

```sn
struct Point { x: i32; y: i32; }
let p = Point { x: 1, y: 2 };
```

Classes are heap reference types with inheritance:

```sn
class Animal {
    constructor(public name: string) {}
    function speak(): void { print(this.name); }
}
class Dog extends Animal {
    function speak(): void { print("woof"); }
}
let d = new Dog("Rex");
```

## Interfaces

```sn
interface Greeter {
    greet(): void;
}

class Person implements Greeter {
    constructor(public name: string) {}
    function greet(): void { print(`Hi, ${this.name}`); }
}
```

## Generics

```sn
function first<T>(items: T[]): T | null {
    if (items.length == 0) { return null; }
    return items[0];
}
```

## Control flow

`if` / `else`, `while`, `for`, `switch`, `break`, `continue` — familiar C-style syntax.

Type narrowing with `is`:

```sn
if (value is string) {
    print(value.length);  // value is string here
}
```

## Error handling

```sn
try {
    riskyOperation();
} catch (e) {
    print(e.message);
} finally {
    cleanup();
}
```

Throw only `Error` or subclasses.

## Async

```sn
import { sleep } from "std/async";

async function main(): void {
    await sleep(1000);
    print("done");
}
```

See [async.md](async.md).

## Modules

```sn
import { sqrt } from "std/math";
import { helper } from "./utils";
export function publicApi(): void { ... }
```

## Packages

Declare dependencies in `project.toml`, then:

```bash
sn add some-package
sn install
```

See [packages.md](packages.md) and [guides/use-package.md](guides/use-package.md).

## Standard library

Import explicit modules:

```sn
import { readFile, writeFile } from "std/fs";
import { TcpStream } from "std/net";
import { fetch } from "std/http";
```

Prelude methods on strings and arrays load automatically.

## FFI

Call native code with `extern` and `unsafe`. See [ffi.md](ffi.md).

## Next steps

- [Specification index](spec/README.md)
- [Standard library reference](reference/stdlib.md)
- [Examples](../examples/README.md)
