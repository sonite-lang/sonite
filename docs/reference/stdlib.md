# Standard Library Reference

Import standard library modules explicitly:

```sn
import { sqrt } from "std/math";
```

The **prelude** (string, array, number, bool, nullable, io, bytes extensions) is auto-loaded — no import required.

## Prelude

### string extensions

`contains`, `startsWith`, `endsWith`, `substring`, `slice`, `split`, `trim`, `trimStart`, `trimEnd`, `replace`, `replaceAll`, `toUpperCase`, `toLowerCase`, `indexOf`, `lastIndexOf`, `charAt`, `isEmpty`, `repeat`, `padStart`, `padEnd`, `join`

### array extensions

`push`, `pop`, `peek`, `first`, `last`, `isEmpty`, `indexOf`, `includes`, `map`, `filter`, `reduce`, `find`, `findIndex`, `some`, `every`, `forEach`, `reverse`, `slice`, `sort` (i32), `join` (string[]), `concat`

### number extensions

`toString` on `i32`, `i64`, `f32`, `f64`

### bool extensions

`toString`

### nullable

`isNull`, `isNotNull`

### Builtins

`print(...)`, `console.log` / `console.error` / `console.warn`, `console.readLine()`, `createMap()`

## std/math

| Symbol | Signature |
|--------|-----------|
| `abs`, `min`, `max`, `clamp`, `floor`, `ceil`, `round`, `sqrt`, `pow`, `log`, `exp` | `(f64...) => f64` |
| `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2` | trig on `f64` |
| `absI32`, `absI64`, `minI32`, `maxI32`, `minI64`, `maxI64` | integer variants |
| `PI`, `E`, `TAU` | constants |
| `pi()`, `e()` | constant accessors |

## std/random

| Symbol | Description |
|--------|-------------|
| `random()` | `f64` in [0, 1) |
| `randomInt(min, max)` | inclusive `i32` |
| `randomFloat(min, max)` | `f64` |
| `randomBool()` | `bool` |
| `seed(value)` | reseed PRNG |

*Not cryptographically secure.*

## std/collections

| Class | Description |
|-------|-------------|
| `Stack<T>` | LIFO |
| `Queue<T>` | FIFO |
| `Deque<T>` | double-ended |
| `Set<T>` | unique values |
| `List<T>` | dynamic list |
| `Map` | string-keyed map |

## std/encoding

| Function | Description |
|----------|-------------|
| `byteLength`, `isValid` | UTF-8 |
| `base64Encode`, `base64Decode` | Base64 |
| `hexEncode`, `hexDecode` | Hex |

## std/bytes

| Class | Description |
|-------|-------------|
| `Bytes` | Length-prefixed binary buffer; `fromString`, `read`, `write` helpers |

## std/io

| Symbol | Description |
|--------|-------------|
| `ByteStream` | Async `read()` / `write()` / `close()` interface |
| `readLine()` | Sync stdin line |
| `write`, `writeError` | Stdout/stderr helpers |
| `STREAM_DEFAULT_CHUNK` | Default read size (65536) |

## std/fs

| Function | Description |
|----------|-------------|
| `readFile`, `writeFile`, `appendFile` | File I/O |
| `exists`, `deleteFile`, `copyFile`, `moveFile` | File ops |
| `size`, `isFile`, `isDirectory`, `stat` | Metadata |
| `createDirectory`, `deleteDirectory`, `listDirectory` | Directories |
| `join`, `basename`, `dirname`, `extension`, `normalize`, `absolute`, `isAbsolute`, `relative`, `resolve` | Paths |
| `FileStream` | Async file `ByteStream` |

## std/os

| Function | Returns |
|--------|---------|
| `platform()` | `"linux"`, `"macos"`, `"windows"` |
| `architecture()` | `"x64"`, `"arm64"` |

## std/process

| Function | Description |
|----------|-------------|
| `args()` | Command-line arguments |
| `getEnv`, `setEnv` | Environment |
| `cwd()` | Current directory |
| `exit(code)` | Terminate process |

## std/time

| Symbol | Description |
|--------|-------------|
| `Instant`, `Duration` | Time types |
| `now()` | Current instant |
| `sleep(ms)` | Async sleep |
| `sleepSync(ms)` | Blocking sleep |

## std/async

| Function | Description |
|----------|-------------|
| `sleep(ms)` | Async delay |
| `spawn(fut)` | Schedule future |
| `all(futures)` | Wait for all |
| `race(futures)` | First to complete |
| `timeout(work, ms)` | Timeout wrapper |

## std/errors

| Class | Description |
|-------|-------------|
| `FileNotFound` | Missing file |
| `PermissionDenied` | Access denied |
| `ConnectionRefused` | TCP refused |
| `ConnectionReset` | Connection reset |
| `Timeout` | Operation timed out |
| `DnsFailure` | DNS error |
| `TlsError` | TLS failure |

All extend `Error`.

## std/net

| Type | Description |
|------|-------------|
| `Ipv4Address`, `Ipv6Address`, `IpAddress`, `SocketAddress` | Address types |
| `TcpStream`, `TcpListener` | TCP client/server |
| `UdpSocket`, `UdpPacket` | UDP |
| `resolve(host)` | DNS → `IpAddress[]` |
| `lookupHost(host)` | DNS → host strings |

All network I/O is async (`Future`).

## std/tls

| Type | Description |
|------|-------------|
| `Certificate`, `PrivateKey` | PEM loading |
| `TlsConfig` | Client/server config |
| `TlsStream` | TLS `ByteStream` |

## std/http

| Type | Description |
|------|-------------|
| `Headers`, `URL`, `Body`, `Request`, `Response` | HTTP types |
| `Server` | Async HTTP/HTTPS server |
| `HttpClient` | Low-level client |
| `fetch`, `fetchInit`, `fetchRequest`, `fetchWith` | High-level client |

Supports HTTP/1.1, streaming bodies, chunked encoding, static file helpers, middleware (`use`, `useHeader`).

## std/json

| Symbol | Description |
|--------|-------------|
| `Json` | JSON value type |
| `stringify`, `stringifyString`, `stringifyNumber`, `stringifyBool`, `stringifyNull`, `stringifyStringMap`, `stringifyStringArray` | Serialization only |

**No JSON parser in the core library.** See [stdlib-stability.md](../stdlib-stability.md).

## Examples

See [examples/README.md](../../examples/README.md) and `examples/std-*.sn`.
