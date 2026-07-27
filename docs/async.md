# Async and Await

Sonite provides cooperative async/await on a single-threaded runtime with an integrated event loop for I/O.

## Basic usage

```sn
import { sleep } from "std/async";

async function main(): void {
    print("start");
    await sleep(1000);
    print("done");
}
```

## Spawning tasks

```sn
import { spawn, all, race, timeout } from "std/async";

async function worker(): void {
    await sleep(500);
}

async function main(): void {
    let a = spawn(worker());
    let b = spawn(worker());
    await all([a, b]);

    await timeout(worker(), 2000);
}
```

## Async I/O

Network and file APIs are async:

```sn
import { TcpStream } from "std/net";
import { readFile } from "std/fs";

async function main(): void {
    let stream = await TcpStream.connect("127.0.0.1:8080");
    await stream.write(Bytes.fromString("ping"));
    let data = await stream.read();
    await stream.close();
}
```

`ByteStream` is the common interface for TCP, TLS, file streams, and HTTP bodies.

## Error handling across await

```sn
async function main(): void {
    try {
        await mightFail();
    } catch (e) {
        print(e.message);
    }
}
```

`try` / `catch` / `finally` may span `await`.

## HTTP

```sn
import { fetch } from "std/http";

async function main(): void {
    let response = await fetch("https://example.com");
    let text = await response.body.readText();
    print(text);
}
```

See [networking.md](networking.md).

## Semantics

- Tasks interleave at `await` points only (cooperative)
- Cancelling a stream read cancels that future, not the whole stream
- Interface-typed locals survive `await`

## Specification

Normative details: [spec/async.md](spec/async.md)

## Examples

- `examples/async-sleep.sn`
- `examples/async-concurrent.sn`
- `examples/async-tcp.sn`
- `examples/http-fetch.sn`
