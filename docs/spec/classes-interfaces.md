# Classes, Structs, Interfaces, and Enums

## Structs

Value types with fields and instance methods:

```sn
struct Person {
    name: string;
    age: i32;

    function greet(): void {
        print(`Hi, ${this.name}`);
    }
}
```

Structs are copied on assignment. Field layout follows platform ABI for non-FFI structs.

## Classes

Heap reference types:

```sn
class Animal {
    public name: string;
    private age: i32;

    constructor(name: string, age: i32) {
        this.name = name;
        this.age = age;
    }

    function speak(): void { ... }
}

class Dog extends Animal {
    function speak(): void { print("woof"); }
}
```

Features:

- `new`, constructors, `extends`, `super`
- `public` / `private`, `readonly`, `static`
- `abstract` classes (cannot instantiate)
- Instance and static fields and methods

## Interfaces

```sn
interface Drawable {
    draw(): void;
}

class Circle implements Drawable {
    function draw(): void { ... }
}
```

- Method contracts with `implements` / `extends`
- Optional index signatures: `[key: string]: T`
- Compile-time compliance checks
- Values typed as an interface use fat-pointer dynamic dispatch

Interfaces may declare `async` methods; implementations must match async-ness.

## Enums

```sn
enum Color {
    Red,
    Green,
    Blue,
}
```

Enums are value types with discriminant integers assigned sequentially from zero unless specified.

## Visibility

- `public` / `private` on class members
- Module-level declarations without `export` are private to the module
- Only `export`ed declarations are importable from other modules

## Dispatch

- Struct methods: static dispatch
- Class methods: virtual dispatch when overridden
- Interface calls: fat-pointer dynamic dispatch
