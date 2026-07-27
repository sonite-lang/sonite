# TLS and HTTPS

Sonite bundles OpenSSL with the runtime for TLS support.

## TLS streams

```sn
import { TlsStream, TlsConfig, Certificate, PrivateKey } from "std/tls";

async function main(): void {
    let config = TlsConfig.client();
    let tls = await TlsStream.connect("example.com:443", config);
    await tls.write(Bytes.fromString("GET / HTTP/1.1\r\nHost: example.com\r\n\r\n"));
    let response = await tls.read();
    await tls.close();
}
```

`TlsStream` implements `ByteStream`.

## HTTPS server

```sn
import { Server } from "std/http";
import { Certificate, PrivateKey } from "std/tls";

async function main(): void {
    let cert = Certificate.fromPem(readFile("cert.pem"));
    let key = PrivateKey.fromPem(readFile("key.pem"));

    let server = new Server();
    server.get("/", async (req, res) => { res.text("secure"); });
    await server.listenTls("127.0.0.1:8443", cert, key);
}
```

## Certificate verification

TLS client connections verify server certificates by default. Use `TlsConfig` options to customize verification for development (see `examples/async-tls.sn`, `examples/https-server.sn`).

## HTTP over TLS

`fetch("https://...")` uses TLS automatically. `Server.listenTls` serves HTTPS.

## Errors

TLS failures throw `TlsError` from `std/errors`.

## Examples

- `examples/async-tls.sn`
- `examples/https-server.sn`
- `examples/certs/` — test certificate fixtures

## Build note

The runtime must be built with OpenSSL (`pnpm --filter @sonite/runtime openssl`) for TLS support. Published packages include prebuilt TLS-enabled runtimes.
