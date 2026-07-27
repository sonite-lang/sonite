# Lexical Structure

## Source files

Sonite source files use the `.sn` extension. A program consists of a sequence of Unicode characters encoded as UTF-8.

## Comments

```sn
// Line comment

/* Block comment */
```

Comments are ignored by the lexer.

## Identifiers

Identifiers match `[A-Za-z_][A-Za-z0-9_]*`. They are case-sensitive.

## Keywords

Reserved keywords (cannot be used as identifiers):

```
function struct enum class interface type this new extends implements super
abstract public private readonly static constructor
import export extern from as
let const return true false
if else elseif while for break continue switch case default
throw try catch finally in
keyof typeof null is
async await unsafe
```

## Literals

### Integers

Decimal integer literals infer as `i32` unless annotated or context requires another integer type.

### Floats

Floating-point literals infer as `f64`.

### Booleans

`true`, `false`

### Strings and characters

Double-quoted strings: `"hello"`. Single-quoted characters: `'a'`.

### Template literals

Backtick strings with `${expression}` interpolation:

```sn
let msg = `Hello ${name}!`;
```

Interpolated values are converted to string via `toString` / runtime string conversion.

### Null

`null` is the null literal, assignable to nullable types (`T | null`).

## Operators

| Category | Operators |
|----------|-----------|
| Arithmetic | `+` `-` `*` `/` `%` |
| Compound assign | `+=` `-=` |
| Increment/decrement | `++` `--` (numeric `let` only) |
| Comparison | `==` `!=` `<` `<=` `>` `>=` |
| Logical | `&&` `\|\|` `!` |
| Assignment | `=` |
| Type | `is` (type check), `as` (cast in unsafe) |
| Member | `.` |
| Index | `[]` |
| Call | `()` |
| Null coalescing | *not supported* |

String concatenation uses `+`.

## Delimiters

`( ) { } [ ] , ; :`

## Entry point

A complete program requires a top-level:

```sn
function main(): void { ... }
// or
async function main(): void { ... }
```

`main` takes no parameters. The return type is required.

## Precedence

From highest to lowest (informative):

1. Member access, call, index
2. Unary `!`, `++`, `--`
3. Multiplicative `*` `/` `%`
4. Additive `+` `-`
5. Comparison `<` `<=` `>` `>=`
6. Equality `==` `!=`
7. Logical AND `&&`
8. Logical OR `||`
9. Assignment `=`, `+=`, `-=`
