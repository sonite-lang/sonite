# Expressions and Statements

## Variables

```sn
let x = 42;              // inferred i32
let name: string = "hi";
let opt: i32 | null;     // annotated, no initializer
const PI = 3.14;         // immutable binding

let [a, b] = pair;       // tuple destructuring with holes allowed
```

Module-level `export const` / `export let` require initializers for simple names.

Reassignment is allowed for `let` only: `=`, `+=`, `-=`, `++`, `--` on numeric types.

## Functions

```sn
function add(a: i32, b: i32): i32 {
    return a + b;
}

function greet(name: string = "World"): void {
    print(`Hello ${name}!`);
}

function configure(host: string, port: i32 = 8080, secure: bool = false): void { ... }
```

Named arguments:

```sn
createPerson(age: 16, name: "Ethan");
configure(host, secure: true);
```

Defaults and named args apply only to **direct** function/method references, not through function-typed values.

## Lambdas and closures

```sn
let add = (a: i32, b: i32) => a + b;
let double = (n: i32): i32 => { return n * 2; };
```

- Contextual typing from expected function type
- `let` captures are by reference (heap boxes)
- `const` captures are by value
- Generic lambdas are not supported

## Control flow

### Conditional

```sn
if (x > 0) { ... }
else if (x < 0) { ... }
else { ... }
```

### Loops

```sn
while (cond) { ... }

for (let i = 0; i < n; i = i + 1) { ... }

for (item in items) { ... }   // element iteration over arrays
```

### Switch

```sn
switch (value) {
    case 1: ...
    case 2: ...
    default: ...
}
```

### Jump

`break`, `continue`, `return`

## Expressions

- Function calls, method calls, indexing, field access
- `typeof expr` — returns type tag string (`"string"`, `"i32"`, `"bool"`, `"null"`, `"object"`, …)
- `expr is Type` — type check with narrowing
- `new ClassName(args)` — class construction
- `print(...)`, `console.log` / `console.error` / `console.warn`, `console.readLine()`

## Struct literals and methods

```sn
struct Point { x: i32; y: i32; }
let p = Point { x: 1, y: 2 };
p.x = 3;
```

Instance methods on structs and classes use `this`.

## Extension methods

```sn
export function contains(this: string, needle: string): bool { ... }
"hello".contains("ell");
```

Prelude and std modules may define extension methods on built-in types.

## Statements

Expression statements, variable declarations, control flow, `return`, `throw`, blocks `{ ... }`.

## Entry point

Exactly one `function main(): void` or `async function main(): void` at module level (or project entry).
