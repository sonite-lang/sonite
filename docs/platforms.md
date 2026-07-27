# Cross-Platform Development

## Supported targets

| OS | Architecture | Status |
|----|--------------|--------|
| Linux | x64 | Supported |
| Linux | ARM64 | Supported |
| macOS | x64 | Supported |
| macOS | ARM64 | Supported |
| Windows | x64 | Supported |
| Windows | ARM64 | Deferred |

## Platform detection

```sn
import { platform, architecture } from "std/os";

function main(): void {
    print(platform());      // "linux", "macos", or "windows"
    print(architecture());  // "x64" or "arm64"
}
```

## Path handling

Use `std/fs` path helpers for cross-platform paths:

```sn
import { join, normalize, isAbsolute } from "std/fs";
```

Prefer forward slashes in string literals; the runtime normalizes per platform.

## Line endings

Sonite source uses `\n`. String I/O preserves platform conventions where the OS API does.

## Native dependencies

Platform-specific native libraries in `project.toml`:

```toml
[native.linux-x64]
libraries = ["dl"]

[native.macos-arm64]
libraries = ["c"]
```

See [native-packages.md](native-packages.md).

## Windows notes

- Build produces `.exe` binaries
- Path separators handled by stdlib
- LLDB-based debugging uses bundled lldb-dap when available

## CI validation

Cross-platform CI runs on all five supported targets. See `.github/workflows/native-toolchain.yml`.

## Developing on unsupported platforms

If `@sonite/llvm` cannot select a native package, `sn` prints which platforms are supported. Cross-compilation from a different host is not supported; compile on a matching native host.
