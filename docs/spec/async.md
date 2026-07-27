# Async and Await

## Async functions

```sn
async function fetchData(): string {
    await sleep(100);
    return "done";
}
```

- `async` functions return `Future<T>` where `T` is the declared return type
- `await` is permitted only inside `async` functions
- `main` may be `async function main(): void`

## Futures

`Future<T>` represents a cooperative task that will produce `T` or throw on failure/cancellation.

```sn
import { sleep, spawn, all, race, timeout } from "std/async";

let fut = spawn(fetchData());
await fut;
```

## Task lifecycle

- Tasks are **cooperative** and **single-threaded** by default
- The runtime event loop drives I/O (TCP, UDP, DNS, TLS, timers, file streams)
- Stackless suspension via `sn_task_await_suspend` — no nested event-loop deadlocks
- Cancelling a suspended stream await cancels only that `Future`; the stream stays open

## Error propagation

- Exceptions thrown before an `await` propagate normally
- `try` / `catch` / `finally` may span `await` — exception handling is re-established on resume
- Failed or cancelled futures throw when awaited

## Concurrency semantics

- Multiple concurrent tasks interleave at `await` points
- No preemptive threads in user code; `spawn` schedules work on the same runtime
- Interface fat-pointer locals survive `await` (two frame slots)

## Async I/O

Network and file stream APIs return `Future` and use `ByteStream`:

```sn
let stream = await TcpStream.connect("127.0.0.1:8080");
let bytes = await stream.read();
```

## Cancellation

Explicit cancellation of in-flight futures is supported where the runtime API documents it. Stream-level cancellation affects only the awaiting future.

## Limitations

- No multi-threaded `async` tasks in user code
- Async task inspection in the debugger uses runtime registry; DAP polling is deferred
