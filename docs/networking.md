# Networking

Sonite's standard library provides async TCP, UDP, DNS, HTTP, and TLS.

## TCP

```sn
import { TcpListener, TcpStream } from "std/net";

async function main(): void {
    let listener = await TcpListener.bind("127.0.0.1:8080");
    let stream = await listener.accept();
    await stream.write(Bytes.fromString("hello\n"));
    await stream.close();
}
```

## UDP

```sn
import { UdpSocket } from "std/net";

async function main(): void {
    let sock = await UdpSocket.bind("0.0.0.0:9000");
    let packet = await sock.recvFrom();
    await sock.sendTo(packet.data, packet.address);
}
```

## DNS

```sn
import { resolve } from "std/net";

async function main(): void {
    let addrs = await resolve("example.com");
}
```

## HTTP client

```sn
import { fetch, fetchInit } from "std/http";
import { Headers } from "std/http";

async function main(): void {
    let res = await fetch("http://example.com");
    let body = await res.body.readText();

    let headers = new Headers();
    headers.set("Content-Type", "application/json");
    let post = await fetchInit("http://api.example.com/data", "POST", headers, Bytes.fromString("{}"));
}
```

## HTTP server

```sn
import { Server } from "std/http";

async function main(): void {
    let server = new Server();
    server.get("/", async (req, res) => {
        res.text("Hello");
    });
    await server.listen("127.0.0.1:8080");
}
```

Streaming responses use `Response.stream` / `ByteStream`.

## ByteStream

All stream types implement `ByteStream`:

```sn
import { ByteStream } from "std/io";

async function drain(stream: ByteStream): void {
    while (true) {
        let chunk = await stream.read();
        if (chunk.length == 0) { break; }
    }
}
```

Empty `Bytes` from `read()` means EOF.

## Errors

Network failures throw `std/errors` types: `ConnectionRefused`, `ConnectionReset`, `Timeout`, `DnsFailure`.

## Examples

| Example | Description |
|---------|-------------|
| `async-tcp.sn` | TCP client/server |
| `async-udp.sn` | UDP |
| `async-dns.sn` | DNS lookup |
| `http-server.sn` | HTTP server |
| `http-fetch.sn` | HTTP client |
| `http-handlers.sn` | Middleware and routes |
| `http-stream-*.sn` | Streaming bodies |

## HTTPS

See [tls-https.md](tls-https.md).
