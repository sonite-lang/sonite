# Read and write files

Use `std/fs` for paths, reading, and writing. Try [`examples/filestream.sn`](../../examples/filestream.sn):

```bash
sn run examples/filestream.sn
```

Typical pattern:

```sn
import { readTextFile, writeTextFile } from "std/fs";

function main(): void {
    writeTextFile("out.txt", "hello");
    print(readTextFile("out.txt"));
}
```

API details: [stdlib reference](../reference/stdlib.md) (`std/fs`, `std/io`).
